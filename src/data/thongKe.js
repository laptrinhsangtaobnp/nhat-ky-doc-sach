// Thống kê sáng kiến (Neon) — chỉ nhân viên; máy chủ tính mọi con số. Bảng so_lieu_sang_kien chỉ qua hàm.
// Hàm ném lỗi → giao diện dùng loiThongKe(loi).
import { supabase } from '../lib/supabase'

async function goi(ham, thamSo) {
  const { data, error } = await supabase.rpc(ham, thamSo)
  if (error) throw error
  return data
}

/** { tu, den, so_ngay, si_so, muon: {...}, nam_im: {...}, app: {...} } — không tên học sinh. */
export const layThongKe = ({ tu, den, phamVi = 'thi_diem', lopId = null }) =>
  goi('thong_ke', { p_tu: tu, p_den: den, p_pham_vi: phamVi, p_lop_id: phamVi === 'lop' ? lopId : null })
/** Số "Trước" / "Sau" (nhập tay) đã lưu: [{ chi_so, truoc, nguon_truoc, sau, nguon_sau, sua_luc }]. */
export const laySoLieuSangKien = () => goi('lay_so_lieu_sang_kien')
/** Lưu 1 chỉ số (null = xoá số). sau chỉ nhận ở chỉ số nhập tay. */
export const luuSoLieu = (chiSo, { truoc, nguonTruoc, sau, nguonSau }) =>
  goi('luu_so_lieu', { p_chi_so: chiSo, p_truoc: truoc, p_nguon_truoc: nguonTruoc || null, p_sau: sau, p_nguon_sau: nguonSau || null })
