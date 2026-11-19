// Bảng sach + sach_chu_de (Neon). RLS: ai đăng nhập cũng đọc (HS không thấy sách ẩn); chỉ nhân viên ghi.
// Thêm sách hàng loạt qua hàm máy chủ nhap_danh_muc (kiểm vai trò, chống trùng mã).
import { supabase } from '../lib/supabase'
import { mauTim } from '../domain/danhMuc'

export const SACH_MOI_TRANG = 30
const COT_DS = 'id, ma_sach, ten, tac_gia, khoi_tu, khoi_den, so_ban, anh_bia, an'
const COT_CT = 'id, ma_sach, ten, tac_gia, nxb, nam, khoi_tu, khoi_den, so_ban, vi_tri, gioi_thieu, anh_bia, an, so_trang, cau_hoi, sach_chu_de(chu_de_id)'

/** Tìm sách (không cần gõ dấu), lọc chủ đề / khối, 30 cuốn mỗi trang; trả { data, count }. */
export function timSach({ tuKhoa = '', chuDeId = null, khoi = null, trang = 0 } = {}) {
  const cot = chuDeId ? `${COT_DS}, sach_chu_de!inner(chu_de_id)` : COT_DS
  let q = supabase.from('sach').select(cot, { count: 'exact' })
  const m = mauTim(tuKhoa)
  if (m) q = q.ilike('tim', `%${m}%`)
  if (chuDeId) q = q.eq('sach_chu_de.chu_de_id', chuDeId)
  if (khoi) q = q.lte('khoi_tu', khoi).gte('khoi_den', khoi)
  return q.order('ten').range(trang * SACH_MOI_TRANG, trang * SACH_MOI_TRANG + SACH_MOI_TRANG - 1)
}

/** Chi tiết 1 cuốn (kèm id các chủ đề). */
export function laySach(id) {
  return supabase.from('sach').select(COT_CT).eq('id', id).maybeSingle()
}

/** Nhập danh mục qua máy chủ, mỗi lần 200 cuốn; trả { them, sua }. moiLan(daXong) báo tiến độ. */
export async function nhapDanhMuc(ds, moiLan = () => {}) {
  const tong = { them: 0, sua: 0 }
  for (let i = 0; i < ds.length; i += 200) {
    const phan = ds.slice(i, i + 200).map(({ dong: _bo, ...s }) => s)
    const { data, error } = await supabase.rpc('nhap_danh_muc', { p_ds: phan })
    if (error) throw error
    tong.them += data.them
    tong.sua += data.sua
    moiLan(Math.min(i + 200, ds.length))
  }
  return tong
}

/** Sửa thông tin 1 cuốn (chỉ các cột được phép) rồi đặt lại chủ đề; trả bản ghi mới. */
export async function suaSach(id, { ten, tac_gia, nxb, nam, khoi_tu, khoi_den, so_ban, vi_tri, gioi_thieu, an, so_trang, cau_hoi, chuDeIds }) {
  const { data, error } = await supabase.from('sach')
    .update({ ten, tac_gia, nxb, nam, khoi_tu, khoi_den, so_ban, vi_tri, gioi_thieu, an, so_trang, cau_hoi, sua_luc: new Date().toISOString() })
    .eq('id', id).select(COT_CT).single()
  if (error) throw error
  if (chuDeIds) {
    const { error: e2 } = await supabase.rpc('dat_chu_de_sach', { p_sach_id: id, p_chu_de_ids: chuDeIds })
    if (e2) throw e2
    data.sach_chu_de = chuDeIds.map(chu_de_id => ({ chu_de_id }))
  }
  return data
}

/** Xoá hẳn 1 cuốn (nên dùng "ẩn" nếu sách đã có người mượn). */
export function xoaSach(id) {
  return supabase.from('sach').delete().eq('id', id)
}
