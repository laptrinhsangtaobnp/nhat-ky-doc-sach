// Review của bạn bè (Neon). Bảng review không cấp quyền cho ai — mọi đọc / ghi qua hàm máy chủ (kiểm vai trò, đã đọc xong,
// ẩn tên, chỉ bài đã duyệt mới hiện). Lỗi → giao diện dùng loiReview(loi).
import { supabase } from '../lib/supabase'

async function goi(ham, thamSo) {
  const { data, error } = await supabase.rpc(ham, thamSo)
  if (error) throw error
  return data
}

/** Học sinh viết / sửa bài giới thiệu 1 cuốn (đã đọc xong) → chờ duyệt lại. */
export const vietReview = (sachId, noiDung, anTen) =>
  goi('viet_review', { p_sach_id: sachId, p_noi_dung: noiDung, p_an_ten: !!anTen })
export const xoaReview = sachId => goi('xoa_review', { p_sach_id: sachId })
/**
 * Trang 1 cuốn: { da_doc, cung_lop, lop, review: [{ id, ten|null, lop, noi_dung, ngay, la_cua_em }],
 *   em_doc_xong, cua_em: { noi_dung, an_ten, trang_thai, ly_do } | null }.
 */
export const layReviewSach = sachId => goi('review_cua_sach', { p_sach_id: sachId })
/** Nhân viên: { so, ds: [{ id, sua_luc, noi_dung, an_ten, ho_ten, ten_hien, lop, sach_id, ten_sach }] }. */
export const layReviewChoDuyet = () => goi('review_cho_duyet')
/** Nhân viên duyệt (cần suaLuc của bản đang xem). */
export const duyetReview = (id, suaLuc) => goi('duyet_review', { p_id: id, p_duyet: true, p_sua_luc: suaLuc })
/** Nhân viên không duyệt / gỡ bài đã duyệt, kèm lý do (khoá của LY_DO_KHONG_DUYET). */
export const khongDuyetReview = (id, lyDo) => goi('duyet_review', { p_id: id, p_duyet: false, p_ly_do: lyDo })
