-- CHẠY TRÊN NEON (node scripts/chay-sql.mjs sql/2026-11-18_muon_tra.sql hoặc Neon → SQL Editor). Chạy lại được.
-- Giai đoạn 2: mượn – trả. Thầy chốt 18/11/2026:
--   HS đặt trước trong app → thủ thư soạn sẵn → em lên thư viện lúc nào cũng được, cô bấm "cho mượn" → ghi trả / báo mất.
--   Thủ thư cũng cho mượn trực tiếp (không cần đặt trước).
--   Mỗi em giữ tối đa cai_dat.so_sach_toi_da cuốn (đặt trước + đã soạn + đang mượn), mặc định 2.
--   Mượn cai_dat.so_ngay_muon ngày (mặc định 7). Sách đã soạn giữ cai_dat.so_ngay_giu ngày (mặc định 3).
--   Hết bản → vẫn đặt được, xếp hàng chờ theo thứ tự đặt. Em tự huỷ được khi cô CHƯA soạn.
-- Không ai ghi thẳng bảng luot_muon: mọi thay đổi trạng thái qua hàm bên dưới (kiểm vai trò, khoá dòng chống bấm trùng).
-- "Quá hạn" tính ra từ han_tra / han_giu so với ngày hôm nay (giờ Việt Nam), không lưu.
-- Sau khi chạy: Neon → Data API → Refresh schema cache.

alter table public.cai_dat add column if not exists so_ngay_giu smallint not null default 3 check (so_ngay_giu between 1 and 14);

-- ───────────── Bảng ─────────────
create table if not exists public.luot_muon (
  id           bigint generated always as identity primary key,
  sach_id      bigint not null references public.sach(id) on delete restrict,     -- sách có lịch sử mượn: chỉ ẩn, không xoá
  hoc_sinh_id  uuid not null references public.ho_so(id) on delete cascade,
  trang_thai   text not null check (trang_thai in ('dat_truoc', 'da_soan', 'dang_muon', 'da_tra', 'mat', 'huy')),
  nguon        text not null default 'tim_sach' check (nguon in ('tim_sach', 'goi_y', 'truc_tiep')),  -- đo "mượn từ gợi ý"
  ngay_dat     timestamptz,                    -- null nếu cho mượn trực tiếp
  ngay_soan    timestamptz,
  han_giu      date,                           -- hết ngày này mà em chưa đến nhận → thủ thư cất lại
  ngay_muon    timestamptz,
  han_tra      date,
  ngay_xong    timestamptz,                    -- lúc trả / báo mất / huỷ
  ly_do_huy    text check (ly_do_huy in ('hoc_sinh_huy', 'thu_thu_huy')),
  nguoi_xu_ly  uuid references public.ho_so(id) on delete set null,
  tao_luc      timestamptz not null default now()
);
-- 1 em không giữ 2 lượt đang dùng của cùng 1 cuốn (máy chủ chặn cả khi bấm 2 lần cùng lúc)
create unique index if not exists luot_muon_mot_cuon on public.luot_muon (hoc_sinh_id, sach_id)
  where trang_thai in ('dat_truoc', 'da_soan', 'dang_muon');
create index if not exists luot_muon_hs_idx on public.luot_muon (hoc_sinh_id, tao_luc desc);
create index if not exists luot_muon_sach_idx on public.luot_muon (sach_id, trang_thai)
  where trang_thai in ('dat_truoc', 'da_soan', 'dang_muon');
create index if not exists luot_muon_tt_idx on public.luot_muon (trang_thai, tao_luc)
  where trang_thai in ('dat_truoc', 'da_soan', 'dang_muon');
create index if not exists luot_muon_xong_idx on public.luot_muon (ngay_xong desc) where ngay_xong is not null;

-- ───────────── Hàm nội bộ (không cấp cho trình duyệt) ─────────────
create or replace function public.hom_nay() returns date
language sql stable set search_path = public as $$
  select (now() at time zone 'Asia/Ho_Chi_Minh')::date
$$;

-- Số bản còn trên kệ = số bản − (đã soạn + đang mượn). Đặt trước chưa soạn không chiếm bản.
create or replace function public.ban_ranh(p_sach_id bigint) returns int
language sql stable security definer set search_path = public as $$
  select greatest(s.so_ban - (select count(*) from public.luot_muon l
    where l.sach_id = s.id and l.trang_thai in ('da_soan', 'dang_muon')), 0)::int
  from public.sach s where s.id = p_sach_id
$$;

-- Thứ tự trong hàng chờ của 1 lượt đặt trước (1 = đầu hàng)
create or replace function public.thu_tu_cho(p_id bigint) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.luot_muon l2, public.luot_muon l
  where l.id = p_id and l.trang_thai = 'dat_truoc' and l2.sach_id = l.sach_id and l2.trang_thai = 'dat_truoc'
    and (l2.ngay_dat, l2.id) <= (l.ngay_dat, l.id)
$$;

-- Kiểm em còn được giữ thêm sách không (gọi sau khi đã khoá dòng hồ sơ của em)
create or replace function public.kiem_con_cho(p_hs uuid, p_sach_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.luot_muon where hoc_sinh_id = p_hs and sach_id = p_sach_id
             and trang_thai in ('dat_truoc', 'da_soan', 'dang_muon')) then
    raise exception 'da_dat';
  end if;
  if (select count(*) from public.luot_muon where hoc_sinh_id = p_hs and trang_thai in ('dat_truoc', 'da_soan', 'dang_muon'))
     >= (select so_sach_toi_da from public.cai_dat where id = 1) then
    raise exception 'qua_toi_da';
  end if;
end $$;

-- ───────────── RLS: em xem lượt của mình; nhân viên xem tất cả. Không ai ghi thẳng. ─────────────
alter table public.luot_muon enable row level security;
drop policy if exists luot_muon_xem on public.luot_muon;
create policy luot_muon_xem on public.luot_muon for select to authenticated using (
  (select public.la_nhan_vien())
  or (hoc_sinh_id = (select auth.uid()) and (select public.vai_tro_cua_toi()) is not null)
);

-- ───────────── Học sinh ─────────────
-- Đặt trước 1 cuốn. p_nguon: 'tim_sach' | 'goi_y'. Trả { id }.
create or replace function public.dat_truoc(p_sach_id bigint, p_nguon text default 'tim_sach')
returns jsonb language plpgsql security definer set search_path = public as $$
declare toi uuid := auth.uid(); v_id bigint; v_so_ban int; v_an boolean;
begin
  if public.vai_tro_cua_toi() is distinct from 'hoc_sinh' then raise exception 'forbidden'; end if;
  perform 1 from public.ho_so where id = toi for update;          -- 2 lần bấm cùng lúc → chạy lần lượt
  select so_ban, an into v_so_ban, v_an from public.sach where id = p_sach_id;
  if not found or v_an then raise exception 'khong_co_sach'; end if;
  if v_so_ban = 0 then raise exception 'het_sach'; end if;      -- thư viện không còn bản nào (mất hết)
  perform public.kiem_con_cho(toi, p_sach_id);
  insert into public.luot_muon (sach_id, hoc_sinh_id, trang_thai, nguon, ngay_dat)
  values (p_sach_id, toi, 'dat_truoc', case when p_nguon = 'goi_y' then 'goi_y' else 'tim_sach' end, now())
  returning id into v_id;
  return jsonb_build_object('id', v_id);
end $$;

-- Huỷ: em huỷ lượt của mình khi cô CHƯA soạn; nhân viên huỷ đặt trước / cất lại sách đã soạn.
create or replace function public.huy_dat_truoc(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare r public.luot_muon;
begin
  select * into r from public.luot_muon where id = p_id for update;
  if not found then raise exception 'khong_co'; end if;
  if public.la_nhan_vien() then
    if r.trang_thai not in ('dat_truoc', 'da_soan') then raise exception 'sai_trang_thai'; end if;
    update public.luot_muon set trang_thai = 'huy', ngay_xong = now(), ly_do_huy = 'thu_thu_huy', nguoi_xu_ly = auth.uid()
    where id = p_id;
  elsif r.hoc_sinh_id = auth.uid() and public.vai_tro_cua_toi() = 'hoc_sinh' then
    if r.trang_thai = 'da_soan' then raise exception 'da_soan_roi'; end if;
    if r.trang_thai <> 'dat_truoc' then raise exception 'sai_trang_thai'; end if;
    update public.luot_muon set trang_thai = 'huy', ngay_xong = now(), ly_do_huy = 'hoc_sinh_huy' where id = p_id;
  else
    raise exception 'forbidden';
  end if;
end $$;

-- Các lượt của em: đang dùng trước, rồi 40 lượt gần nhất đã xong (kèm sách, thứ tự hàng chờ, số bản trên kệ).
create or replace function public.muon_cua_toi()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(j order by dang desc, moc desc), '[]'::jsonb) from (
    select l.trang_thai in ('dat_truoc', 'da_soan', 'dang_muon') as dang, coalesce(l.ngay_xong, l.tao_luc) as moc,
      jsonb_build_object('id', l.id, 'trang_thai', l.trang_thai, 'ngay_dat', l.ngay_dat, 'han_giu', l.han_giu,
        'ngay_muon', l.ngay_muon, 'han_tra', l.han_tra, 'ngay_xong', l.ngay_xong, 'ly_do_huy', l.ly_do_huy,
        'thu_tu_cho', case when l.trang_thai = 'dat_truoc' then public.thu_tu_cho(l.id) end,
        'con_ban', case when l.trang_thai = 'dat_truoc' then public.ban_ranh(l.sach_id) end,
        'sach', jsonb_build_object('id', s.id, 'ma_sach', s.ma_sach, 'ten', s.ten, 'tac_gia', s.tac_gia, 'anh_bia', s.anh_bia, 'vi_tri', s.vi_tri)) as j
    from public.luot_muon l join public.sach s on s.id = l.sach_id
    where l.hoc_sinh_id = auth.uid() and public.vai_tro_cua_toi() is not null
    order by 1 desc, 2 desc
    limit 50
  ) x
$$;

-- Tình trạng 1 cuốn cho trang chi tiết: số bản, còn trên kệ, hàng chờ, lượt của em (nếu có), em đang giữ mấy / tối đa.
create or replace function public.tinh_trang_sach(p_sach_id bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_so_ban int; v_an boolean; v_cua_em jsonb;
begin
  if public.vai_tro_cua_toi() is null then raise exception 'forbidden'; end if;
  select so_ban, an into v_so_ban, v_an from public.sach where id = p_sach_id;
  if not found or (v_an and not public.la_nhan_vien()) then return null; end if;
  select jsonb_build_object('id', id, 'trang_thai', trang_thai, 'han_giu', han_giu, 'han_tra', han_tra,
      'thu_tu_cho', case when trang_thai = 'dat_truoc' then public.thu_tu_cho(id) end)
    into v_cua_em from public.luot_muon
  where sach_id = p_sach_id and hoc_sinh_id = auth.uid() and trang_thai in ('dat_truoc', 'da_soan', 'dang_muon');
  return jsonb_build_object(
    'so_ban', v_so_ban,
    'con_ban', public.ban_ranh(p_sach_id),
    'hang_cho', (select count(*) from public.luot_muon where sach_id = p_sach_id and trang_thai = 'dat_truoc'),
    'em_dang_giu', (select count(*) from public.luot_muon where hoc_sinh_id = auth.uid()
                    and trang_thai in ('dat_truoc', 'da_soan', 'dang_muon')),
    'toi_da', (select so_sach_toi_da from public.cai_dat where id = 1),
    'cua_em', v_cua_em);
end $$;

-- ───────────── Thủ thư / quản trị ─────────────
-- Đã soạn sách cho 1 lượt đặt trước (cần còn bản trên kệ). Giữ đến hết ngày hom_nay + so_ngay_giu.
create or replace function public.soan_sach(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare r public.luot_muon;
begin
  if not public.la_nhan_vien() then raise exception 'forbidden'; end if;
  select * into r from public.luot_muon where id = p_id for update;
  if not found then raise exception 'khong_co'; end if;
  if r.trang_thai <> 'dat_truoc' then raise exception 'sai_trang_thai'; end if;
  perform 1 from public.sach where id = r.sach_id for update;      -- 2 người soạn cùng lúc bản cuối → 1 người lỗi
  if public.ban_ranh(r.sach_id) <= 0 then raise exception 'het_ban'; end if;
  update public.luot_muon set trang_thai = 'da_soan', ngay_soan = now(), nguoi_xu_ly = auth.uid(),
    han_giu = public.hom_nay() + (select so_ngay_giu from public.cai_dat where id = 1)
  where id = p_id;
end $$;

-- Cho mượn 1 lượt đã soạn (hoặc đặt trước chưa soạn mà em đến luôn — cần còn bản). Hạn trả = hom_nay + so_ngay_muon.
create or replace function public.cho_muon(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare r public.luot_muon;
begin
  if not public.la_nhan_vien() then raise exception 'forbidden'; end if;
  select * into r from public.luot_muon where id = p_id for update;
  if not found then raise exception 'khong_co'; end if;
  if r.trang_thai not in ('dat_truoc', 'da_soan') then raise exception 'sai_trang_thai'; end if;
  if r.trang_thai = 'dat_truoc' then
    perform 1 from public.sach where id = r.sach_id for update;
    if public.ban_ranh(r.sach_id) <= 0 then raise exception 'het_ban'; end if;
  end if;
  update public.luot_muon set trang_thai = 'dang_muon', ngay_muon = now(), nguoi_xu_ly = auth.uid(),
    han_tra = public.hom_nay() + (select so_ngay_muon from public.cai_dat where id = 1)
  where id = p_id;
end $$;

-- Cho mượn trực tiếp (em đến thư viện chọn sách tại chỗ). Vẫn kiểm tối đa, không trùng, còn bản. Trả { id }.
create or replace function public.cho_muon_truc_tiep(p_hoc_sinh_id uuid, p_sach_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if not public.la_nhan_vien() then raise exception 'forbidden'; end if;
  perform 1 from public.ho_so where id = p_hoc_sinh_id and vai_tro = 'hoc_sinh' and hoat_dong for update;
  if not found then raise exception 'khong_phai_hoc_sinh'; end if;
  perform 1 from public.sach where id = p_sach_id for update;
  if not found then raise exception 'khong_co_sach'; end if;
  perform public.kiem_con_cho(p_hoc_sinh_id, p_sach_id);
  if public.ban_ranh(p_sach_id) <= 0 then raise exception 'het_ban'; end if;
  insert into public.luot_muon (sach_id, hoc_sinh_id, trang_thai, nguon, ngay_muon, han_tra, nguoi_xu_ly)
  values (p_sach_id, p_hoc_sinh_id, 'dang_muon', 'truc_tiep', now(),
    public.hom_nay() + (select so_ngay_muon from public.cai_dat where id = 1), auth.uid())
  returning id into v_id;
  return jsonb_build_object('id', v_id);
end $$;

-- Ghi trả
create or replace function public.ghi_tra(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.la_nhan_vien() then raise exception 'forbidden'; end if;
  update public.luot_muon set trang_thai = 'da_tra', ngay_xong = now(), nguoi_xu_ly = auth.uid()
  where id = p_id and trang_thai = 'dang_muon';
  if not found then raise exception 'sai_trang_thai'; end if;
end $$;

-- Báo mất: lượt → 'mat', số bản của sách giảm 1.
create or replace function public.bao_mat(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare v_sach bigint;
begin
  if not public.la_nhan_vien() then raise exception 'forbidden'; end if;
  update public.luot_muon set trang_thai = 'mat', ngay_xong = now(), nguoi_xu_ly = auth.uid()
  where id = p_id and trang_thai = 'dang_muon' returning sach_id into v_sach;
  if not found then raise exception 'sai_trang_thai'; end if;
  update public.sach set so_ban = greatest(so_ban - 1, 0), sua_luc = now() where id = v_sach;
end $$;

-- Danh sách cho trang Mượn – trả. p_loai: can_soan | da_soan | dang_muon | lich_su. Tìm theo tên sách / mã / tên HS / lớp.
-- 50 dòng / trang. can_soan: theo thứ tự đặt; da_soan: hạn giữ gần nhất trước; dang_muon: hạn trả gần nhất (quá hạn) trước.
create or replace function public.ds_muon(p_loai text, p_tu_khoa text default '', p_trang int default 0)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_tt text[]; k text := trim(replace(replace(coalesce(p_tu_khoa, ''), '%', ''), '_', '')); kq jsonb;
begin
  if not public.la_nhan_vien() then raise exception 'forbidden'; end if;
  v_tt := case p_loai when 'can_soan' then array['dat_truoc'] when 'da_soan' then array['da_soan']
    when 'dang_muon' then array['dang_muon'] when 'lich_su' then array['da_tra', 'mat', 'huy'] end;
  if v_tt is null then raise exception 'sai_loai'; end if;
  with ds as (
    select l.*, s.ma_sach, s.ten as ten_sach, s.vi_tri, h.ho_ten, lo.ten as lop,
      case p_loai when 'can_soan' then extract(epoch from l.ngay_dat)
        when 'da_soan' then extract(epoch from l.han_giu::timestamp)
        when 'dang_muon' then extract(epoch from l.han_tra::timestamp)
        else -extract(epoch from l.ngay_xong) end as khoa
    from public.luot_muon l
    join public.sach s on s.id = l.sach_id
    join public.ho_so h on h.id = l.hoc_sinh_id
    left join public.lop lo on lo.id = h.lop_id
    where l.trang_thai = any (v_tt)
      and (k = '' or s.tim like '%' || public.bo_dau(k) || '%' or public.bo_dau(h.ho_ten) like '%' || public.bo_dau(k) || '%'
           or lower(lo.ten) = lower(k))
    order by khoa, l.id
    limit 50 offset greatest(coalesce(p_trang, 0), 0) * 50
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'trang_thai', trang_thai, 'nguon', nguon, 'ngay_dat', ngay_dat, 'ngay_soan', ngay_soan,
      'han_giu', han_giu, 'ngay_muon', ngay_muon, 'han_tra', han_tra, 'ngay_xong', ngay_xong, 'ly_do_huy', ly_do_huy,
      'sach', jsonb_build_object('id', sach_id, 'ma_sach', ma_sach, 'ten', ten_sach, 'vi_tri', vi_tri),
      'hoc_sinh', jsonb_build_object('id', hoc_sinh_id, 'ho_ten', ho_ten, 'lop', lop),
      'thu_tu_cho', case when trang_thai = 'dat_truoc' then public.thu_tu_cho(id) end,
      'con_ban', case when trang_thai = 'dat_truoc' then public.ban_ranh(sach_id) end
    ) order by khoa, id), '[]'::jsonb) into kq
  from ds;
  return kq;
end $$;

-- Số đếm cho các thẻ trên trang Mượn – trả (1 lần gọi, chỉ quét lượt đang dùng — có chỉ mục riêng).
create or replace function public.dem_muon()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare d date := public.hom_nay(); kq jsonb;
begin
  if not public.la_nhan_vien() then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'can_soan', count(*) filter (where trang_thai = 'dat_truoc'),
    'da_soan', count(*) filter (where trang_thai = 'da_soan'),
    'qua_han_giu', count(*) filter (where trang_thai = 'da_soan' and han_giu < d),
    'dang_muon', count(*) filter (where trang_thai = 'dang_muon'),
    'qua_han', count(*) filter (where trang_thai = 'dang_muon' and han_tra < d)) into kq
  from public.luot_muon where trang_thai in ('dat_truoc', 'da_soan', 'dang_muon');
  return kq;
end $$;

-- ───────────── Quyền ─────────────
revoke all on public.luot_muon from anonymous;
grant select on public.luot_muon to authenticated;          -- ghi chỉ qua hàm; RLS lọc dòng
grant usage, select on all sequences in schema public to authenticated;

revoke all on function public.hom_nay(), public.ban_ranh(bigint), public.thu_tu_cho(bigint),
  public.kiem_con_cho(uuid, bigint) from public, anonymous, authenticated;
revoke all on function public.dat_truoc(bigint, text), public.huy_dat_truoc(bigint), public.muon_cua_toi(),
  public.tinh_trang_sach(bigint), public.soan_sach(bigint), public.cho_muon(bigint),
  public.cho_muon_truc_tiep(uuid, bigint), public.ghi_tra(bigint), public.bao_mat(bigint),
  public.ds_muon(text, text, int), public.dem_muon() from public, anonymous;
grant execute on function public.dat_truoc(bigint, text), public.huy_dat_truoc(bigint), public.muon_cua_toi(),
  public.tinh_trang_sach(bigint), public.soan_sach(bigint), public.cho_muon(bigint),
  public.cho_muon_truc_tiep(uuid, bigint), public.ghi_tra(bigint), public.bao_mat(bigint),
  public.ds_muon(text, text, int), public.dem_muon() to authenticated;
