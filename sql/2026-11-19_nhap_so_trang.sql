-- CHẠY TRÊN NEON (node scripts/chay-sql.mjs sql/2026-11-19_nhap_so_trang.sql). Chạy lại được.
-- Chạy SAU 2026-11-18_danh_muc_sach.sql và 2026-11-19_cay_doc_sach.sql (cột sach.so_trang, sach.cau_hoi).
-- Nhập danh mục Excel nhận thêm "Số trang" và "Câu hỏi" (trò chuyện theo sách). Giống bản cũ: trùng mã → cập nhật,
-- ô trống giữ giá trị cũ. Thay hàm nhap_danh_muc của tệp 18/11 → chạy lại tệp 18/11 thì chạy lại tệp này.
-- Không đổi tham số → không cần Refresh schema cache.

create or replace function public.nhap_danh_muc(p_ds jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb; v_id bigint; v_moi boolean; v_them int := 0; v_sua int := 0; cd text; cd_id bigint;
begin
  if not public.la_nhan_vien() then raise exception 'forbidden'; end if;
  if jsonb_typeof(p_ds) <> 'array' or jsonb_array_length(p_ds) > 500 then raise exception 'qua_nhieu_dong'; end if;
  for r in select * from jsonb_array_elements(p_ds) loop
    insert into public.sach as s (ma_sach, ten, tac_gia, nxb, nam, khoi_tu, khoi_den, so_ban, vi_tri, gioi_thieu, so_trang, cau_hoi)
    values (upper(trim(r->>'ma_sach')), trim(r->>'ten'), nullif(trim(r->>'tac_gia'), ''), nullif(trim(r->>'nxb'), ''),
      (r->>'nam')::smallint, coalesce((r->>'khoi_tu')::smallint, 1), coalesce((r->>'khoi_den')::smallint, 5),
      coalesce((r->>'so_ban')::smallint, 1), nullif(trim(r->>'vi_tri'), ''), nullif(trim(r->>'gioi_thieu'), ''),
      (r->>'so_trang')::smallint, nullif(trim(r->>'cau_hoi'), ''))
    on conflict (ma_sach) do update set
      ten = excluded.ten, tac_gia = coalesce(excluded.tac_gia, s.tac_gia), nxb = coalesce(excluded.nxb, s.nxb),
      nam = coalesce(excluded.nam, s.nam), khoi_tu = excluded.khoi_tu, khoi_den = excluded.khoi_den,
      so_ban = excluded.so_ban, vi_tri = coalesce(excluded.vi_tri, s.vi_tri),
      gioi_thieu = coalesce(excluded.gioi_thieu, s.gioi_thieu),
      so_trang = coalesce(excluded.so_trang, s.so_trang), cau_hoi = coalesce(excluded.cau_hoi, s.cau_hoi), sua_luc = now()
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

revoke all on function public.nhap_danh_muc(jsonb) from public, anonymous;
grant execute on function public.nhap_danh_muc(jsonb) to authenticated;
