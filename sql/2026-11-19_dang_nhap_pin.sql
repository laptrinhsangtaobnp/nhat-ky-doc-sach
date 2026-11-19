-- CHẠY TRÊN NEON (node scripts/chay-sql.mjs sql/2026-11-19_dang_nhap_pin.sql). Chạy lại được.
-- Chạy SAU 2026-11-17_khoi_tao.sql (chạy lại tệp đó thì chạy lại tệp này — tệp đó cấp lại quyền xem cả bảng lop).
-- Thầy chốt 19/11/2026 (KE-HOACH-APP.md mục 11): học sinh đăng nhập bằng MÃ LỚP + chọn tên + PIN 4 số.
--   Mã lớp: 6 ký tự ngẫu nhiên (không có 0/O/1/I/L dễ nhầm), chỉ nhân viên + GVCN lớp đó xem / đổi.
--   PIN: chỉ lưu bản băm (bcrypt); PIN rõ chỉ hiện 1 lần lúc tạo / đặt lại để in phiếu.
--   Chống dò: sai 5 lần liền → khoá 15 phút; sai 15 lần trong ngày → khoá đến hết ngày; cả lớp sai 60 lần trong ngày →
--   tạm khoá đăng nhập PIN của lớp đến hết ngày (GVCN đổi mã lớp nếu bị lộ). Đặt lại PIN → mở khoá em đó.
--   Kiểm PIN chỉ do vai trò riêng `dang_nhap_pin` (Edge Function dang-nhap-pin dùng) — trình duyệt không gọi được.
--   Mật khẩu của vai trò này KHÔNG nằm ở đây: scripts/dat-vai-tro-pin.mjs đặt và ghi vào .env (NEON_PIN_URL).
-- Sau khi chạy: Neon → Data API → Refresh schema cache.

create extension if not exists pgcrypto;

-- ───────────── Mã lớp ─────────────
create or replace function public.tao_ma_lop() returns text
language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, 6)
$$;
alter table public.lop add column if not exists ma_lop text;
update public.lop set ma_lop = public.tao_ma_lop() where ma_lop is null;
alter table public.lop alter column ma_lop set default public.tao_ma_lop();
alter table public.lop alter column ma_lop set not null;
create unique index if not exists lop_ma_lop_uq on public.lop (ma_lop);
create table if not exists public.lop_sai_pin (                -- đếm sai PIN của cả lớp trong ngày
  lop_id  bigint primary key references public.lop(id) on delete cascade,
  ngay    date not null,
  so_sai  int not null default 0
);
alter table public.lop_sai_pin enable row level security;     -- không policy, không grant

-- Ai đăng nhập cũng xem tên lớp, nhưng KHÔNG xem mã lớp (chỉ qua lay_ma_lop)
revoke select, update on public.lop from authenticated;
grant select (id, ten, khoi, nam_hoc, thi_diem, tao_luc) on public.lop to authenticated;
grant update (ten, khoi, nam_hoc, thi_diem) on public.lop to authenticated;

-- ───────────── PIN học sinh ─────────────
create table if not exists public.pin_hs (
  hoc_sinh_id    uuid primary key references public.ho_so(id) on delete cascade,
  pin_hash       text not null,
  sai_lien_tiep  smallint not null default 0,
  sai_trong_ngay smallint not null default 0,
  ngay_sai       date,
  khoa_den       timestamptz,
  dat_luc        timestamptz not null default now()
);
alter table public.pin_hs enable row level security;           -- không policy, không grant: chỉ qua hàm

-- Người gọi quản lý được lớp này? (nhân viên: mọi lớp; GVCN: lớp mình)
create or replace function public.quan_ly_lop(p_lop_id bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.la_nhan_vien() or (public.vai_tro_cua_toi() = 'giao_vien' and public.lop_cua_toi() = p_lop_id), false)
$$;

create or replace function public.lay_ma_lop(p_lop_id bigint) returns text
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.quan_ly_lop(p_lop_id) then raise exception 'forbidden'; end if;
  return (select ma_lop from public.lop where id = p_lop_id);
end $$;

create or replace function public.doi_ma_lop(p_lop_id bigint) returns text
language plpgsql security definer set search_path = public as $$
declare m text;
begin
  if not public.quan_ly_lop(p_lop_id) then raise exception 'forbidden'; end if;
  loop
    m := public.tao_ma_lop();
    exit when not exists (select 1 from public.lop where ma_lop = m);
  end loop;
  update public.lop set ma_lop = m where id = p_lop_id;
  delete from public.lop_sai_pin where lop_id = p_lop_id;
  return m;
end $$;

-- Tình trạng PIN của cả lớp (không có PIN rõ): [{ id, ho_ten, co_pin, bi_khoa }]
create or replace function public.tinh_trang_pin_lop(p_lop_id bigint) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.quan_ly_lop(p_lop_id) then raise exception 'forbidden'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'ho_ten', h.ho_ten, 'co_pin', p.hoc_sinh_id is not null,
      'bi_khoa', coalesce(p.khoa_den > now(), false)) order by h.ho_ten)
    from public.ho_so h left join public.pin_hs p on p.hoc_sinh_id = h.id
    where h.lop_id = p_lop_id and h.vai_tro = 'hoc_sinh' and h.hoat_dong), '[]'::jsonb);
end $$;

-- Tạo PIN mới (4 số ngẫu nhiên) cho học sinh của lớp — p_hs null = mọi em CHƯA có PIN; có p_hs = đặt lại PIN em đó.
-- Trả [{ id, ho_ten, pin }] — PIN rõ chỉ trả 1 lần này để in phiếu.
create or replace function public.tao_pin(p_lop_id bigint, p_hs uuid default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r record; v_pin text; kq jsonb := '[]'::jsonb;
begin
  if not public.quan_ly_lop(p_lop_id) then raise exception 'forbidden'; end if;
  for r in select h.id, h.ho_ten from public.ho_so h
           where h.lop_id = p_lop_id and h.vai_tro = 'hoc_sinh' and h.hoat_dong
             and (case when p_hs is null then not exists (select 1 from public.pin_hs p where p.hoc_sinh_id = h.id) else h.id = p_hs end)
           order by h.ho_ten loop
    v_pin := lpad(floor(random() * 10000)::int::text, 4, '0');
    insert into public.pin_hs (hoc_sinh_id, pin_hash) values (r.id, crypt(v_pin, gen_salt('bf', 8)))
    on conflict (hoc_sinh_id) do update set pin_hash = excluded.pin_hash, sai_lien_tiep = 0, sai_trong_ngay = 0,
      khoa_den = null, dat_luc = now();
    kq := kq || jsonb_build_object('id', r.id, 'ho_ten', r.ho_ten, 'pin', v_pin);
  end loop;
  if p_hs is not null and jsonb_array_length(kq) = 0 then raise exception 'forbidden'; end if;   -- em không thuộc lớp này
  return kq;
end $$;

-- ───────────── Chỉ vai trò dang_nhap_pin (Edge Function) ─────────────
-- Tên hiện ở màn chọn tên: tên + chữ đầu họ / đệm ("Nguyễn Thị Lan" → "Lan N.T."), không lộ họ tên đủ cho người có mã lớp.
create or replace function public.ten_hien(p_ho_ten text) returns text
language sql immutable as $$
  with w as (select regexp_split_to_array(trim(p_ho_ten), '\s+') a)
  select a[array_length(a, 1)] || coalesce(' ' || nullif((select string_agg(left(x, 1) || '.', '') from unnest(a[1:array_length(a, 1) - 1]) x), ''), '')
  from w
$$;

-- Mã lớp → { lop, hoc_sinh: [{ id, ten }] } (em có PIN, đang hoạt động). Mã sai → null.
create or replace function public.ds_ten_theo_ma(p_ma text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('lop', l.ten, 'hoc_sinh', coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'ten', ten || case when so > 1 then ' (' || stt || ')' else '' end) order by ten, stt)
    from (select h.id, public.ten_hien(h.ho_ten) ten,
            count(*) over (partition by public.ten_hien(h.ho_ten)) so,
            row_number() over (partition by public.ten_hien(h.ho_ten) order by h.ho_ten, h.id) stt
          from public.ho_so h join public.pin_hs p on p.hoc_sinh_id = h.id
          where h.lop_id = l.id and h.vai_tro = 'hoc_sinh' and h.hoat_dong) x), '[]'::jsonb))
  from public.lop l where l.ma_lop = upper(trim(p_ma))
$$;

-- Kiểm PIN → 'ok' | 'sai:<số lần còn lại trước khi khoá>' | 'khoa:<thời điểm mở>' | 'lop_khoa' | 'khong_co'.
create or replace function public.kiem_pin(p_ma text, p_hs uuid, p_pin text) returns text
language plpgsql volatile security definer set search_path = public as $$
declare v_lop bigint; p public.pin_hs; d date := public.hom_nay(); s int;
begin
  select l.id into v_lop from public.lop l join public.ho_so h on h.lop_id = l.id
  where l.ma_lop = upper(trim(p_ma)) and h.id = p_hs and h.vai_tro = 'hoc_sinh' and h.hoat_dong;
  if v_lop is null then return 'khong_co'; end if;
  if exists (select 1 from public.lop_sai_pin where lop_id = v_lop and ngay = d and so_sai >= 60) then return 'lop_khoa'; end if;
  select * into p from public.pin_hs where hoc_sinh_id = p_hs for update;
  if not found then return 'khong_co'; end if;
  if p.khoa_den > now() then return 'khoa:' || p.khoa_den; end if;
  if p_pin ~ '^\d{4}$' and p.pin_hash = crypt(p_pin, p.pin_hash) then
    update public.pin_hs set sai_lien_tiep = 0, khoa_den = null where hoc_sinh_id = p_hs;
    return 'ok';
  end if;
  -- sai
  s := case when p.ngay_sai = d then p.sai_trong_ngay + 1 else 1 end;
  update public.pin_hs set sai_lien_tiep = p.sai_lien_tiep + 1, sai_trong_ngay = s, ngay_sai = d,
    khoa_den = case when s >= 15 then (d + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh'
                    when (p.sai_lien_tiep + 1) % 5 = 0 then now() + interval '15 minutes' end
  where hoc_sinh_id = p_hs returning * into p;
  insert into public.lop_sai_pin as x (lop_id, ngay, so_sai) values (v_lop, d, 1)
  on conflict (lop_id) do update set so_sai = case when x.ngay = d then x.so_sai + 1 else 1 end, ngay = d;
  if p.khoa_den is not null then return 'khoa:' || p.khoa_den; end if;
  return 'sai:' || (5 - p.sai_lien_tiep % 5);
end $$;

-- Vai trò riêng cho Edge Function: đăng nhập được (mật khẩu đặt bằng script), chỉ gọi 2 hàm trên.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'dang_nhap_pin') then create role dang_nhap_pin login; end if;
end $$;
grant usage on schema public to dang_nhap_pin;

-- ───────────── Quyền ─────────────
revoke all on public.pin_hs, public.lop_sai_pin from anonymous, authenticated;
revoke all on function public.tao_ma_lop(), public.ten_hien(text), public.ds_ten_theo_ma(text), public.kiem_pin(text, uuid, text)
  from public, anonymous, authenticated;
grant execute on function public.ds_ten_theo_ma(text), public.kiem_pin(text, uuid, text) to dang_nhap_pin;
grant execute on function public.tao_ma_lop() to authenticated;          -- giá trị mặc định khi nhân viên thêm lớp
revoke all on function public.quan_ly_lop(bigint), public.lay_ma_lop(bigint), public.doi_ma_lop(bigint),
  public.tinh_trang_pin_lop(bigint), public.tao_pin(bigint, uuid) from public, anonymous;
grant execute on function public.quan_ly_lop(bigint), public.lay_ma_lop(bigint), public.doi_ma_lop(bigint),
  public.tinh_trang_pin_lop(bigint), public.tao_pin(bigint, uuid) to authenticated;
