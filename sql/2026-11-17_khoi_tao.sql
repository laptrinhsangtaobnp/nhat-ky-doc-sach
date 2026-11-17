-- CHẠY TRÊN NEON (Neon → SQL Editor), 17/11/2026. Chạy lại nhiều lần được (không mất dữ liệu).
-- Giai đoạn 0: hồ sơ người dùng, lớp, cài đặt mượn sách + phân quyền theo dòng (RLS) + hàm máy chủ quản lý tài khoản.
-- Đăng nhập ở Supabase; Neon nhận thẻ đăng nhập (JWT) của Supabase → auth.uid() = id tài khoản Supabase.
-- Vai trò trong Neon Data API: authenticated (đã đăng nhập), anonymous (chưa đăng nhập — không được gì).
-- Sau khi chạy: Neon → Data API → Refresh schema cache.

-- ───────────── Bảng ─────────────
create table if not exists public.lop (
  id        bigint generated always as identity primary key,
  ten       text not null check (length(ten) between 1 and 20),
  khoi      smallint not null check (khoi between 1 and 5),
  nam_hoc   text not null check (nam_hoc ~ '^\d{4}-\d{4}$'),
  thi_diem  boolean not null default false,
  tao_luc   timestamptz not null default now(),
  unique (ten, nam_hoc)
);

create table if not exists public.ho_so (
  id             uuid primary key,                       -- = id tài khoản Supabase
  ho_ten         text not null check (length(ho_ten) between 1 and 100),
  ten_dang_nhap  text unique check (ten_dang_nhap ~ '^[a-z0-9._]{3,30}$'),
  vai_tro        text not null default 'hoc_sinh' check (vai_tro in ('quan_tri', 'thu_thu', 'giao_vien', 'hoc_sinh')),
  lop_id         bigint references public.lop(id) on delete set null,   -- HS: lớp đang học · GV: lớp chủ nhiệm
  hoat_dong      boolean not null default true,          -- false = khoá, không đọc được dữ liệu gì
  tao_luc        timestamptz not null default now()
);
create index if not exists ho_so_lop_vai_tro_idx on public.ho_so (lop_id, vai_tro);

create table if not exists public.cai_dat (
  id             smallint primary key default 1 check (id = 1),     -- chỉ 1 dòng
  so_sach_toi_da smallint not null default 2 check (so_sach_toi_da between 1 and 10),
  so_ngay_muon   smallint not null default 7 check (so_ngay_muon between 1 and 60),
  sua_luc        timestamptz not null default now()
);
insert into public.cai_dat (id) values (1) on conflict (id) do nothing;

-- ───────────── Hàm hỏi "tôi là ai" (STABLE + security definer: tính 1 lần mỗi câu lệnh, không vòng lặp RLS) ─────────────
create or replace function public.vai_tro_cua_toi() returns text
language sql stable security definer set search_path = public as $$
  select vai_tro from public.ho_so where id = auth.uid() and hoat_dong
$$;

create or replace function public.lop_cua_toi() returns bigint
language sql stable security definer set search_path = public as $$
  select lop_id from public.ho_so where id = auth.uid() and hoat_dong
$$;

-- Thủ thư hoặc quản trị
create or replace function public.la_nhan_vien() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select vai_tro from public.ho_so where id = auth.uid() and hoat_dong) in ('quan_tri', 'thu_thu'), false)
$$;

-- ───────────── RLS ─────────────
alter table public.lop     enable row level security;
alter table public.ho_so   enable row level security;
alter table public.cai_dat enable row level security;

-- Hồ sơ: tự xem mình; nhân viên xem tất cả; GVCN xem học sinh lớp mình. KHÔNG ai ghi thẳng — chỉ qua hàm bên dưới.
drop policy if exists ho_so_xem on public.ho_so;
create policy ho_so_xem on public.ho_so for select to authenticated using (
  id = (select auth.uid())
  or (select public.la_nhan_vien())
  or ((select public.vai_tro_cua_toi()) = 'giao_vien' and lop_id = (select public.lop_cua_toi()) and vai_tro = 'hoc_sinh')
);

-- Lớp: ai đăng nhập (còn hoạt động) cũng xem được tên lớp; nhân viên thêm / sửa / xoá
drop policy if exists lop_xem on public.lop;
create policy lop_xem on public.lop for select to authenticated using ((select public.vai_tro_cua_toi()) is not null);
drop policy if exists lop_ghi on public.lop;
create policy lop_ghi on public.lop for all to authenticated
  using ((select public.la_nhan_vien())) with check ((select public.la_nhan_vien()));

-- Cài đặt mượn: ai đăng nhập cũng xem; nhân viên sửa
drop policy if exists cai_dat_xem on public.cai_dat;
create policy cai_dat_xem on public.cai_dat for select to authenticated using ((select public.vai_tro_cua_toi()) is not null);
drop policy if exists cai_dat_sua on public.cai_dat;
create policy cai_dat_sua on public.cai_dat for update to authenticated
  using ((select public.la_nhan_vien())) with check ((select public.la_nhan_vien()));

-- ───────────── Hàm máy chủ quản lý hồ sơ (Edge Function gọi bằng thẻ của người thao tác) ─────────────
-- Tạo hồ sơ cho tài khoản vừa tạo ở Supabase. Thủ thư chỉ tạo học sinh; vai trò khác phải là quản trị.
create or replace function public.tao_ho_so(p_id uuid, p_ho_ten text, p_vai_tro text, p_ten_dang_nhap text, p_lop_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare toi text := public.vai_tro_cua_toi(); cu text;
begin
  if coalesce(toi, '') not in ('quan_tri', 'thu_thu') then raise exception 'forbidden'; end if;
  if coalesce(p_vai_tro, 'hoc_sinh') <> 'hoc_sinh' and toi <> 'quan_tri' then raise exception 'forbidden'; end if;
  select vai_tro into cu from public.ho_so where id = p_id;
  if cu is not null and cu <> 'hoc_sinh' and toi <> 'quan_tri' then raise exception 'forbidden'; end if;
  insert into public.ho_so (id, ho_ten, vai_tro, ten_dang_nhap, lop_id)
  values (p_id, trim(p_ho_ten), coalesce(p_vai_tro, 'hoc_sinh'), p_ten_dang_nhap, p_lop_id)
  on conflict (id) do update set ho_ten = excluded.ho_ten, vai_tro = excluded.vai_tro,
    ten_dang_nhap = excluded.ten_dang_nhap, lop_id = excluded.lop_id;
end $$;

-- Sửa họ tên / lớp / khoá-mở. Thủ thư chỉ sửa học sinh. Không ai tự khoá mình.
create or replace function public.sua_ho_so(p_id uuid, p_ho_ten text, p_lop_id bigint, p_hoat_dong boolean)
returns void language plpgsql security definer set search_path = public as $$
declare toi text := public.vai_tro_cua_toi(); cu text;
begin
  if coalesce(toi, '') not in ('quan_tri', 'thu_thu') then raise exception 'forbidden'; end if;
  select vai_tro into cu from public.ho_so where id = p_id;
  if cu is null then raise exception 'khong_co'; end if;
  if cu <> 'hoc_sinh' and toi <> 'quan_tri' then raise exception 'forbidden'; end if;
  if p_id = auth.uid() and p_hoat_dong = false then raise exception 'khong_tu_khoa'; end if;
  update public.ho_so set ho_ten = coalesce(nullif(trim(p_ho_ten), ''), ho_ten), lop_id = p_lop_id,
    hoat_dong = coalesce(p_hoat_dong, hoat_dong) where id = p_id;
end $$;

-- Xoá hồ sơ (chỉ quản trị; mất luôn dữ liệu của người đó — thủ thư nên dùng "khoá" thay vì xoá).
create or replace function public.xoa_ho_so(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(public.vai_tro_cua_toi(), '') <> 'quan_tri' then raise exception 'forbidden'; end if;
  if p_id = auth.uid() then raise exception 'khong_tu_xoa'; end if;
  delete from public.ho_so where id = p_id;
end $$;

-- ───────────── Quyền ─────────────
revoke all on public.lop, public.ho_so, public.cai_dat from anonymous;
grant usage on schema public to authenticated;
grant select on public.ho_so to authenticated;                              -- ghi chỉ qua hàm
grant select, insert, update, delete on public.lop to authenticated;        -- RLS lọc
grant select, update on public.cai_dat to authenticated;                    -- RLS lọc
grant usage, select on all sequences in schema public to authenticated;

revoke all on function public.vai_tro_cua_toi(), public.lop_cua_toi(), public.la_nhan_vien() from public, anonymous;
revoke all on function public.tao_ho_so(uuid, text, text, text, bigint), public.sua_ho_so(uuid, text, bigint, boolean),
  public.xoa_ho_so(uuid) from public, anonymous;
grant execute on function public.vai_tro_cua_toi(), public.lop_cua_toi(), public.la_nhan_vien() to authenticated;
grant execute on function public.tao_ho_so(uuid, text, text, text, bigint), public.sua_ho_so(uuid, text, bigint, boolean),
  public.xoa_ho_so(uuid) to authenticated;
