-- CHẠY TRÊN NEON (node scripts/chay-sql.mjs sql/2026-11-19_ho_chieu.sql). Chạy lại được.
-- Chạy SAU 2026-11-19_cay_doc_sach.sql — tệp này THAY cap_nhat_moc, danh_dau_doc_xong, lop_tong_quan của tệp đó
-- (chạy lại tệp cay_doc_sach thì phải chạy lại tệp này).
-- Hộ chiếu thể loại (thầy chốt 19/11/2026, KE-HOACH-APP.md mục 11):
--   Mỗi con tem = 1 chủ đề sách (bảng chu_de). Em "đọc xong" 1 cuốn → được tem các chủ đề của cuốn đó (≤ 2).
--   Tem do máy chủ TÍNH từ doc_xong + sach_chu_de (không có bảng tem, trình duyệt không gửi tem lên được).
--   Mốc mới: 'tham_hiem' (5 tem khác nhau), 'ho_chieu_day' (đủ tem mọi chủ đề, khi thư viện có ≥ 5 chủ đề).
--   GVCN / nhân viên: chỉ con số "so_tem" trong lop_tong_quan.
-- Không có bảng / cột mới → không cần Refresh schema cache trừ khi gặp lỗi "Could not find the function".

alter table public.moc_dat drop constraint if exists moc_dat_ma_check;
alter table public.moc_dat add constraint moc_dat_ma_check check (ma in ('cuon_1', 'cuon_5', 'cuon_10', 'cuon_20', 'chuoi_4', 'chuoi_8',
  'ngay_7', 'ngay_30', 'ngay_100', 'gia_dinh', 'tham_hiem', 'ho_chieu_day'));

-- Các chủ đề em đã có tem (nội bộ).
create or replace function public.tem_cua(p_hs uuid) returns bigint[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(distinct sc.chu_de_id), '{}')
  from public.doc_xong d join public.sach_chu_de sc on sc.sach_id = d.sach_id
  where d.hoc_sinh_id = p_hs
$$;

create or replace function public.cap_nhat_moc(p_hs uuid) returns text[]
language plpgsql security definer set search_path = public as $$
declare v_ngay int := (select count(*) from public.nhat_ky where hoc_sinh_id = p_hs and tinh_chuoi);
  v_bo_me int := (select count(*) from public.nhat_ky where hoc_sinh_id = p_hs and (cung_bo_me or bo_me_viet is not null));
  v_tem int := cardinality(public.tem_cua(p_hs));
  v_tong int := (select count(*) from public.chu_de);
  kq text[];
begin
  with moi as (
    insert into public.moc_dat (hoc_sinh_id, ma)
    select p_hs, m.ma from (values ('ngay_7', 'ngay', 7), ('ngay_30', 'ngay', 30), ('ngay_100', 'ngay', 100),
      ('gia_dinh', 'bo_me', 5), ('tham_hiem', 'tem', 5), ('ho_chieu_day', 'day', 0)) m(ma, loai, muc)
    where (m.loai = 'ngay' and v_ngay >= m.muc) or (m.loai = 'bo_me' and v_bo_me >= m.muc)
       or (m.loai = 'tem' and v_tem >= m.muc) or (m.loai = 'day' and v_tong >= 5 and v_tem >= v_tong)
    on conflict do nothing returning ma)
  select coalesce(array_agg(ma), '{}') into kq from moi;
  return kq;
end $$;

-- Như bản 19/11 (cay_doc_sach) + trả thêm tem_moi: [tên chủ đề vừa được tem].
create or replace function public.danh_dau_doc_xong(p_sach_id bigint, p_muc_thich int, p_cam_nhan text default null,
  p_thu text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare toi uuid := public.toi(); d date := public.hom_nay(); v_truoc bigint[];
begin
  if public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.nhat_ky where hoc_sinh_id = toi and sach_id = p_sach_id) then
    raise exception 'chua_ghi_nhat_ky';
  end if;
  v_truoc := public.tem_cua(toi);
  insert into public.doc_xong (hoc_sinh_id, sach_id, muc_thich, cam_nhan, ngay)
  values (toi, p_sach_id, p_muc_thich, nullif(trim(p_cam_nhan), ''), d)
  on conflict (hoc_sinh_id, sach_id) do update set muc_thich = excluded.muc_thich, cam_nhan = excluded.cam_nhan;
  if nullif(trim(p_thu), '') is not null then
    insert into public.thu_gui_minh (hoc_sinh_id, sach_id, noi_dung, viet_ngay, mo_ngay)
    values (toi, p_sach_id, trim(p_thu), d, d + (select so_ngay_mo_thu from public.cai_dat where id = 1))
    on conflict (hoc_sinh_id, sach_id) do update set noi_dung = excluded.noi_dung, viet_ngay = excluded.viet_ngay,
      mo_ngay = excluded.mo_ngay, da_mo_luc = null;
  end if;
  return jsonb_build_object('moc_moi', to_jsonb(public.cap_nhat_moc(toi)),
    'tem_moi', coalesce((select jsonb_agg(c.ten order by c.thu_tu, c.ten) from public.chu_de c
      where c.id = any(public.tem_cua(toi)) and not c.id = any(v_truoc)), '[]'::jsonb));
end $$;

-- Hộ chiếu của em → { tem: [{ id, ten, ngay, sach (cuốn đầu tiên cho tem) | null, goi_y: [≤ 2 sách] (chỉ tem chưa có) }] }.
-- Gợi ý: sách không ẩn, đúng khối, em chưa đọc xong / chưa đặt, còn bản trên kệ trước.
create or replace function public.ho_chieu_cua_toi()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare toi uuid := public.toi(); v_khoi int;
begin
  if public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  select l.khoi into v_khoi from public.ho_so h join public.lop l on l.id = h.lop_id where h.id = toi;
  return jsonb_build_object('tem', coalesce((
    select jsonb_agg(jsonb_build_object('id', c.id, 'ten', c.ten, 'ngay', t.ngay, 'sach', t.ten,
      'goi_y', case when t.ngay is null then coalesce((
        select jsonb_agg(jsonb_build_object('id', g.id, 'ma_sach', g.ma_sach, 'ten', g.ten, 'anh_bia', g.anh_bia, 'con_ban', g.con_ban))
        from (select s.id, s.ma_sach, s.ten, s.anh_bia, public.ban_ranh(s.id) con_ban
              from public.sach_chu_de sc join public.sach s on s.id = sc.sach_id
              where sc.chu_de_id = c.id and not s.an and s.so_ban > 0
                and (v_khoi is null or v_khoi between s.khoi_tu and s.khoi_den)
                and not exists (select 1 from public.doc_xong x where x.hoc_sinh_id = toi and x.sach_id = s.id)
                and not exists (select 1 from public.luot_muon l where l.hoc_sinh_id = toi and l.sach_id = s.id
                                and l.trang_thai in ('dat_truoc', 'da_soan', 'dang_muon'))
              order by public.ban_ranh(s.id) > 0 desc, random() limit 2) g), '[]'::jsonb) end)
      order by c.thu_tu, c.ten)
    from public.chu_de c
    left join lateral (select d.ngay, s.ten from public.doc_xong d join public.sach_chu_de sc on sc.sach_id = d.sach_id
                       join public.sach s on s.id = d.sach_id
                       where d.hoc_sinh_id = toi and sc.chu_de_id = c.id order by d.ngay, d.sach_id limit 1) t on true), '[]'::jsonb));
end $$;

-- Như bản 19/11 + so_tem.
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
    'tong_chu_de', (select count(*) from public.chu_de),
    'hoc_sinh', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'ho_ten', h.ho_ten,
        'cay', public.cay_cua(h.id),
        'lan_ghi_cuoi', (select max(ngay) from public.nhat_ky where hoc_sinh_id = h.id),
        'so_cuon_nam', (select count(*) from public.doc_xong where hoc_sinh_id = h.id and ngay >= tu),
        'so_tem', cardinality(public.tem_cua(h.id)),
        'so_chia_se', (select count(*) from public.nhat_ky where hoc_sinh_id = h.id and cho_co_xem)) order by h.ho_ten)
      from public.ho_so h where h.lop_id = v_lop and h.vai_tro = 'hoc_sinh' and h.hoat_dong), '[]'::jsonb));
end $$;

revoke all on function public.tem_cua(uuid), public.cap_nhat_moc(uuid) from public, anonymous, authenticated;
revoke all on function public.ho_chieu_cua_toi(), public.danh_dau_doc_xong(bigint, int, text, text), public.lop_tong_quan(bigint)
  from public, anonymous;
grant execute on function public.ho_chieu_cua_toi(), public.danh_dau_doc_xong(bigint, int, text, text), public.lop_tong_quan(bigint)
  to authenticated;
