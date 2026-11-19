-- CHẠY TRÊN NEON (node scripts/chay-sql.mjs sql/2026-11-19_thu_thach_lop.sql). Chạy lại được.
-- Chạy SAU 2026-11-19_ho_chieu.sql — tệp này THAY cap_nhat_moc của tệp đó (chạy lại tệp ho_chieu / cay_doc_sach thì
-- phải chạy lại tệp này).
-- Thử thách lớp theo số ngày ghi (thầy chốt 19/11/2026, KE-HOACH-APP.md mục 11):
--   GVCN đặt cho lớp mình (nhân viên: lớp nào cũng được): tên, từ ngày – đến ngày (≤ 62 ngày), mỗi em cần N ngày ghi.
--   Ngày được tính = ngày "cây lớn" (nhat_ky.tinh_chuoi, 1 ngày tính 1 lần) — MÁY CHỦ đếm, trình duyệt không gửi số lên.
--   Mỗi lớp chỉ 1 thử thách chưa kết thúc; không chồng thời gian. Kết thúc sớm: đến ngày = hôm qua (chưa bắt đầu → xoá).
--   HS thấy: số ngày của em + "X/Y bạn đã đạt" (không tên bạn nào). GVCN / nhân viên: số ngày từng em (chỉ con số).
--   Em đạt → mốc 'thu_thach' (🏅, lần đầu). Không xếp hạng.
-- Bảng mới → sau khi chạy: Neon → Data API → Refresh schema cache.

create table if not exists public.thu_thach_lop (
  id        bigint generated always as identity primary key,
  lop_id    bigint not null references public.lop(id) on delete cascade,
  ten       text not null check (char_length(trim(ten)) between 3 and 80),
  tu        date not null,
  den       date not null,
  so_ngay   smallint not null check (so_ngay between 1 and 62),
  tao_boi   uuid references public.ho_so(id) on delete set null,
  tao_luc   timestamptz not null default now(),
  check (den >= tu and den - tu <= 61)
);
create index if not exists thu_thach_lop_idx on public.thu_thach_lop (lop_id, den desc);
alter table public.thu_thach_lop enable row level security;      -- không policy, không cấp quyền: chỉ qua hàm
revoke all on public.thu_thach_lop from public, anonymous, authenticated;

alter table public.moc_dat drop constraint if exists moc_dat_ma_check;
alter table public.moc_dat add constraint moc_dat_ma_check check (ma in ('cuon_1', 'cuon_5', 'cuon_10', 'cuon_20', 'chuoi_4', 'chuoi_8',
  'ngay_7', 'ngay_30', 'ngay_100', 'gia_dinh', 'tham_hiem', 'ho_chieu_day', 'thu_thach'));

-- ───────────── Nội bộ ─────────────
-- Số ngày cây lớn của 1 em trong [tu, den] (dùng chỉ mục nhat_ky_tinh_idx).
create or replace function public.ngay_ghi_trong(p_hs uuid, p_tu date, p_den date) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.nhat_ky where hoc_sinh_id = p_hs and tinh_chuoi and ngay between p_tu and p_den
$$;

-- Quyền quản lý lớp: dùng lại quan_ly_lop(lop) của 2026-11-19_dang_nhap_pin.sql (nhân viên, hoặc GVCN đúng lớp).

-- Tóm tắt 1 thử thách: { id, ten, tu, den, so_ngay, si_so, so_dat [, hs: [{ id, so_ngay }]] } — chỉ con số.
create or replace function public.tom_tat_thu_thach(p_id bigint, p_tung_em boolean) returns jsonb
language sql stable security definer set search_path = public as $$
  with t as (select * from public.thu_thach_lop where id = p_id),
  e as (select h.id, public.ngay_ghi_trong(h.id, t.tu, t.den) n from t
        join public.ho_so h on h.lop_id = t.lop_id and h.vai_tro = 'hoc_sinh' and h.hoat_dong)
  select jsonb_build_object('id', t.id, 'ten', t.ten, 'tu', t.tu, 'den', t.den, 'so_ngay', t.so_ngay,
      'si_so', (select count(*) from e), 'so_dat', (select count(*) from e where e.n >= t.so_ngay))
    || case when p_tung_em then jsonb_build_object('hs', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'so_ngay', e.n)) from e), '[]'::jsonb))
            else '{}'::jsonb end
  from t
$$;

-- Như bản ho_chieu + 'thu_thach': em đạt đủ số ngày của 1 thử thách bất kỳ của lớp em.
create or replace function public.cap_nhat_moc(p_hs uuid) returns text[]
language plpgsql security definer set search_path = public as $$
declare v_ngay int := (select count(*) from public.nhat_ky where hoc_sinh_id = p_hs and tinh_chuoi);
  v_bo_me int := (select count(*) from public.nhat_ky where hoc_sinh_id = p_hs and (cung_bo_me or bo_me_viet is not null));
  v_tem int := cardinality(public.tem_cua(p_hs));
  v_tong int := (select count(*) from public.chu_de);
  v_tt boolean := exists (select 1 from public.thu_thach_lop t join public.ho_so h on h.lop_id = t.lop_id
                          where h.id = p_hs and t.tu <= public.hom_nay()
                            and public.ngay_ghi_trong(p_hs, t.tu, t.den) >= t.so_ngay);
  kq text[];
begin
  with moi as (
    insert into public.moc_dat (hoc_sinh_id, ma)
    select p_hs, m.ma from (values ('ngay_7', 'ngay', 7), ('ngay_30', 'ngay', 30), ('ngay_100', 'ngay', 100),
      ('gia_dinh', 'bo_me', 5), ('tham_hiem', 'tem', 5), ('ho_chieu_day', 'day', 0), ('thu_thach', 'tt', 0)) m(ma, loai, muc)
    where (m.loai = 'ngay' and v_ngay >= m.muc) or (m.loai = 'bo_me' and v_bo_me >= m.muc)
       or (m.loai = 'tem' and v_tem >= m.muc) or (m.loai = 'day' and v_tong >= 5 and v_tem >= v_tong)
       or (m.loai = 'tt' and v_tt)
    on conflict do nothing returning ma)
  select coalesce(array_agg(ma), '{}') into kq from moi;
  return kq;
end $$;

-- ───────────── Gọi từ app ─────────────
-- GVCN: lớp mình (p_lop_id bỏ qua); nhân viên: p_lop_id. Trả id.
create or replace function public.tao_thu_thach(p_lop_id bigint, p_ten text, p_tu date, p_den date, p_so_ngay int)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_lop bigint; d date := public.hom_nay(); v_id bigint;
begin
  if public.la_nhan_vien() then v_lop := p_lop_id;
  elsif public.vai_tro_cua_toi() = 'giao_vien' then v_lop := public.lop_cua_toi();
  else raise exception 'forbidden'; end if;
  if v_lop is null then raise exception 'chua_co_lop'; end if;
  perform 1 from public.lop where id = v_lop for update;                -- khoá lớp: 2 người tạo cùng lúc không lọt
  if not found then raise exception 'chua_co_lop'; end if;
  if char_length(trim(coalesce(p_ten, ''))) not between 3 and 80 then raise exception 'sai_ten'; end if;
  if p_tu is null or p_den is null or p_den < p_tu or p_den - p_tu > 61 or p_den < d or p_tu < d - 31 then
    raise exception 'sai_ngay';
  end if;
  if p_so_ngay is null or p_so_ngay < 1 or p_so_ngay > p_den - p_tu + 1 then raise exception 'sai_so_ngay'; end if;
  if exists (select 1 from public.thu_thach_lop where lop_id = v_lop and (den >= d or den >= p_tu)) then
    raise exception 'dang_co_thu_thach';
  end if;
  insert into public.thu_thach_lop (lop_id, ten, tu, den, so_ngay, tao_boi)
  values (v_lop, trim(p_ten), p_tu, p_den, p_so_ngay, public.toi()) returning id into v_id;
  return v_id;
end $$;

-- Kết thúc sớm: đến ngày = hôm qua; chưa bắt đầu (hoặc bắt đầu hôm nay) → xoá.
create or replace function public.ket_thuc_thu_thach(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare r public.thu_thach_lop; d date := public.hom_nay();
begin
  select * into r from public.thu_thach_lop where id = p_id for update;
  if not found or not public.quan_ly_lop(r.lop_id) then raise exception 'forbidden'; end if;
  if r.den < d then raise exception 'da_ket_thuc'; end if;
  if r.tu >= d then delete from public.thu_thach_lop where id = p_id;
  else update public.thu_thach_lop set den = d - 1 where id = p_id; end if;
end $$;

-- HS: thử thách đang chạy (hoặc sắp tới, hoặc vừa xong ≤ 7 ngày) của lớp em → tóm tắt + cua_em; không có → null.
create or replace function public.thu_thach_cua_toi()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare toi uuid := public.toi(); d date := public.hom_nay(); r public.thu_thach_lop;
begin
  if public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  select * into r from public.thu_thach_lop where lop_id = public.lop_cua_toi() and den >= d - 7
  order by case when tu <= d and den >= d then 0 when tu > d then 1 else 2 end, den desc limit 1;
  if not found then return null; end if;
  return public.tom_tat_thu_thach(r.id, false) || jsonb_build_object('cua_em', public.ngay_ghi_trong(toi, r.tu, r.den));
end $$;

-- GVCN (lớp mình) / nhân viên (p_lop_id): { hien_tai: tóm tắt + hs | null, truoc: [≤ 5 thử thách đã xong] }.
create or replace function public.thu_thach_lop(p_lop_id bigint default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_lop bigint; d date := public.hom_nay(); v_ht bigint;
begin
  if public.la_nhan_vien() then v_lop := p_lop_id;
  elsif public.vai_tro_cua_toi() = 'giao_vien' then v_lop := public.lop_cua_toi();
  else raise exception 'forbidden'; end if;
  if v_lop is null then raise exception 'chua_co_lop'; end if;
  select id into v_ht from public.thu_thach_lop where lop_id = v_lop and den >= d;
  return jsonb_build_object(
    'hien_tai', case when v_ht is null then null else public.tom_tat_thu_thach(v_ht, true) end,
    'truoc', coalesce((select jsonb_agg(public.tom_tat_thu_thach(id, false) order by den desc)
                       from (select id, den from public.thu_thach_lop where lop_id = v_lop and den < d order by den desc limit 5) x), '[]'::jsonb));
end $$;

revoke all on function public.ngay_ghi_trong(uuid, date, date), public.tom_tat_thu_thach(bigint, boolean),
  public.cap_nhat_moc(uuid) from public, anonymous, authenticated;
revoke all on function public.tao_thu_thach(bigint, text, date, date, int), public.ket_thuc_thu_thach(bigint),
  public.thu_thach_cua_toi(), public.thu_thach_lop(bigint) from public, anonymous;
grant execute on function public.tao_thu_thach(bigint, text, date, date, int), public.ket_thuc_thu_thach(bigint),
  public.thu_thach_cua_toi(), public.thu_thach_lop(bigint) to authenticated;
