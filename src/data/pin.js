// Mã lớp + PIN học sinh (Neon, chỉ qua hàm — nhân viên mọi lớp, GVCN lớp mình; máy chủ kiểm). PIN rõ chỉ trả lúc tạo.
import { supabase } from '../lib/supabase'

async function goi(ham, thamSo) {
  const { data, error } = await supabase.rpc(ham, thamSo)
  if (error) throw error
  return data
}

export const layMaLop = lopId => goi('lay_ma_lop', { p_lop_id: lopId })
/** Đổi mã lớp (mã cũ hết dùng được; em đã nhớ trên máy phải nhập mã mới). */
export const doiMaLop = lopId => goi('doi_ma_lop', { p_lop_id: lopId })
/** [{ id, ho_ten, co_pin, bi_khoa }] */
export const layTinhTrangPin = lopId => goi('tinh_trang_pin_lop', { p_lop_id: lopId })
/** Tạo PIN cho mọi em chưa có (hsId null) hoặc đặt lại PIN 1 em → [{ id, ho_ten, pin }]. */
export const taoPin = (lopId, hsId = null) => goi('tao_pin', { p_lop_id: lopId, p_hs: hsId })
