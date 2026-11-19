// Thử thách lớp theo số ngày ghi (Neon). Bảng thu_thach_lop không cấp quyền: mọi việc qua hàm máy chủ (kiểm vai trò, đếm ngày).
// Hàm ném lỗi → giao diện dùng loiThuThach(loi).
import { supabase } from '../lib/supabase'

async function goi(ham, thamSo) {
  const { data, error } = await supabase.rpc(ham, thamSo)
  if (error) throw error
  return data
}

/** HS: thử thách của lớp em (đang chạy / sắp tới / vừa xong ≤ 7 ngày) hoặc null.
 *  { id, ten, tu, den, so_ngay, si_so, so_dat, cua_em } — không có tên bạn nào. */
export const layThuThachCuaToi = () => goi('thu_thach_cua_toi')
/** GVCN (lopId bỏ trống) / nhân viên: { hien_tai: { …, hs: [{ id, so_ngay }] } | null, truoc: [≤ 5] }. */
export const layThuThachLop = (lopId = null) => goi('thu_thach_lop', { p_lop_id: lopId })
/** Tạo thử thách (GVCN: lớp mình; nhân viên: lopId). Trả id. */
export const taoThuThach = (lopId, { ten, tu, den, soNgay }) =>
  goi('tao_thu_thach', { p_lop_id: lopId, p_ten: ten.trim(), p_tu: tu, p_den: den, p_so_ngay: Number(soNgay) })
/** Kết thúc sớm (chưa bắt đầu → xoá). */
export const ketThucThuThach = id => goi('ket_thuc_thu_thach', { p_id: id })
