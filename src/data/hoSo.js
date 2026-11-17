// Bảng ho_so (Neon). Ghi chỉ qua hàm máy chủ sua_ho_so — không ai ghi thẳng bảng.
import { supabase } from '../lib/supabase'

const COT = 'id, ho_ten, ten_dang_nhap, vai_tro, lop_id, hoat_dong'
const MOI_TRANG = 50

/** Hồ sơ của 1 người (dùng khi đăng nhập). */
export function layHoSo(id) {
  return supabase.from('ho_so').select(COT).eq('id', id).maybeSingle()
}

/** Danh sách người dùng có lọc, phân trang 50 dòng; trả { data, count }. */
export function layNguoiDung({ lopId = null, vaiTro = null, tuKhoa = '', trang = 0 } = {}) {
  let q = supabase.from('ho_so').select(COT, { count: 'exact' })
  if (lopId) q = q.eq('lop_id', lopId)
  if (vaiTro) q = q.eq('vai_tro', vaiTro)
  const k = tuKhoa.trim().replace(/[%,()*]/g, '')
  if (k) q = q.or(`ho_ten.ilike.%${k}%,ten_dang_nhap.ilike.%${k}%`)
  return q.order('vai_tro').order('ho_ten').range(trang * MOI_TRANG, trang * MOI_TRANG + MOI_TRANG - 1)
}
layNguoiDung.MOI_TRANG = MOI_TRANG

/** Các tên đăng nhập đã có trong danh sách cho trước (để tránh trùng khi nhập Excel). */
export async function layTenDangNhapDaCo(ds) {
  const ketQua = new Set()
  for (let i = 0; i < ds.length; i += 200) {
    const { data, error } = await supabase.from('ho_so').select('ten_dang_nhap').in('ten_dang_nhap', ds.slice(i, i + 200))
    if (error) throw error
    data.forEach(r => ketQua.add(r.ten_dang_nhap))
  }
  return ketQua
}

/** Sửa họ tên / lớp / khoá-mở (máy chủ kiểm quyền). */
export function suaHoSo({ id, ho_ten, lop_id, hoat_dong }) {
  return supabase.rpc('sua_ho_so', { p_id: id, p_ho_ten: ho_ten, p_lop_id: lop_id ?? null, p_hoat_dong: hoat_dong })
}
