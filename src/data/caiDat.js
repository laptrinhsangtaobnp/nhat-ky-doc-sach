// Bảng cai_dat (1 dòng, Neon): quy tắc mượn. Ai đăng nhập cũng đọc; chỉ nhân viên sửa (RLS kiểm, máy chủ giới hạn khoảng giá trị).
import { supabase } from '../lib/supabase'

const COT = 'so_sach_toi_da, so_ngay_muon, so_ngay_giu'

export function layCaiDat() {
  return supabase.from('cai_dat').select(COT).eq('id', 1).single()
}

export function suaCaiDat({ so_sach_toi_da, so_ngay_muon, so_ngay_giu }) {
  return supabase.from('cai_dat')
    .update({ so_sach_toi_da, so_ngay_muon, so_ngay_giu, sua_luc: new Date().toISOString() })
    .eq('id', 1).select(COT).single()
}
