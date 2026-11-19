-- CHẠY TRÊN NEON (node scripts/chay-sql.mjs sql/2026-11-18_nhat_ky.sql). Chạy lại được.
-- Giai đoạn 3: nhật ký đọc sách, đọc xong, chuỗi tuần, mốc, mục tiêu tháng, Nhìn lại năm, Lớp của tôi. Thầy chốt 18/11/2026:
--   Ghi cho mọi sách trong danh mục (không ẩn). Tính chuỗi: lần ghi có "đoạn em nhớ" hoặc "em nghĩ gì" ≥ cai_dat.so_chu_tinh_chuoi
--   chữ (20), mỗi ngày tính tối đa 1 lần; tuần đạt khi ≥ cai_dat.so_lan_moi_tuan (3). "Đọc xong" em tự bấm, cần ≥ 1 lần ghi.
--   Em sửa / xoá nhật ký trong 7 ngày. Mục tiêu tháng 1–3 cuốn (mặc định 2). Năm học bắt đầu 1/9.
--   Ai xem nhật ký: chính em, GVCN lớp em, nhân viên. Mọi con số (chuỗi, mốc, thống kê) do máy chủ tính.
-- Không ai ghi thẳng bảng: chỉ qua hàm bên dưới.
-- Sau khi chạy: Neon → Data API → Refresh schema cache.

alter table public.cai_dat add column if not exists so_chu_tinh_chuoi smallint not null default 20 check (so_chu_tinh_chuoi between 1 and 200);
alter table public.cai_dat add column if not exists so_lan_moi_tuan smallint not null default 3 check (so_lan_moi_tuan between 1 and 7);

-- Số chữ (từ) trong 1 đoạn
create or replace function public.so_chu(t text) returns int
language sql immutable parallel safe as $$
  select coalesce(array_length(regexp_split_to_array(nullif(trim(coalesce(t, '')), ''), '\s+'), 1), 0)
$$;

-- ───────────── Bảng ─────────────
create table if not exists public.nhat_ky (
  id           bigint generated always as identity primary key,
  hoc_sinh_id  uuid not null references public.ho_so(id) on delete cascade,
  sach_id      bigint not null references public.sach(id) on delete restrict,
  ngay         date not null,                                     -- máy chủ đặt (giờ VN)
  doan_nho     text check (length(doan_nho) <= 1000),             -- đoạn em nhớ
  trang        smallint check (trang between 1 and 3000),
  cam_xuc      text not null check (cam_xuc in ('vui', 'buon', 'bat_ngo', 'hoi_hop', 'xuc_dong', 'suy_nghi', 'buon_cuoi')),
  em_nghi      text check (length(em_nghi) <= 1000),
  cung_bo_me   boolean not null default false,
  tinh_chuoi   boolean not null default false,                    -- máy chủ tính
  tao_luc      timestamptz not null default now(),
  sua_luc      timestamptz,
  check (doan_nho is not null or em_nghi is not null)
);
create index if not exists nhat_ky_hs_idx on public.nhat_ky (hoc_sinh_id, ngay desc, id desc);
create index if not exists nhat_ky_hs_sach_idx on public.nhat_ky (hoc_sinh_id, sach_id);
create index if not exists nhat_ky_sach_idx on public.nhat_ky (sach_id);

create table if not exists public.doc_xong (
  hoc_sinh_id  uuid not null references public.ho_so(id) on delete cascade,
  sach_id      bigint not null references public.sach(id) on delete restrict,
  muc_thich    smallint not null check (muc_thich between 1 and 5),
  cam_nhan     text check (length(cam_nhan) <= 1000),
  ngay         date not null,
  primary key (hoc_sinh_id, sach_id)
);
create index if not exists doc_xong_hs_ngay_idx on public.doc_xong (hoc_sinh_id, ngay);
create index if not exists doc_xong_sach_idx on public.doc_xong (sach_id);

create table if not exists public.moc_dat (
  hoc_sinh_id  uuid not null references public.ho_so(id) on delete cascade,
  ma           text not null check (ma in ('cuon_1', 'cuon_5', 'cuon_10', 'cuon_20', 'chuoi_4', 'chuoi_8')),
  dat_luc      timestamptz not null default now(),
  primary key (hoc_sinh_id, ma)
);

create table if not exists public.tuy_chon_hs (
  hoc_sinh_id     uuid primary key references public.ho_so(id) on delete cascade,
  muc_tieu_thang  smallint not null default 2 check (muc_tieu_thang between 1 and 3)
);

-- ───────────── Hàm quyền xem ─────────────
-- Người gọi là GVCN của học sinh này?
create or replace function public.la_hs_lop_toi(p_hs uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.vai_tro_cua_toi() = 'giao_vien' and exists (
    select 1 from public.ho_so where id = p_hs and vai_tro = 'hoc_sinh' and lop_id = public.lop_cua_toi())
$$;

-- Người gọi xem được dữ liệu đọc sách của học sinh này? (chính em, GVCN, nhân viên)
create or replace function public.xem_duoc_hs(p_hs uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((p_hs = public.toi() and public.vai_tro_cua_toi() is not null)
    or public.la_nhan_vien() or public.la_hs_lop_toi(p_hs), false)
$$;

-- ───────────── RLS (chỉ đọc; ghi qua hàm) ─────────────
alter table public.nhat_ky     enable row level security;
alter table public.doc_xong    enable row level security;
alter table public.moc_dat     enable row level security;
alter table public.tuy_chon_hs enable row level security;

drop policy if exists nhat_ky_xem on public.nhat_ky;
create policy nhat_ky_xem on public.nhat_ky for select to authenticated using (
  (select public.la_nhan_vien())
  or (hoc_sinh_id = (select public.toi()) and (select public.vai_tro_cua_toi()) is not null)
  or ((select public.vai_tro_cua_toi()) = 'giao_vien' and public.la_hs_lop_toi(hoc_sinh_id))
);
drop policy if exists doc_xong_xem on public.doc_xong;
create policy doc_xong_xem on public.doc_xong for select to authenticated using (
  (select public.la_nhan_vien())
  or (hoc_sinh_id = (select public.toi()) and (select public.vai_tro_cua_toi()) is not null)
  or ((select public.vai_tro_cua_toi()) = 'giao_vien' and public.la_hs_lop_toi(hoc_sinh_id))
);
drop policy if exists moc_dat_xem on public.moc_dat;
create policy moc_dat_xem on public.moc_dat for select to authenticated using (
  (select public.la_nhan_vien())
  or (hoc_sinh_id = (select public.toi()) and (select public.vai_tro_cua_toi()) is not null)
  or ((select public.vai_tro_cua_toi()) = 'giao_vien' and public.la_hs_lop_toi(hoc_sinh_id))
);
drop policy if exists tuy_chon_hs_xem on public.tuy_chon_hs;
create policy tuy_chon_hs_xem on public.tuy_chon_hs for select to authenticated using (
  hoc_sinh_id = (select public.toi()) and (select public.vai_tro_cua_toi()) is not null
);

-- ───────────── Hàm nội bộ: chuỗi, mốc ─────────────
-- Đặt lại "tính chuỗi" cho 1 ngày của 1 em: chỉ lần ghi đủ dài SỚM NHẤT trong ngày được tính.
create or replace function public.tinh_lai_ngay(p_hs uuid, p_ngay date) returns void
language plpgsql security definer set search_path = public as $$
declare v_toi_thieu int := (select so_chu_tinh_chuoi from public.cai_dat where id = 1);
begin
  update public.nhat_ky set tinh_chuoi = false where hoc_sinh_id = p_hs and ngay = p_ngay and tinh_chuoi;
  update public.nhat_ky set tinh_chuoi = true where id = (
    select id from public.nhat_ky where hoc_sinh_id = p_hs and ngay = p_ngay
      and greatest(public.so_chu(doan_nho), public.so_chu(em_nghi)) >= v_toi_thieu
    order by tao_luc, id limit 1);
end $$;

-- Chuỗi tuần của 1 em: { tuan_nay (số lần được tính tuần này), can (số lần cần), chuoi (số tuần liên tiếp đạt — tuần này
-- chưa đạt thì chưa làm đứt chuỗi), dai_nhat }. Tuần tính từ thứ Hai, giờ VN.
create or replace function public.chuoi_cua(p_hs uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with can as (select so_lan_moi_tuan n from public.cai_dat where id = 1),
  t as (select date_trunc('week', ngay)::date tuan, count(*) so from public.nhat_ky
        where hoc_sinh_id = p_hs and tinh_chuoi group by 1),
  dat as (select tuan from t, can where t.so >= can.n),
  dao as (select tuan, tuan - (row_number() over (order by tuan))::int * 7 nhom from dat),
  doan as (select count(*)::int dai, max(tuan) cuoi from dao group by nhom),
  nay as (select date_trunc('week', public.hom_nay())::date tuan)
  select jsonb_build_object(
    'tuan_nay', coalesce((select so from t, nay where t.tuan = nay.tuan), 0),
    'can', (select n from can),
    'chuoi', coalesce((select max(dai) from doan, nay where doan.cuoi >= nay.tuan - 7), 0),
    'dai_nhat', coalesce((select max(dai) from doan), 0))
$$;

-- Ghi các mốc mới đạt; trả mảng mã mốc vừa đạt (để giao diện chúc mừng). Mốc đã đạt không mất.
create or replace function public.cap_nhat_moc(p_hs uuid) returns text[]
language plpgsql security definer set search_path = public as $$
declare v_cuon int := (select count(*) from public.doc_xong where hoc_sinh_id = p_hs);
  v_chuoi int := (public.chuoi_cua(p_hs)->>'dai_nhat')::int; kq text[];
begin
  with moi as (
    insert into public.moc_dat (hoc_sinh_id, ma)
    select p_hs, m.ma from (values ('cuon_1', 'cuon', 1), ('cuon_5', 'cuon', 5), ('cuon_10', 'cuon', 10), ('cuon_20', 'cuon', 20),
      ('chuoi_4', 'chuoi', 4), ('chuoi_8', 'chuoi', 8)) m(ma, loai, muc)
    where (m.loai = 'cuon' and v_cuon >= m.muc) or (m.loai = 'chuoi' and v_chuoi >= m.muc)
    on conflict do nothing returning ma)
  select coalesce(array_agg(ma), '{}') into kq from moi;
  return kq;
end $$;

-- ───────────── Học sinh ghi ─────────────
create or replace function public.ghi_nhat_ky(p_sach_id bigint, p_cam_xuc text, p_doan_nho text default null,
  p_em_nghi text default null, p_trang int default null, p_cung_bo_me boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare toi uuid := public.toi(); d date := public.hom_nay(); v_id bigint;
begin
  if public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  perform 1 from public.sach where id = p_sach_id and not an;
  if not found then raise exception 'khong_co_sach'; end if;
  if (select count(*) from public.nhat_ky where hoc_sinh_id = toi and ngay = d) >= 20 then raise exception 'qua_nhieu_lan'; end if;
  insert into public.nhat_ky (hoc_sinh_id, sach_id, ngay, doan_nho, trang, cam_xuc, em_nghi, cung_bo_me)
  values (toi, p_sach_id, d, nullif(trim(p_doan_nho), ''), p_trang, p_cam_xuc, nullif(trim(p_em_nghi), ''), coalesce(p_cung_bo_me, false))
  returning id into v_id;
  perform public.tinh_lai_ngay(toi, d);
  return jsonb_build_object('id', v_id, 'tinh_chuoi', (select tinh_chuoi from public.nhat_ky where id = v_id),
    'chuoi', public.chuoi_cua(toi), 'moc_moi', to_jsonb(public.cap_nhat_moc(toi)));
end $$;

-- Sửa (chính em, trong 7 ngày). Không đổi sách / ngày.
create or replace function public.sua_nhat_ky(p_id bigint, p_cam_xuc text, p_doan_nho text default null,
  p_em_nghi text default null, p_trang int default null, p_cung_bo_me boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.nhat_ky;
begin
  select * into r from public.nhat_ky where id = p_id for update;
  if not found or r.hoc_sinh_id <> public.toi() or public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  if r.ngay < public.hom_nay() - 7 then raise exception 'het_han_sua'; end if;
  update public.nhat_ky set cam_xuc = p_cam_xuc, doan_nho = nullif(trim(p_doan_nho), ''), em_nghi = nullif(trim(p_em_nghi), ''),
    trang = p_trang, cung_bo_me = coalesce(p_cung_bo_me, false), sua_luc = now() where id = p_id;
  perform public.tinh_lai_ngay(r.hoc_sinh_id, r.ngay);
  return jsonb_build_object('tinh_chuoi', (select tinh_chuoi from public.nhat_ky where id = p_id), 'chuoi', public.chuoi_cua(r.hoc_sinh_id));
end $$;

create or replace function public.xoa_nhat_ky(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare r public.nhat_ky;
begin
  select * into r from public.nhat_ky where id = p_id for update;
  if not found or r.hoc_sinh_id <> public.toi() or public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  if r.ngay < public.hom_nay() - 7 then raise exception 'het_han_sua'; end if;
  delete from public.nhat_ky where id = p_id;
  perform public.tinh_lai_ngay(r.hoc_sinh_id, r.ngay);
end $$;

-- Em đọc xong 1 cuốn (cần đã ghi ≥ 1 lần nhật ký về cuốn đó). Bấm lại → cập nhật mức thích / cảm nhận. Trả { moc_moi }.
create or replace function public.danh_dau_doc_xong(p_sach_id bigint, p_muc_thich int, p_cam_nhan text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare toi uuid := public.toi();
begin
  if public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.nhat_ky where hoc_sinh_id = toi and sach_id = p_sach_id) then
    raise exception 'chua_ghi_nhat_ky';
  end if;
  insert into public.doc_xong (hoc_sinh_id, sach_id, muc_thich, cam_nhan, ngay)
  values (toi, p_sach_id, p_muc_thich, nullif(trim(p_cam_nhan), ''), public.hom_nay())
  on conflict (hoc_sinh_id, sach_id) do update set muc_thich = excluded.muc_thich, cam_nhan = excluded.cam_nhan;
  return jsonb_build_object('moc_moi', to_jsonb(public.cap_nhat_moc(toi)));
end $$;

create or replace function public.dat_muc_tieu(p_so int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  insert into public.tuy_chon_hs (hoc_sinh_id, muc_tieu_thang) values (public.toi(), p_so)
  on conflict (hoc_sinh_id) do update set muc_tieu_thang = excluded.muc_tieu_thang;
end $$;

-- ───────────── Học sinh đọc ─────────────
-- Trang chủ: chuỗi tuần, mục tiêu tháng, lần ghi gần nhất, ngưỡng tính chuỗi — 1 lần gọi.
create or replace function public.tong_quan_cua_toi()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare toi uuid := public.toi();
begin
  if public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'chuoi', public.chuoi_cua(toi),
    'doc_xong_thang', (select count(*) from public.doc_xong where hoc_sinh_id = toi
                       and ngay >= date_trunc('month', public.hom_nay())::date),
    'muc_tieu', coalesce((select muc_tieu_thang from public.tuy_chon_hs where hoc_sinh_id = toi), 2),
    'lan_ghi_cuoi', (select max(ngay) from public.nhat_ky where hoc_sinh_id = toi),
    'so_chu_tinh_chuoi', (select so_chu_tinh_chuoi from public.cai_dat where id = 1),
    'doc_xong', coalesce((select jsonb_agg(sach_id) from public.doc_xong where hoc_sinh_id = toi), '[]'::jsonb));
end $$;

-- Gợi ý 3 cuốn đọc tiếp sau 1 cuốn: cùng chủ đề trước, hợp khối của em, em chưa đọc xong / chưa đang giữ, không ẩn.
create or replace function public.goi_y_doc_tiep(p_sach_id bigint)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare toi uuid := public.toi(); v_khoi int; kq jsonb;
begin
  if public.vai_tro_cua_toi() is null then raise exception 'forbidden'; end if;
  select l.khoi into v_khoi from public.ho_so h join public.lop l on l.id = h.lop_id where h.id = toi;
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'ma_sach', ma_sach, 'ten', ten, 'tac_gia', tac_gia, 'anh_bia', anh_bia,
    'con_ban', public.ban_ranh(id))), '[]'::jsonb) into kq
  from (
    select s.id, s.ma_sach, s.ten, s.tac_gia, s.anh_bia
    from public.sach s
    where not s.an and s.id <> p_sach_id and s.so_ban > 0
      and (v_khoi is null or v_khoi between s.khoi_tu and s.khoi_den)
      and not exists (select 1 from public.doc_xong d where d.hoc_sinh_id = toi and d.sach_id = s.id)
      and not exists (select 1 from public.luot_muon l where l.hoc_sinh_id = toi and l.sach_id = s.id
                      and l.trang_thai in ('dat_truoc', 'da_soan', 'dang_muon'))
    order by exists (select 1 from public.sach_chu_de a join public.sach_chu_de b on a.chu_de_id = b.chu_de_id
                     where a.sach_id = s.id and b.sach_id = p_sach_id) desc, random()
    limit 3
  ) x;
  return kq;
end $$;

-- Nhìn lại năm đọc sách của 1 em (mặc định: chính mình; GVCN / nhân viên xem được em khác). Năm học từ 1/9.
create or replace function public.nhin_lai_nam(p_hs uuid default null, p_tu date default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare hs uuid := coalesce(p_hs, public.toi()); d date := public.hom_nay(); tu date; den date;
begin
  if not public.xem_duoc_hs(hs) then raise exception 'forbidden'; end if;
  tu := coalesce(p_tu, make_date(extract(year from d)::int - case when extract(month from d) < 9 then 1 else 0 end, 9, 1));
  den := (tu + interval '1 year')::date;
  return jsonb_build_object(
    'ho_ten', (select ho_ten from public.ho_so where id = hs),
    'tu', tu, 'den', den - 1,
    'so_cuon', (select count(*) from public.doc_xong where hoc_sinh_id = hs and ngay >= tu and ngay < den),
    'so_lan_ghi', (select count(*) from public.nhat_ky where hoc_sinh_id = hs and ngay >= tu and ngay < den),
    'so_lan_bo_me', (select count(*) from public.nhat_ky where hoc_sinh_id = hs and ngay >= tu and ngay < den and cung_bo_me),
    'chuoi', public.chuoi_cua(hs),
    'cam_xuc', coalesce((select jsonb_object_agg(cam_xuc, so) from (select cam_xuc, count(*) so from public.nhat_ky
      where hoc_sinh_id = hs and ngay >= tu and ngay < den group by 1) c), '{}'::jsonb),
    'theo_thang', coalesce((select jsonb_agg(jsonb_build_object('thang', thang, 'so_lan', so_lan, 'so_cuon', so_cuon) order by thang) from (
      select to_char(m, 'YYYY-MM') thang,
        (select count(*) from public.nhat_ky where hoc_sinh_id = hs and date_trunc('month', ngay) = m) so_lan,
        (select count(*) from public.doc_xong where hoc_sinh_id = hs and date_trunc('month', ngay) = m) so_cuon
      from generate_series(tu::timestamp, least(den - 1, d)::timestamp, interval '1 month') m) t), '[]'::jsonb),
    'sach', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'ma_sach', s.ma_sach, 'ten', s.ten, 'tac_gia', s.tac_gia,
        'anh_bia', s.anh_bia, 'so_lan', x.so_lan, 'dau', x.dau, 'muc_thich', dx.muc_thich, 'ngay_xong', dx.ngay, 'cam_nhan', dx.cam_nhan)
        order by x.dau, s.id) from (
      select sach_id, count(*) so_lan, min(ngay) dau from public.nhat_ky
      where hoc_sinh_id = hs and ngay >= tu and ngay < den group by sach_id) x
      join public.sach s on s.id = x.sach_id
      left join public.doc_xong dx on dx.hoc_sinh_id = hs and dx.sach_id = x.sach_id), '[]'::jsonb),
    'moc', coalesce((select jsonb_agg(jsonb_build_object('ma', ma, 'dat_luc', dat_luc) order by dat_luc)
      from public.moc_dat where hoc_sinh_id = hs), '[]'::jsonb));
end $$;

-- ───────────── GVCN / nhân viên: Lớp của tôi ─────────────
-- GVCN: lớp mình (bỏ qua p_lop_id). Nhân viên: lớp chọn. Mỗi em: số lần tính chuỗi tuần này, chuỗi, lần ghi gần nhất,
-- số cuốn đọc xong từ 1/9.
create or replace function public.lop_tong_quan(p_lop_id bigint default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_lop bigint; d date := public.hom_nay(); tu date;
begin
  if public.la_nhan_vien() then v_lop := p_lop_id;
  elsif public.vai_tro_cua_toi() = 'giao_vien' then v_lop := public.lop_cua_toi();
  else raise exception 'forbidden'; end if;
  if v_lop is null then raise exception 'chua_co_lop'; end if;
  tu := make_date(extract(year from d)::int - case when extract(month from d) < 9 then 1 else 0 end, 9, 1);
  return jsonb_build_object(
    'lop', (select ten from public.lop where id = v_lop),
    'hoc_sinh', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'ho_ten', h.ho_ten,
        'chuoi', public.chuoi_cua(h.id),
        'lan_ghi_cuoi', (select max(ngay) from public.nhat_ky where hoc_sinh_id = h.id),
        'so_cuon_nam', (select count(*) from public.doc_xong where hoc_sinh_id = h.id and ngay >= tu)) order by h.ho_ten)
      from public.ho_so h where h.lop_id = v_lop and h.vai_tro = 'hoc_sinh' and h.hoat_dong), '[]'::jsonb));
end $$;

-- ───────────── Quyền ─────────────
revoke all on public.nhat_ky, public.doc_xong, public.moc_dat, public.tuy_chon_hs from anonymous;
grant select on public.nhat_ky, public.doc_xong, public.moc_dat, public.tuy_chon_hs to authenticated;   -- ghi chỉ qua hàm
grant usage, select on all sequences in schema public to authenticated;

revoke all on function public.tinh_lai_ngay(uuid, date), public.chuoi_cua(uuid), public.cap_nhat_moc(uuid),
  public.la_hs_lop_toi(uuid), public.xem_duoc_hs(uuid), public.so_chu(text) from public, anonymous;
revoke all on function public.tinh_lai_ngay(uuid, date), public.chuoi_cua(uuid), public.cap_nhat_moc(uuid) from authenticated;
grant execute on function public.la_hs_lop_toi(uuid), public.xem_duoc_hs(uuid), public.so_chu(text) to authenticated;   -- dùng trong RLS

revoke all on function public.ghi_nhat_ky(bigint, text, text, text, int, boolean), public.sua_nhat_ky(bigint, text, text, text, int, boolean),
  public.xoa_nhat_ky(bigint), public.danh_dau_doc_xong(bigint, int, text), public.dat_muc_tieu(int), public.tong_quan_cua_toi(),
  public.goi_y_doc_tiep(bigint), public.nhin_lai_nam(uuid, date), public.lop_tong_quan(bigint) from public, anonymous;
grant execute on function public.ghi_nhat_ky(bigint, text, text, text, int, boolean), public.sua_nhat_ky(bigint, text, text, text, int, boolean),
  public.xoa_nhat_ky(bigint), public.danh_dau_doc_xong(bigint, int, text), public.dat_muc_tieu(int), public.tong_quan_cua_toi(),
  public.goi_y_doc_tiep(bigint), public.nhin_lai_nam(uuid, date), public.lop_tong_quan(bigint) to authenticated;
