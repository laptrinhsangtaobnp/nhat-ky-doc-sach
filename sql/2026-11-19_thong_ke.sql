-- CHẠY TRÊN NEON (node scripts/chay-sql.mjs sql/2026-11-19_thong_ke.sql). Chạy lại được.
-- Thống kê sáng kiến (thầy chốt 19/11/2026, KE-HOACH-APP.md mục 11; chỉ số theo tài liệu thư viện phần 2 + 3):
--   CHỈ nhân viên (thủ thư, quản trị). GVCN không xem trang này (đã có Lớp của tôi). Mọi số do MÁY CHỦ tính.
--   thong_ke(tu, den, pham_vi, lop): mượn (theo tháng / lớp, top 10, trễ, mất, đặt qua app, từ gợi ý), sách nằm im (toàn trường),
--     số liệu app (nhật ký, đọc xong, review, bố mẹ, chủ đề, thử thách, tem). KHÔNG có tên học sinh.
--   so_lieu_sang_kien: số "Trước" (gộp các lớp thí điểm) thủ thư nhập + số "Sau" nhập tay cho 4 chỉ số khảo sát / bấm giờ.
--     4 chỉ số còn lại app tự điền cột "Sau" (máy chủ chặn nhập tay).
-- Bảng mới → sau khi chạy: Neon → Data API → Refresh schema cache.

create index if not exists luot_muon_ngay_muon_idx on public.luot_muon (ngay_muon) where ngay_muon is not null;

create table if not exists public.so_lieu_sang_kien (
  chi_so       text primary key check (chi_so in ('luot_thang', 'ti_le_muon', 'nam_im', 'tre_mat',
                                                  'gio_bao_cao', 'thich_doc', 'sach_thang', 'phu_huynh')),
  truoc        numeric(10, 2) check (truoc between 0 and 999999),
  nguon_truoc  text check (length(nguon_truoc) <= 200),
  sau          numeric(10, 2) check (sau between 0 and 999999),           -- chỉ 4 chỉ số nhập tay
  nguon_sau    text check (length(nguon_sau) <= 200),
  sua_luc      timestamptz not null default now(),
  sua_boi      uuid references public.ho_so(id) on delete set null
);
alter table public.so_lieu_sang_kien enable row level security;    -- không policy, không cấp quyền: chỉ qua hàm
revoke all on public.so_lieu_sang_kien from public, anonymous, authenticated;

-- Số thủ thư đã nhập → [{ chi_so, truoc, nguon_truoc, sau, nguon_sau, sua_luc }].
create or replace function public.lay_so_lieu_sang_kien()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.la_nhan_vien() then raise exception 'forbidden'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('chi_so', chi_so, 'truoc', truoc, 'nguon_truoc', nguon_truoc,
    'sau', sau, 'nguon_sau', nguon_sau, 'sua_luc', sua_luc)) from public.so_lieu_sang_kien), '[]'::jsonb);
end $$;

-- Lưu 1 chỉ số (null = xoá số đó). Chỉ số app tự đo: không nhận "sau". Tỉ lệ %: 0–100.
create or replace function public.luu_so_lieu(p_chi_so text, p_truoc numeric, p_nguon_truoc text, p_sau numeric, p_nguon_sau text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.la_nhan_vien() then raise exception 'forbidden'; end if;
  if p_chi_so is null or p_chi_so not in ('luot_thang', 'ti_le_muon', 'nam_im', 'tre_mat', 'gio_bao_cao', 'thich_doc', 'sach_thang', 'phu_huynh') then
    raise exception 'sai_chi_so';
  end if;
  if p_sau is not null and p_chi_so in ('luot_thang', 'ti_le_muon', 'nam_im', 'tre_mat') then raise exception 'tu_dong'; end if;
  if p_truoc < 0 or p_sau < 0 or p_truoc > 999999 or p_sau > 999999
     or (p_chi_so in ('ti_le_muon', 'thich_doc', 'phu_huynh') and (p_truoc > 100 or p_sau > 100)) then
    raise exception 'sai_so';
  end if;
  insert into public.so_lieu_sang_kien (chi_so, truoc, nguon_truoc, sau, nguon_sau, sua_luc, sua_boi)
  values (p_chi_so, p_truoc, nullif(left(trim(p_nguon_truoc), 200), ''), p_sau, nullif(left(trim(p_nguon_sau), 200), ''), now(), public.toi())
  on conflict (chi_so) do update set truoc = excluded.truoc, nguon_truoc = excluded.nguon_truoc, sau = excluded.sau,
    nguon_sau = excluded.nguon_sau, sua_luc = now(), sua_boi = excluded.sua_boi;
end $$;

-- Thống kê trong [tu, den] (≤ 401 ngày). pham_vi: 'thi_diem' (các lớp thí điểm) | 'toan_truong' | 'lop' (p_lop_id).
-- Học sinh tính theo lớp HIỆN TẠI của em. "Mượn" = lượt đã giao sách (đang mượn / đã trả / mất), theo ngày giao.
-- Sách nằm im: tính toàn trường (sách không ẩn, còn bản, không ai mượn trong khoảng) — chỉ số của cả thư viện.
create or replace function public.thong_ke(p_tu date, p_den date, p_pham_vi text default 'thi_diem', p_lop_id bigint default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare d date := public.hom_nay();
begin
  if not public.la_nhan_vien() then raise exception 'forbidden'; end if;
  if p_tu is null or p_den is null or p_den < p_tu or p_den - p_tu > 400 then raise exception 'sai_ngay'; end if;
  if p_pham_vi is null or p_pham_vi not in ('thi_diem', 'toan_truong', 'lop') or (p_pham_vi = 'lop' and p_lop_id is null) then
    raise exception 'sai_pham_vi';
  end if;
  return (
    with hs as (
      select h.id, h.lop_id from public.ho_so h join public.lop l on l.id = h.lop_id
      where h.vai_tro = 'hoc_sinh' and h.hoat_dong
        and case p_pham_vi when 'thi_diem' then l.thi_diem when 'lop' then l.id = p_lop_id else true end),
    lm as (   -- mọi lượt (kể cả đặt) của các em trong phạm vi, kèm ngày giao / ngày đặt theo giờ VN
      select x.id, x.sach_id, x.hoc_sinh_id, x.trang_thai, x.nguon, x.han_tra, hs.lop_id,
             (x.ngay_muon at time zone 'Asia/Ho_Chi_Minh')::date ngay_muon,
             (x.ngay_dat at time zone 'Asia/Ho_Chi_Minh')::date ngay_dat,
             (x.ngay_xong at time zone 'Asia/Ho_Chi_Minh')::date ngay_xong
      from public.luot_muon x join hs on hs.id = x.hoc_sinh_id),
    m as (select * from lm where trang_thai in ('dang_muon', 'da_tra', 'mat') and ngay_muon between p_tu and p_den),
    nk as (select n.hoc_sinh_id, n.tinh_chuoi, n.cung_bo_me, n.bo_me_viet
           from public.nhat_ky n join hs on hs.id = n.hoc_sinh_id where n.ngay between p_tu and p_den),
    dx as (select x.hoc_sinh_id, x.sach_id, x.muc_thich
           from public.doc_xong x join hs on hs.id = x.hoc_sinh_id where x.ngay between p_tu and p_den),
    sach_im as (select s.ma_sach, s.ten from public.sach s
                where not s.an and s.so_ban > 0
                  and not exists (select 1 from public.luot_muon x where x.sach_id = s.id and x.ngay_muon is not null
                                  and (x.ngay_muon at time zone 'Asia/Ho_Chi_Minh')::date between p_tu and p_den)),
    cd as (select c.ten,
             (select count(*) from m join public.sach_chu_de sc on sc.sach_id = m.sach_id where sc.chu_de_id = c.id) so_muon,
             (select count(*) from dx join public.sach_chu_de sc on sc.sach_id = dx.sach_id where sc.chu_de_id = c.id) so_doc_xong,
             (select round(avg(dx.muc_thich), 1) from dx join public.sach_chu_de sc on sc.sach_id = dx.sach_id where sc.chu_de_id = c.id) thich_tb
           from public.chu_de c)
    select jsonb_build_object(
      'tu', p_tu, 'den', p_den, 'so_ngay', p_den - p_tu + 1, 'pham_vi', p_pham_vi,
      'si_so', (select count(*) from hs),
      'muon', jsonb_build_object(
        'tong', (select count(*) from m),
        'so_hs', (select count(distinct hoc_sinh_id) from m),
        'theo_thang', coalesce((select jsonb_agg(jsonb_build_object('thang', t, 'so', n) order by t)
                                from (select to_char(ngay_muon, 'YYYY-MM') t, count(*) n from m group by 1) x), '[]'::jsonb),
        'theo_lop', coalesce((select jsonb_agg(jsonb_build_object('lop', l.ten, 'khoi', l.khoi,
                                'si_so', (select count(*) from hs where hs.lop_id = l.id),
                                'so_luot', (select count(*) from m where m.lop_id = l.id),
                                'so_hs', (select count(distinct m.hoc_sinh_id) from m where m.lop_id = l.id)) order by l.khoi, l.ten)
                              from public.lop l where l.id in (select lop_id from hs)), '[]'::jsonb),
        'top', coalesce((select jsonb_agg(jsonb_build_object('ma_sach', s.ma_sach, 'ten', s.ten, 'so', x.n) order by x.n desc, s.ten)
                         from (select sach_id, count(*) n from m group by sach_id order by count(*) desc, sach_id limit 10) x
                         join public.sach s on s.id = x.sach_id), '[]'::jsonb),
        'tre', (select count(*) from m where m.han_tra is not null
                and ((m.trang_thai = 'da_tra' and m.ngay_xong > m.han_tra) or (m.trang_thai = 'dang_muon' and m.han_tra < d))),
        'mat', (select count(*) from m where m.trang_thai = 'mat'),
        'dat_app', (select count(*) from lm where lm.ngay_dat between p_tu and p_den),
        'dat_goi_y', (select count(*) from lm where lm.ngay_dat between p_tu and p_den and lm.nguon = 'goi_y')),
      'nam_im', jsonb_build_object(
        'so', (select count(*) from sach_im),
        'tong_sach', (select count(*) from public.sach where not an and so_ban > 0),
        'ds', coalesce((select jsonb_agg(jsonb_build_object('ma_sach', ma_sach, 'ten', ten) order by ma_sach)
                        from (select * from sach_im order by ma_sach limit 500) x), '[]'::jsonb)),
      'app', jsonb_build_object(
        'so_hs_nhat_ky', (select count(distinct hoc_sinh_id) from nk),
        'so_lan_ghi', (select count(*) from nk),
        'so_ngay_ghi', (select count(*) from nk where tinh_chuoi),
        'so_hs_bo_me', (select count(distinct hoc_sinh_id) from nk where cung_bo_me or bo_me_viet is not null),
        'so_lan_bo_me', (select count(*) from nk where cung_bo_me or bo_me_viet is not null),
        'doc_xong', (select count(*) from dx),
        'so_hs_doc_xong', (select count(distinct hoc_sinh_id) from dx),
        'review_duyet', (select count(*) from public.review r join hs on hs.id = r.hoc_sinh_id
                         where r.trang_thai = 'da_duyet' and (r.duyet_luc at time zone 'Asia/Ho_Chi_Minh')::date between p_tu and p_den),
        'thu_thach_dat', (select count(*) from public.moc_dat md join hs on hs.id = md.hoc_sinh_id
                          where md.ma = 'thu_thach' and (md.dat_luc at time zone 'Asia/Ho_Chi_Minh')::date between p_tu and p_den),
        'tem_tb', (select round(avg(cardinality(public.tem_cua(hs.id))), 1) from hs),
        'chu_de', coalesce((select jsonb_agg(jsonb_build_object('ten', ten, 'so_muon', so_muon, 'so_doc_xong', so_doc_xong, 'thich_tb', thich_tb)
                                             order by so_muon + so_doc_xong desc, ten)
                            from (select * from cd where so_muon + so_doc_xong > 0 order by so_muon + so_doc_xong desc, ten limit 10) x), '[]'::jsonb))
    ));
end $$;

revoke all on function public.lay_so_lieu_sang_kien(), public.luu_so_lieu(text, numeric, text, numeric, text),
  public.thong_ke(date, date, text, bigint) from public, anonymous;
grant execute on function public.lay_so_lieu_sang_kien(), public.luu_so_lieu(text, numeric, text, numeric, text),
  public.thong_ke(date, date, text, bigint) to authenticated;
