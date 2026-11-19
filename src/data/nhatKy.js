// Nhật ký, đọc xong, mốc, Nhìn lại, Lớp của tôi (Neon). Đọc: bảng nhat_ky (RLS: em, GVCN, nhân viên).
// Ghi: chỉ qua hàm máy chủ (máy chủ đặt ngày, tính chuỗi, mốc). Hàm thao tác ném lỗi → giao diện dùng loiNhatKy(loi).
import { supabase } from '../lib/supabase'

export const NHAT_KY_MOI_TRANG = 30
const COT = 'id, sach_id, ngay, doan_nho, trang, cam_xuc, em_nghi, cung_bo_me, tinh_chuoi, sach(id, ma_sach, ten, tac_gia, anh_bia)'

async function goi(ham, thamSo) {
  const { data, error } = await supabase.rpc(ham, thamSo)
  if (error) throw error
  return data
}

const thamSoGhi = ({ camXuc, doanNho, emNghi, trang, cungBoMe }) =>
  ({ p_cam_xuc: camXuc, p_doan_nho: doanNho || null, p_em_nghi: emNghi || null, p_trang: trang || null, p_cung_bo_me: !!cungBoMe })

/** Ghi 1 lần nhật ký. Trả { id, tinh_chuoi, chuoi, moc_moi }. */
export const ghiNhatKy = (sachId, nd) => goi('ghi_nhat_ky', { p_sach_id: sachId, ...thamSoGhi(nd) })
/** Sửa (trong 7 ngày). Trả { tinh_chuoi, chuoi }. */
export const suaNhatKy = (id, nd) => goi('sua_nhat_ky', { p_id: id, ...thamSoGhi(nd) })
export const xoaNhatKy = id => goi('xoa_nhat_ky', { p_id: id })
/** Em đọc xong (cần đã ghi ≥ 1 lần). Trả { moc_moi }. */
export const danhDauDocXong = (sachId, mucThich, camNhan) =>
  goi('danh_dau_doc_xong', { p_sach_id: sachId, p_muc_thich: mucThich, p_cam_nhan: camNhan || null })
export const datMucTieu = so => goi('dat_muc_tieu', { p_so: so })
/** Trang chủ HS: { chuoi, doc_xong_thang, muc_tieu, lan_ghi_cuoi, so_chu_tinh_chuoi, doc_xong: [sach_id] }. */
export const layTongQuan = () => goi('tong_quan_cua_toi')
/** 3 cuốn gợi ý đọc tiếp sau 1 cuốn. */
export const layGoiYDocTiep = sachId => goi('goi_y_doc_tiep', { p_sach_id: sachId })
/** Nhìn lại năm học (hsId null = chính mình). */
export const layNhinLai = (hsId = null) => goi('nhin_lai_nam', { p_hs: hsId })
/** Lớp của tôi: GVCN bỏ trống lopId; nhân viên chọn lớp. */
export const layLopTongQuan = (lopId = null) => goi('lop_tong_quan', { p_lop_id: lopId })

/** Danh sách nhật ký của 1 em (mới nhất trước), lọc cuốn / cảm xúc / chữ, 30 dòng / trang. */
export function layNhatKy({ hsId, sachId = null, camXuc = null, tuKhoa = '', trang = 0 }) {
  let q = supabase.from('nhat_ky').select(COT).eq('hoc_sinh_id', hsId)
  if (sachId) q = q.eq('sach_id', sachId)
  if (camXuc) q = q.eq('cam_xuc', camXuc)
  const k = tuKhoa.trim().replace(/[%,()*]/g, '')
  if (k) q = q.or(`doan_nho.ilike.%${k}%,em_nghi.ilike.%${k}%`)
  return q.order('ngay', { ascending: false }).order('id', { ascending: false })
    .range(trang * NHAT_KY_MOI_TRANG, trang * NHAT_KY_MOI_TRANG + NHAT_KY_MOI_TRANG - 1)
}

/** 1 lần ghi (để sửa). */
export function layMotNhatKy(id) {
  return supabase.from('nhat_ky').select(COT).eq('id', id).maybeSingle()
}
