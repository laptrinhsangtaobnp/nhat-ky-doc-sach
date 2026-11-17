// Bảng lop (Neon). Nhân viên thêm / sửa / xoá (RLS kiểm).
import { supabase } from '../lib/supabase'

const COT = 'id, ten, khoi, nam_hoc, thi_diem'

/** Các lớp của một năm học (ít dòng, không cần phân trang). */
export function layCacLop(namHoc) {
  return supabase.from('lop').select(COT).eq('nam_hoc', namHoc).order('khoi').order('ten').limit(200)
}

/** Tạo các lớp còn thiếu theo tên (["4A","4B"]), trả về toàn bộ lớp của năm học. */
export async function damBaoCoLop(tenLop, namHoc) {
  const { data: co, error } = await layCacLop(namHoc)
  if (error) throw error
  const thieu = [...new Set(tenLop)].filter(t => !co.some(l => l.ten === t))
  if (thieu.length === 0) return co
  const { data: moi, error: e2 } = await supabase.from('lop')
    .insert(thieu.map(t => ({ ten: t, khoi: Number(t[0]), nam_hoc: namHoc }))).select(COT)
  if (e2) throw e2
  return [...co, ...moi]
}

/** Thêm 1 lớp. */
export function taoLop({ ten, nam_hoc, thi_diem = false }) {
  return supabase.from('lop').insert({ ten, khoi: Number(ten[0]), nam_hoc, thi_diem }).select(COT).single()
}

/** Bật / tắt "lớp thí điểm". */
export function datThiDiem(id, thi_diem) {
  return supabase.from('lop').update({ thi_diem }).eq('id', id).select(COT).single()
}

/** Xoá lớp (học sinh trong lớp chuyển thành "chưa có lớp"). */
export function xoaLop(id) {
  return supabase.from('lop').delete().eq('id', id)
}
