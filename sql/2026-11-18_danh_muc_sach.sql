-- CHẠY TRÊN NEON (node scripts/chay-sql.mjs sql/2026-11-18_danh_muc_sach.sql hoặc Neon → SQL Editor). Chạy lại được.
-- Giai đoạn 1: danh mục sách — chủ đề, sách, sách–chủ đề (tối đa 2 chủ đề / sách) + RLS + hàm nhập danh mục từ Excel.
-- Ai đăng nhập cũng xem sách (HS / GV không thấy sách "ẩn"); chỉ nhân viên (quản trị, thủ thư) thêm / sửa / xoá.
-- Sau khi chạy: Neon → Data API → Refresh schema cache.

create extension if not exists unaccent;
create extension if not exists pg_trgm;

-- Bỏ dấu + chữ thường để tìm "de men" ra "Dế Mèn". unaccent có tham số từ điển cố định → an toàn khi khai báo immutable.
create or replace function public.bo_dau(t text) returns text
language sql immutable parallel safe set search_path = public as $$
  select lower(public.unaccent('public.unaccent'::regdictionary, coalesce(t, '')))
$$;

-- ───────────── Bảng ─────────────
create table if not exists public.chu_de (
  id      bigint generated always as identity primary key,
  ten     text not null check (length(trim(ten)) between 1 and 50),
  thu_tu  smallint not null default 0
);
create unique index if not exists chu_de_ten_uniq on public.chu_de (lower(ten));

create table if not exists public.sach (
  id          bigint generated always as identity primary key,
  ma_sach     text not null unique check (ma_sach ~ '^[A-Z0-9._-]{1,30}$'),
  ten         text not null check (length(trim(ten)) between 1 and 200),
  tac_gia     text check (length(tac_gia) <= 150),
  nxb         text check (length(nxb) <= 100),
  nam         smallint check (nam between 1900 and 2100),
  khoi_tu     smallint not null default 1 check (khoi_tu between 1 and 5),
  khoi_den    smallint not null default 5 check (khoi_den between 1 and 5),
  so_ban      smallint not null default 1 check (so_ban between 0 and 999),
  vi_tri      text check (length(vi_tri) <= 50),
  gioi_thieu  text check (length(gioi_thieu) <= 600),
  anh_bia     text check (anh_bia ~ '^https://' and length(anh_bia) <= 300),   -- chỉ link https (chặn "javascript:")
  an          boolean not null default false,          -- ẩn với học sinh (sách hỏng, chưa xếp kệ...)
  tim         text generated always as (public.bo_dau(ten || ' ' || coalesce(tac_gia, '') || ' ' || ma_sach)) stored,
  tao_luc     timestamptz not null default now(),
  sua_luc     timestamptz not null default now(),
  check (khoi_tu <= khoi_den)
);
create index if not exists sach_tim_trgm on public.sach using gin (tim gin_trgm_ops);
create index if not exists sach_khoi_idx on public.sach (khoi_tu, khoi_den) where not an;

create table if not exists public.sach_chu_de (
  sach_id    bigint not null references public.sach(id) on delete cascade,
  chu_de_id  bigint not null references public.chu_de(id) on delete cascade,
  primary key (sach_id, chu_de_id)
);
create index if not exists sach_chu_de_cd_idx on public.sach_chu_de (chu_de_id, sach_id);

-- Tối đa 2 chủ đề / sách — máy chủ kiểm, kể cả khi ghi thẳng bảng
create or replace function public.kiem_toi_da_chu_de() returns trigger
language plpgsql set search_path = public as $$
begin
  if (select count(*) from public.sach_chu_de where sach_id = new.sach_id) >= 2 then
    raise exception 'qua_2_chu_de';
  end if;
  return new;
end $$;
drop trigger if exists sach_chu_de_toi_da on public.sach_chu_de;
create trigger sach_chu_de_toi_da before insert on public.sach_chu_de
  for each row execute function public.kiem_toi_da_chu_de();

-- ───────────── RLS ─────────────
alter table public.chu_de      enable row level security;
alter table public.sach        enable row level security;
alter table public.sach_chu_de enable row level security;

drop policy if exists chu_de_xem on public.chu_de;
create policy chu_de_xem on public.chu_de for select to authenticated using ((select public.vai_tro_cua_toi()) is not null);
drop policy if exists chu_de_ghi on public.chu_de;
create policy chu_de_ghi on public.chu_de for all to authenticated
  using ((select public.la_nhan_vien())) with check ((select public.la_nhan_vien()));

-- Sách: nhân viên thấy tất cả; người khác (đang hoạt động) chỉ thấy sách không ẩn
drop policy if exists sach_xem on public.sach;
create policy sach_xem on public.sach for select to authenticated using (
  (select public.la_nhan_vien()) or (not an and (select public.vai_tro_cua_toi()) is not null)
);
drop policy if exists sach_ghi on public.sach;
create policy sach_ghi on public.sach for all to authenticated
  using ((select public.la_nhan_vien())) with check ((select public.la_nhan_vien()));

drop policy if exists sach_chu_de_xem on public.sach_chu_de;
create policy sach_chu_de_xem on public.sach_chu_de for select to authenticated using ((select public.vai_tro_cua_toi()) is not null);
drop policy if exists sach_chu_de_ghi on public.sach_chu_de;
create policy sach_chu_de_ghi on public.sach_chu_de for all to authenticated
  using ((select public.la_nhan_vien())) with check ((select public.la_nhan_vien()));

-- ───────────── Hàm máy chủ ─────────────
-- Nhập danh mục (tối đa 500 sách / lần). Trùng mã sách → cập nhật (ô trống giữ giá trị cũ), không tạo bản trùng.
-- chu_de: mảng tên (≤ 2); tên chưa có → tạo mới (tổng số chủ đề ≤ 30). Trả {them, sua}.
create or replace function public.nhap_danh_muc(p_ds jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb; v_id bigint; v_moi boolean; v_them int := 0; v_sua int := 0; cd text; cd_id bigint;
begin
  if not public.la_nhan_vien() then raise exception 'forbidden'; end if;
  if jsonb_typeof(p_ds) <> 'array' or jsonb_array_length(p_ds) > 500 then raise exception 'qua_nhieu_dong'; end if;
  for r in select * from jsonb_array_elements(p_ds) loop
    insert into public.sach as s (ma_sach, ten, tac_gia, nxb, nam, khoi_tu, khoi_den, so_ban, vi_tri, gioi_thieu)
    values (upper(trim(r->>'ma_sach')), trim(r->>'ten'), nullif(trim(r->>'tac_gia'), ''), nullif(trim(r->>'nxb'), ''),
      (r->>'nam')::smallint, coalesce((r->>'khoi_tu')::smallint, 1), coalesce((r->>'khoi_den')::smallint, 5),
      coalesce((r->>'so_ban')::smallint, 1), nullif(trim(r->>'vi_tri'), ''), nullif(trim(r->>'gioi_thieu'), ''))
    on conflict (ma_sach) do update set
      ten = excluded.ten, tac_gia = coalesce(excluded.tac_gia, s.tac_gia), nxb = coalesce(excluded.nxb, s.nxb),
      nam = coalesce(excluded.nam, s.nam), khoi_tu = excluded.khoi_tu, khoi_den = excluded.khoi_den,
      so_ban = excluded.so_ban, vi_tri = coalesce(excluded.vi_tri, s.vi_tri),
      gioi_thieu = coalesce(excluded.gioi_thieu, s.gioi_thieu), sua_luc = now()
    returning s.id, (s.xmax = 0) into v_id, v_moi;
    if v_moi then v_them := v_them + 1; else v_sua := v_sua + 1; end if;

    if jsonb_array_length(coalesce(r->'chu_de', '[]'::jsonb)) > 0 then
      if jsonb_array_length(r->'chu_de') > 2 then raise exception 'qua_2_chu_de: %', r->>'ma_sach'; end if;
      delete from public.sach_chu_de where sach_id = v_id;
      for cd in select distinct trim(x) from jsonb_array_elements_text(r->'chu_de') x where trim(x) <> '' loop
        insert into public.chu_de (ten) values (cd) on conflict (lower(ten)) do nothing;
        select id into cd_id from public.chu_de where lower(ten) = lower(cd);
        insert into public.sach_chu_de (sach_id, chu_de_id) values (v_id, cd_id) on conflict do nothing;
      end loop;
    end if;
  end loop;
  if (select count(*) from public.chu_de) > 30 then raise exception 'qua_nhieu_chu_de'; end if;
  return jsonb_build_object('them', v_them, 'sua', v_sua);
end $$;

-- Đặt lại chủ đề của 1 sách (≤ 2) — dùng ở màn sửa sách
create or replace function public.dat_chu_de_sach(p_sach_id bigint, p_chu_de_ids bigint[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.la_nhan_vien() then raise exception 'forbidden'; end if;
  if coalesce(array_length(p_chu_de_ids, 1), 0) > 2 then raise exception 'qua_2_chu_de'; end if;
  delete from public.sach_chu_de where sach_id = p_sach_id;
  insert into public.sach_chu_de (sach_id, chu_de_id) select p_sach_id, x from unnest(p_chu_de_ids) x
    on conflict do nothing;
end $$;

-- ───────────── Quyền ─────────────
revoke all on public.chu_de, public.sach, public.sach_chu_de from anonymous;
grant select, insert, update, delete on public.chu_de to authenticated;            -- RLS lọc
grant select, insert, delete on public.sach_chu_de to authenticated;               -- RLS lọc
grant select, delete on public.sach to authenticated;                              -- RLS lọc
-- Sửa sách: chỉ các cột này (không sửa id, tim, tao_luc); thêm sách: qua nhap_danh_muc
grant update (ten, tac_gia, nxb, nam, khoi_tu, khoi_den, so_ban, vi_tri, gioi_thieu, anh_bia, an, sua_luc) on public.sach to authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke all on function public.nhap_danh_muc(jsonb), public.dat_chu_de_sach(bigint, bigint[]) from public, anonymous;
grant execute on function public.nhap_danh_muc(jsonb), public.dat_chu_de_sach(bigint, bigint[]) to authenticated;
revoke all on function public.kiem_toi_da_chu_de() from public, anonymous;
