// Bảng chu_de (Neon): 8–12 chủ đề sách. Ai đăng nhập cũng đọc; nhân viên thêm / sửa / xoá (RLS kiểm).
import { supabase } from '../lib/supabase'

const COT = 'id, ten, thu_tu'

/** Tất cả chủ đề (ít dòng), theo thứ tự hiển thị. */
export function layChuDe() {
  return supabase.from('chu_de').select(COT).order('thu_tu').order('ten').limit(50)
}

export function themChuDe(ten, thu_tu = 0) {
  return supabase.from('chu_de').insert({ ten: ten.trim(), thu_tu }).select(COT).single()
}

export function suaChuDe(id, { ten, thu_tu }) {
  return supabase.from('chu_de').update({ ten: ten.trim(), thu_tu }).eq('id', id).select(COT).single()
}

/** Xoá chủ đề (sách thuộc chủ đề này chỉ mất nhãn, không mất sách). */
export function xoaChuDe(id) {
  return supabase.from('chu_de').delete().eq('id', id)
}
