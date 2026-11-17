// Đăng nhập / đăng xuất (Supabase Auth). Tầng xác thực — tách riêng để trang không gọi thẳng supabase.
import { supabase } from '../lib/supabase'
import { emailDangNhap } from '../domain/taiKhoan'

/** Đăng nhập bằng tên đăng nhập (hoặc email) + mật khẩu. */
export async function dangNhap(tenDangNhap, matKhau) {
  const { error } = await supabase.auth.signInWithPassword({ email: emailDangNhap(tenDangNhap), password: matKhau })
  if (error) throw error
}

/** Đăng xuất. */
export const dangXuat = () => supabase.auth.signOut()

/** Phiên hiện tại (có thể null). */
export async function layPhien() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/** Theo dõi thay đổi đăng nhập; trả hàm huỷ theo dõi. */
export function theoDoiDangNhap(goiLai) {
  const { data } = supabase.auth.onAuthStateChange((suKien, phien) => goiLai(suKien, phien))
  return () => data.subscription.unsubscribe()
}

/** Người dùng tự đổi mật khẩu của mình. */
export async function doiMatKhauCuaToi(matKhauMoi) {
  const { error } = await supabase.auth.updateUser({ password: matKhauMoi })
  if (error) throw error
}
