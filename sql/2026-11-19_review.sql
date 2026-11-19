-- CHẠY TRÊN NEON (node scripts/chay-sql.mjs sql/2026-11-19_review.sql). Chạy lại được. Chạy SAU 2026-11-19_cay_doc_sach.sql.
-- Review của bạn bè (thầy chốt 19/11/2026, KE-HOACH-APP.md mục 11):
--   Em đã ĐỌC XONG 1 cuốn mới viết được "Giới thiệu sách cho bạn" (10–300 ký tự), mỗi em 1 bài / cuốn. Gửi → chờ thủ thư duyệt.
--   Sửa bài → phải duyệt lại. Em xoá được lúc nào cũng được. Nhân viên (quan_tri, thu_thu) duyệt / không duyệt (kèm lý do) / gỡ.
--   Tên hiện "Lan N.T. – lớp 3A"; em chọn ẩn tên → "Một bạn lớp 3A" (máy chủ KHÔNG gửi tên khi ẩn).
--   Mọi người đã đăng nhập xem bài ĐÃ DUYỆT + con số "X bạn đã đọc · Y bạn lớp em" (không tên). GVCN chỉ xem, không duyệt.
--   Viết review KHÔNG được thưởng / mốc. Tối đa 5 bài viết / sửa mỗi ngày (chống làm ngập hàng chờ của thủ thư).
--   Bảng không cấp quyền cho ai: mọi đọc / ghi qua hàm dưới đây.
-- Sau khi chạy: Neon → Data API → Refresh schema cache.

create table if not exists public.review (
  id           bigint generated always as identity primary key,
  hoc_sinh_id  uuid not null references public.ho_so(id) on delete cascade,
  sach_id      bigint not null references public.sach(id) on delete cascade,
  noi_dung     text not null check (length(trim(noi_dung)) between 10 and 300),
  an_ten       boolean not null default false,
  trang_thai   text not null default 'cho_duyet' check (trang_thai in ('cho_duyet', 'da_duyet', 'khong_duyet')),
  ly_do        text check (ly_do in ('chua_phu_hop', 'qua_ngan', 'lo_thong_tin')),
  sua_luc      timestamptz not null default now(),
  duyet_luc    timestamptz,
  duyet_boi    uuid references public.ho_so(id) on delete set null,
  unique (hoc_sinh_id, sach_id)
);
create index if not exists review_sach_duyet_idx on public.review (sach_id, duyet_luc desc) where trang_thai = 'da_duyet';
create index if not exists review_cho_idx on public.review (sua_luc) where trang_thai = 'cho_duyet';
create index if not exists review_hs_sua_idx on public.review (hoc_sinh_id, sua_luc);
alter table public.review enable row level security;          -- không policy
revoke all on public.review from public, anonymous, authenticated;

-- ───────────── Học sinh ─────────────
-- Viết / sửa bài của em cho 1 cuốn → { trang_thai: 'cho_duyet' }.
create or replace function public.viet_review(p_sach_id bigint, p_noi_dung text, p_an_ten boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare toi uuid := public.toi();
begin
  if public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  perform 1 from public.sach where id = p_sach_id and not an;
  if not found then raise exception 'khong_co_sach'; end if;
  if not exists (select 1 from public.doc_xong where hoc_sinh_id = toi and sach_id = p_sach_id) then
    raise exception 'chua_doc_xong';
  end if;
  if (select count(*) from public.review where hoc_sinh_id = toi and sach_id <> p_sach_id
      and sua_luc >= public.hom_nay()::timestamp at time zone 'Asia/Ho_Chi_Minh') >= 5 then
    raise exception 'qua_nhieu_review';
  end if;
  insert into public.review (hoc_sinh_id, sach_id, noi_dung, an_ten)
  values (toi, p_sach_id, trim(p_noi_dung), coalesce(p_an_ten, false))
  on conflict (hoc_sinh_id, sach_id) do update set noi_dung = excluded.noi_dung, an_ten = excluded.an_ten,
    trang_thai = 'cho_duyet', ly_do = null, sua_luc = now(), duyet_luc = null, duyet_boi = null;
  return jsonb_build_object('trang_thai', 'cho_duyet');
end $$;

create or replace function public.xoa_review(p_sach_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  delete from public.review where hoc_sinh_id = public.toi() and sach_id = p_sach_id;
end $$;

-- ───────────── Mọi người đã đăng nhập: trang 1 cuốn sách ─────────────
-- → { da_doc, cung_lop, lop, review: [{ id, ten (null nếu ẩn), lop, noi_dung, ngay, la_cua_em }] (30 bài mới duyệt nhất),
--     em_doc_xong, cua_em: { noi_dung, an_ten, trang_thai, ly_do } | null }   (2 ô cuối chỉ có ý nghĩa với học sinh)
create or replace function public.review_cua_sach(p_sach_id bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare toi uuid := public.toi(); vt text := public.vai_tro_cua_toi();
  v_lop bigint := (select lop_id from public.ho_so where id = toi);
begin
  if vt is null then raise exception 'forbidden'; end if;
  perform 1 from public.sach where id = p_sach_id and (not an or public.la_nhan_vien());
  if not found then raise exception 'khong_co_sach'; end if;
  return jsonb_build_object(
    'da_doc', (select count(*) from public.doc_xong where sach_id = p_sach_id),
    'cung_lop', case when v_lop is null then 0 else (select count(*) from public.doc_xong d join public.ho_so h on h.id = d.hoc_sinh_id
       where d.sach_id = p_sach_id and h.lop_id = v_lop) end,
    'lop', (select ten from public.lop where id = v_lop),
    'review', coalesce((select jsonb_agg(to_jsonb(x) - 'duyet_luc' order by x.duyet_luc desc) from (
        select r.id, case when r.an_ten then null else public.ten_hien(h.ho_ten) end ten, l.ten lop, r.noi_dung,
          (r.duyet_luc at time zone 'Asia/Ho_Chi_Minh')::date ngay, r.hoc_sinh_id = toi la_cua_em, r.duyet_luc
        from public.review r join public.ho_so h on h.id = r.hoc_sinh_id left join public.lop l on l.id = h.lop_id
        where r.sach_id = p_sach_id and r.trang_thai = 'da_duyet'
        order by r.duyet_luc desc limit 30) x), '[]'::jsonb),
    'em_doc_xong', vt = 'hoc_sinh' and exists (select 1 from public.doc_xong where hoc_sinh_id = toi and sach_id = p_sach_id),
    'cua_em', case when vt = 'hoc_sinh' then (select jsonb_build_object('noi_dung', noi_dung, 'an_ten', an_ten,
       'trang_thai', trang_thai, 'ly_do', ly_do) from public.review where hoc_sinh_id = toi and sach_id = p_sach_id) end);
end $$;

-- ───────────── Nhân viên: hàng chờ duyệt ─────────────
-- → { so, ds: [{ id, sua_luc, noi_dung, an_ten, ho_ten, ten_hien, lop, sach_id, ten_sach }] } (50 bài chờ lâu nhất trước).
create or replace function public.review_cho_duyet()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.la_nhan_vien() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'so', (select count(*) from public.review where trang_thai = 'cho_duyet'),
    'ds', coalesce((select jsonb_agg(x order by x.sua_luc) from (
        select r.id, r.sua_luc, r.noi_dung, r.an_ten, h.ho_ten, public.ten_hien(h.ho_ten) ten_hien, l.ten lop,
          r.sach_id, s.ten ten_sach
        from public.review r join public.ho_so h on h.id = r.hoc_sinh_id left join public.lop l on l.id = h.lop_id
          join public.sach s on s.id = r.sach_id
        where r.trang_thai = 'cho_duyet' order by r.sua_luc limit 50) x), '[]'::jsonb));
end $$;

-- Duyệt (p_duyet = true; cần p_sua_luc đúng bản thủ thư đang xem — em vừa sửa thì báo 'da_thay_doi')
-- hoặc không duyệt / gỡ bài đã duyệt (p_duyet = false, cần lý do).
create or replace function public.duyet_review(p_id bigint, p_duyet boolean, p_ly_do text default null,
  p_sua_luc timestamptz default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.la_nhan_vien() then raise exception 'forbidden'; end if;
  if p_duyet then
    update public.review set trang_thai = 'da_duyet', ly_do = null, duyet_luc = now(), duyet_boi = public.toi()
    where id = p_id and trang_thai = 'cho_duyet' and sua_luc = p_sua_luc;
    if not found then raise exception 'da_thay_doi'; end if;
  else
    if p_ly_do is null or p_ly_do not in ('chua_phu_hop', 'qua_ngan', 'lo_thong_tin') then raise exception 'thieu_ly_do'; end if;
    update public.review set trang_thai = 'khong_duyet', ly_do = p_ly_do, duyet_luc = now(), duyet_boi = public.toi()
    where id = p_id;
    if not found then raise exception 'da_thay_doi'; end if;
  end if;
end $$;

revoke all on function public.viet_review(bigint, text, boolean), public.xoa_review(bigint), public.review_cua_sach(bigint),
  public.review_cho_duyet(), public.duyet_review(bigint, boolean, text, timestamptz) from public, anonymous;
grant execute on function public.viet_review(bigint, text, boolean), public.xoa_review(bigint), public.review_cua_sach(bigint),
  public.review_cho_duyet(), public.duyet_review(bigint, boolean, text, timestamptz) to authenticated;
