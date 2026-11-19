-- CHẠY TRÊN NEON (node scripts/chay-sql.mjs sql/2026-11-19_cay_doc_sach.sql). Chạy lại được.
-- Chạy SAU 2026-11-18_nhat_ky.sql (chạy lại tệp đó thì phải chạy lại tệp này — tệp này thay một số hàm của tệp đó).
-- Thầy chốt 19/11/2026 (KE-HOACH-APP.md mục 11):
--   Cây đọc sách thay chuỗi tuần: cây lớn mỗi ngày có ghi (1 ngày tính 1 lần), bỏ lỡ thì ngừng lớn, KHÔNG héo.
--   Được tính khi có ≥ 1 câu ngắn (cai_dat.so_chu_tinh_chuoi = 3 chữ). Mốc theo số ngày cây lớn 7 / 30 / 100 +
--   "Gia đình đọc sách" (5 lần ghi có bố mẹ). Bỏ mốc số cuốn / chuỗi tuần mới, bỏ mục tiêu tháng.
--   Riêng tư: GVCN / nhân viên chỉ xem CON SỐ; đọc chữ em viết chỉ ở lần ghi em bấm "Cho cô xem" (cho_co_xem).
--   Cảm nhận khi đọc xong + thư gửi chính mình: chỉ em xem. Thư mở lại sau cai_dat.so_ngay_mo_thu (90) ngày.
--   Bố mẹ viết 1 dòng (bo_me_viet). Sách có số trang (thanh kéo) + câu hỏi theo sách do thủ thư nhập (5 phút trò chuyện).
-- Sau khi chạy: Neon → Data API → Refresh schema cache.

-- ───────────── Cài đặt ─────────────
alter table public.cai_dat add column if not exists so_ngay_mo_thu smallint not null default 90 check (so_ngay_mo_thu between 7 and 365);
update public.cai_dat set so_chu_tinh_chuoi = 3 where id = 1 and so_chu_tinh_chuoi = 20;   -- chỉ đổi khi còn giá trị cũ

-- ───────────── Sách: số trang, câu hỏi theo sách ─────────────
alter table public.sach add column if not exists so_trang smallint check (so_trang between 1 and 3000);
alter table public.sach add column if not exists cau_hoi text check (length(cau_hoi) <= 1000);   -- mỗi dòng 1 câu
grant update (ten, tac_gia, nxb, nam, khoi_tu, khoi_den, so_ban, vi_tri, gioi_thieu, anh_bia, an, sua_luc, so_trang, cau_hoi)
  on public.sach to authenticated;

-- ───────────── Nhật ký: bố mẹ viết, cho cô xem ─────────────
alter table public.nhat_ky add column if not exists bo_me_viet text check (length(bo_me_viet) <= 300);
alter table public.nhat_ky add column if not exists cho_co_xem boolean not null default false;
create index if not exists nhat_ky_chia_se_idx on public.nhat_ky (hoc_sinh_id, ngay desc) where cho_co_xem;
create index if not exists nhat_ky_tinh_idx on public.nhat_ky (hoc_sinh_id, ngay) where tinh_chuoi;

alter table public.moc_dat drop constraint if exists moc_dat_ma_check;
alter table public.moc_dat add constraint moc_dat_ma_check check (ma in ('cuon_1', 'cuon_5', 'cuon_10', 'cuon_20', 'chuoi_4', 'chuoi_8',
  'ngay_7', 'ngay_30', 'ngay_100', 'gia_dinh'));

-- ───────────── Thư gửi chính mình (chỉ em; đọc qua hàm, khi đến ngày mở) ─────────────
create table if not exists public.thu_gui_minh (
  hoc_sinh_id  uuid not null references public.ho_so(id) on delete cascade,
  sach_id      bigint not null references public.sach(id) on delete restrict,
  noi_dung     text not null check (length(trim(noi_dung)) between 1 and 500),
  viet_ngay    date not null,
  mo_ngay      date not null,
  da_mo_luc    timestamptz,
  primary key (hoc_sinh_id, sach_id)
);
create index if not exists thu_gui_minh_mo_idx on public.thu_gui_minh (hoc_sinh_id, mo_ngay);
alter table public.thu_gui_minh enable row level security;   -- không policy + không grant: chỉ đọc / ghi qua hàm

-- ───────────── RLS riêng tư ─────────────
drop policy if exists nhat_ky_xem on public.nhat_ky;
create policy nhat_ky_xem on public.nhat_ky for select to authenticated using (
  (hoc_sinh_id = (select public.toi()) and (select public.vai_tro_cua_toi()) is not null)
  or (cho_co_xem and ((select public.la_nhan_vien())
      or ((select public.vai_tro_cua_toi()) = 'giao_vien' and public.la_hs_lop_toi(hoc_sinh_id))))
);
drop policy if exists doc_xong_xem on public.doc_xong;        -- có cảm nhận (chữ em viết) → chỉ em; số liệu qua hàm
create policy doc_xong_xem on public.doc_xong for select to authenticated using (
  hoc_sinh_id = (select public.toi()) and (select public.vai_tro_cua_toi()) is not null
);

-- ───────────── Hàm nội bộ: cây, mốc ─────────────
-- Cây của 1 em: { so_ngay (tổng số ngày có lần ghi được tính), tuan_nay (số ngày tuần này, từ thứ Hai), hom_nay (đã ghi chưa) }.
-- tinh_chuoi chỉ đúng ở tối đa 1 lần / ngày (tinh_lai_ngay) nên đếm dòng = đếm ngày.
create or replace function public.cay_cua(p_hs uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with d as (select ngay from public.nhat_ky where hoc_sinh_id = p_hs and tinh_chuoi)
  select jsonb_build_object(
    'so_ngay', (select count(*) from d),
    'tuan_nay', (select count(*) from d where ngay >= date_trunc('week', public.hom_nay())::date),
    'hom_nay', exists (select 1 from d where ngay = public.hom_nay()))
$$;

create or replace function public.cap_nhat_moc(p_hs uuid) returns text[]
language plpgsql security definer set search_path = public as $$
declare v_ngay int := (select count(*) from public.nhat_ky where hoc_sinh_id = p_hs and tinh_chuoi);
  v_bo_me int := (select count(*) from public.nhat_ky where hoc_sinh_id = p_hs and (cung_bo_me or bo_me_viet is not null));
  kq text[];
begin
  with moi as (
    insert into public.moc_dat (hoc_sinh_id, ma)
    select p_hs, m.ma from (values ('ngay_7', 'ngay', 7), ('ngay_30', 'ngay', 30), ('ngay_100', 'ngay', 100),
      ('gia_dinh', 'bo_me', 5)) m(ma, loai, muc)
    where (m.loai = 'ngay' and v_ngay >= m.muc) or (m.loai = 'bo_me' and v_bo_me >= m.muc)
    on conflict do nothing returning ma)
  select coalesce(array_agg(ma), '{}') into kq from moi;
  return kq;
end $$;

-- ───────────── Học sinh ghi ─────────────
drop function if exists public.ghi_nhat_ky(bigint, text, text, text, int, boolean);
drop function if exists public.sua_nhat_ky(bigint, text, text, text, int, boolean);
drop function if exists public.danh_dau_doc_xong(bigint, int, text);
drop function if exists public.dat_muc_tieu(int);

create or replace function public.ghi_nhat_ky(p_sach_id bigint, p_cam_xuc text, p_doan_nho text default null,
  p_em_nghi text default null, p_trang int default null, p_cung_bo_me boolean default false,
  p_bo_me_viet text default null, p_cho_co_xem boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare toi uuid := public.toi(); d date := public.hom_nay(); v_id bigint; v_bo_me text := nullif(trim(p_bo_me_viet), '');
begin
  if public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  perform 1 from public.sach where id = p_sach_id and not an;
  if not found then raise exception 'khong_co_sach'; end if;
  if (select count(*) from public.nhat_ky where hoc_sinh_id = toi and ngay = d) >= 20 then raise exception 'qua_nhieu_lan'; end if;
  insert into public.nhat_ky (hoc_sinh_id, sach_id, ngay, doan_nho, trang, cam_xuc, em_nghi, cung_bo_me, bo_me_viet, cho_co_xem)
  values (toi, p_sach_id, d, nullif(trim(p_doan_nho), ''), p_trang, p_cam_xuc, nullif(trim(p_em_nghi), ''),
    coalesce(p_cung_bo_me, false) or v_bo_me is not null, v_bo_me, coalesce(p_cho_co_xem, false))
  returning id into v_id;
  perform public.tinh_lai_ngay(toi, d);
  return jsonb_build_object('id', v_id, 'tinh_chuoi', (select tinh_chuoi from public.nhat_ky where id = v_id),
    'cay', public.cay_cua(toi), 'moc_moi', to_jsonb(public.cap_nhat_moc(toi)));
end $$;

create or replace function public.sua_nhat_ky(p_id bigint, p_cam_xuc text, p_doan_nho text default null,
  p_em_nghi text default null, p_trang int default null, p_cung_bo_me boolean default false,
  p_bo_me_viet text default null, p_cho_co_xem boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.nhat_ky; v_bo_me text := nullif(trim(p_bo_me_viet), '');
begin
  select * into r from public.nhat_ky where id = p_id for update;
  if not found or r.hoc_sinh_id <> public.toi() or public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  if r.ngay < public.hom_nay() - 7 then raise exception 'het_han_sua'; end if;
  update public.nhat_ky set cam_xuc = p_cam_xuc, doan_nho = nullif(trim(p_doan_nho), ''), em_nghi = nullif(trim(p_em_nghi), ''),
    trang = p_trang, cung_bo_me = coalesce(p_cung_bo_me, false) or v_bo_me is not null, bo_me_viet = v_bo_me,
    cho_co_xem = coalesce(p_cho_co_xem, false), sua_luc = now() where id = p_id;
  perform public.tinh_lai_ngay(r.hoc_sinh_id, r.ngay);
  return jsonb_build_object('tinh_chuoi', (select tinh_chuoi from public.nhat_ky where id = p_id), 'cay', public.cay_cua(r.hoc_sinh_id));
end $$;

-- Bật / tắt "Cho cô xem" ở 1 lần ghi của chính em — lúc nào cũng được (không giới hạn 7 ngày).
create or replace function public.doi_cho_co_xem(p_id bigint, p_cho boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  update public.nhat_ky set cho_co_xem = coalesce(p_cho, false) where id = p_id and hoc_sinh_id = public.toi();
  if not found then raise exception 'forbidden'; end if;
end $$;

-- Em đọc xong (cần ≥ 1 lần ghi). p_thu: thư gửi chính mình, mở lại sau so_ngay_mo_thu ngày (viết lại → hẹn lại). Trả { moc_moi }.
create or replace function public.danh_dau_doc_xong(p_sach_id bigint, p_muc_thich int, p_cam_nhan text default null,
  p_thu text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare toi uuid := public.toi(); d date := public.hom_nay();
begin
  if public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.nhat_ky where hoc_sinh_id = toi and sach_id = p_sach_id) then
    raise exception 'chua_ghi_nhat_ky';
  end if;
  insert into public.doc_xong (hoc_sinh_id, sach_id, muc_thich, cam_nhan, ngay)
  values (toi, p_sach_id, p_muc_thich, nullif(trim(p_cam_nhan), ''), d)
  on conflict (hoc_sinh_id, sach_id) do update set muc_thich = excluded.muc_thich, cam_nhan = excluded.cam_nhan;
  if nullif(trim(p_thu), '') is not null then
    insert into public.thu_gui_minh (hoc_sinh_id, sach_id, noi_dung, viet_ngay, mo_ngay)
    values (toi, p_sach_id, trim(p_thu), d, d + (select so_ngay_mo_thu from public.cai_dat where id = 1))
    on conflict (hoc_sinh_id, sach_id) do update set noi_dung = excluded.noi_dung, viet_ngay = excluded.viet_ngay,
      mo_ngay = excluded.mo_ngay, da_mo_luc = null;
  end if;
  return jsonb_build_object('moc_moi', to_jsonb(public.cap_nhat_moc(toi)));
end $$;

-- Mở 1 lá thư đã đến ngày → { sach, noi_dung, viet_ngay }. Chưa đến ngày / không có → 'chua_den_ngay'.
create or replace function public.mo_thu(p_sach_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare toi uuid := public.toi(); r public.thu_gui_minh;
begin
  if public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  select * into r from public.thu_gui_minh where hoc_sinh_id = toi and sach_id = p_sach_id and mo_ngay <= public.hom_nay();
  if not found then raise exception 'chua_den_ngay'; end if;
  update public.thu_gui_minh set da_mo_luc = coalesce(da_mo_luc, now()) where hoc_sinh_id = toi and sach_id = p_sach_id;
  return jsonb_build_object('sach_id', r.sach_id, 'ten', (select ten from public.sach where id = r.sach_id),
    'noi_dung', r.noi_dung, 'viet_ngay', r.viet_ngay);
end $$;

-- ───────────── Học sinh đọc ─────────────
-- Trang chủ, 1 lần gọi: cây, đang đọc (đọc tiếp), Góc bố mẹ (tuần này), thư đến hạn / đang chờ, sách đã đọc xong.
create or replace function public.tong_quan_cua_toi()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare toi uuid := public.toi(); d date := public.hom_nay(); tuan date := date_trunc('week', public.hom_nay())::date;
begin
  if public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'cay', public.cay_cua(toi),
    'lan_ghi_cuoi', (select max(ngay) from public.nhat_ky where hoc_sinh_id = toi),
    'so_chu_tinh_chuoi', (select so_chu_tinh_chuoi from public.cai_dat where id = 1),
    'doc_xong', coalesce((select jsonb_agg(sach_id) from public.doc_xong where hoc_sinh_id = toi), '[]'::jsonb),
    'dang_doc', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'ma_sach', s.ma_sach, 'ten', s.ten, 'tac_gia', s.tac_gia,
        'anh_bia', s.anh_bia, 'so_trang', s.so_trang, 'trang_cuoi', x.trang_cuoi, 'lan_cuoi', x.lan_cuoi) order by x.id_cuoi desc)
      from (select sach_id, max(trang) trang_cuoi, max(ngay) lan_cuoi, max(id) id_cuoi from public.nhat_ky n
            where hoc_sinh_id = toi and not exists (select 1 from public.doc_xong x where x.hoc_sinh_id = toi and x.sach_id = n.sach_id)
            group by sach_id order by max(id) desc limit 3) x
      join public.sach s on s.id = x.sach_id), '[]'::jsonb),
    'tuan', (select jsonb_build_object('so_lan', count(*), 'bo_me', count(*) filter (where cung_bo_me),
        'cam_xuc', coalesce((select jsonb_object_agg(cam_xuc, so) from (select cam_xuc, count(*) so from public.nhat_ky
          where hoc_sinh_id = toi and ngay >= tuan group by 1) c), '{}'::jsonb))
      from public.nhat_ky where hoc_sinh_id = toi and ngay >= tuan),
    'thu_den_han', coalesce((select jsonb_agg(jsonb_build_object('sach_id', t.sach_id, 'ten', s.ten, 'viet_ngay', t.viet_ngay))
      from public.thu_gui_minh t join public.sach s on s.id = t.sach_id
      where t.hoc_sinh_id = toi and t.mo_ngay <= d and t.da_mo_luc is null), '[]'::jsonb),
    'thu_cho', (select min(mo_ngay) from public.thu_gui_minh where hoc_sinh_id = toi and mo_ngay > d));
end $$;

-- Nhìn lại năm (chính mình hoặc GVCN / nhân viên xem 1 em). Người khác: chỉ con số + cảm xúc theo trang, KHÔNG có chữ em viết.
create or replace function public.nhin_lai_nam(p_hs uuid default null, p_tu date default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare hs uuid := coalesce(p_hs, public.toi()); la_em boolean; d date := public.hom_nay(); tu date; den date;
begin
  if not public.xem_duoc_hs(hs) then raise exception 'forbidden'; end if;
  la_em := hs = public.toi();
  tu := coalesce(p_tu, make_date(extract(year from d)::int - case when extract(month from d) < 9 then 1 else 0 end, 9, 1));
  den := (tu + interval '1 year')::date;
  return jsonb_build_object(
    'ho_ten', (select ho_ten from public.ho_so where id = hs),
    'la_em', la_em,
    'tu', tu, 'den', den - 1,
    'so_cuon', (select count(*) from public.doc_xong where hoc_sinh_id = hs and ngay >= tu and ngay < den),
    'so_lan_ghi', (select count(*) from public.nhat_ky where hoc_sinh_id = hs and ngay >= tu and ngay < den),
    'so_ngay', (select count(*) from public.nhat_ky where hoc_sinh_id = hs and ngay >= tu and ngay < den and tinh_chuoi),
    'so_lan_bo_me', (select count(*) from public.nhat_ky where hoc_sinh_id = hs and ngay >= tu and ngay < den and cung_bo_me),
    'so_chia_se', (select count(*) from public.nhat_ky where hoc_sinh_id = hs and ngay >= tu and ngay < den and cho_co_xem),
    'cay', public.cay_cua(hs),
    'cam_xuc', coalesce((select jsonb_object_agg(cam_xuc, so) from (select cam_xuc, count(*) so from public.nhat_ky
      where hoc_sinh_id = hs and ngay >= tu and ngay < den group by 1) c), '{}'::jsonb),
    'theo_thang', coalesce((select jsonb_agg(jsonb_build_object('thang', thang, 'so_lan', so_lan, 'so_cuon', so_cuon) order by thang) from (
      select to_char(m, 'YYYY-MM') thang,
        (select count(*) from public.nhat_ky where hoc_sinh_id = hs and date_trunc('month', ngay) = m) so_lan,
        (select count(*) from public.doc_xong where hoc_sinh_id = hs and date_trunc('month', ngay) = m) so_cuon
      from generate_series(tu::timestamp, least(den - 1, d)::timestamp, interval '1 month') m) t), '[]'::jsonb),
    'sach', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'ma_sach', s.ma_sach, 'ten', s.ten, 'tac_gia', s.tac_gia,
        'anh_bia', s.anh_bia, 'so_trang', s.so_trang, 'so_lan', x.so_lan, 'dau', x.dau, 'muc_thich', dx.muc_thich, 'ngay_xong', dx.ngay,
        'cam_nhan', case when la_em then dx.cam_nhan end,
        'hanh_trinh', (select jsonb_agg(jsonb_build_object('trang', n.trang, 'cam_xuc', n.cam_xuc, 'ngay', n.ngay) order by n.ngay, n.id)
          from public.nhat_ky n where n.hoc_sinh_id = hs and n.sach_id = s.id))
        order by x.dau, s.id) from (
      select sach_id, count(*) so_lan, min(ngay) dau from public.nhat_ky
      where hoc_sinh_id = hs and ngay >= tu and ngay < den group by sach_id) x
      join public.sach s on s.id = x.sach_id
      left join public.doc_xong dx on dx.hoc_sinh_id = hs and dx.sach_id = x.sach_id), '[]'::jsonb),
    'thu', case when la_em then coalesce((select jsonb_agg(jsonb_build_object('ten', s.ten, 'noi_dung', t.noi_dung,
        'viet_ngay', t.viet_ngay) order by t.viet_ngay)
      from public.thu_gui_minh t join public.sach s on s.id = t.sach_id
      where t.hoc_sinh_id = hs and t.da_mo_luc is not null), '[]'::jsonb) else '[]'::jsonb end,
    'moc', coalesce((select jsonb_agg(jsonb_build_object('ma', ma, 'dat_luc', dat_luc) order by dat_luc)
      from public.moc_dat where hoc_sinh_id = hs), '[]'::jsonb));
end $$;

-- Lớp của tôi (GVCN: lớp mình; nhân viên: lớp chọn). Chỉ con số: cây, lần ghi gần nhất, số cuốn từ 1/9, số lần em cho cô xem.
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
        'cay', public.cay_cua(h.id),
        'lan_ghi_cuoi', (select max(ngay) from public.nhat_ky where hoc_sinh_id = h.id),
        'so_cuon_nam', (select count(*) from public.doc_xong where hoc_sinh_id = h.id and ngay >= tu),
        'so_chia_se', (select count(*) from public.nhat_ky where hoc_sinh_id = h.id and cho_co_xem)) order by h.ho_ten)
      from public.ho_so h where h.lop_id = v_lop and h.vai_tro = 'hoc_sinh' and h.hoat_dong), '[]'::jsonb));
end $$;

drop function if exists public.chuoi_cua(uuid);   -- đã thay bằng cay_cua (mọi hàm gọi đã định nghĩa lại ở trên)

-- ───────────── Quyền ─────────────
revoke all on public.thu_gui_minh from anonymous, authenticated;
revoke all on function public.cay_cua(uuid), public.cap_nhat_moc(uuid) from public, anonymous, authenticated;

revoke all on function public.ghi_nhat_ky(bigint, text, text, text, int, boolean, text, boolean),
  public.sua_nhat_ky(bigint, text, text, text, int, boolean, text, boolean), public.doi_cho_co_xem(bigint, boolean),
  public.danh_dau_doc_xong(bigint, int, text, text), public.mo_thu(bigint), public.tong_quan_cua_toi(),
  public.nhin_lai_nam(uuid, date), public.lop_tong_quan(bigint) from public, anonymous;
grant execute on function public.ghi_nhat_ky(bigint, text, text, text, int, boolean, text, boolean),
  public.sua_nhat_ky(bigint, text, text, text, int, boolean, text, boolean), public.doi_cho_co_xem(bigint, boolean),
  public.danh_dau_doc_xong(bigint, int, text, text), public.mo_thu(bigint), public.tong_quan_cua_toi(),
  public.nhin_lai_nam(uuid, date), public.lop_tong_quan(bigint) to authenticated;
