// Đăng nhập / đăng xuất (Supabase Auth). Tầng xác thực — tách riêng để trang không gọi thẳng supabase.
import { supabase } from '../lib/supabase'
import { emailDangNhap } from '../domain/taiKhoan'

/** Đăng nhập bằng tên đăng nhập (hoặc email) + mật khẩu. */
export async function dangNhap(tenDangNhap, matKhau) {
  const { error } = await supabase.auth.signInWithPassword({ email: emailDangNhap(tenDangNhap), password: matKhau })
  if (error) throw error
}

async function goiPin(body) {
  const { data, error } = await supabase.functions.invoke('dang-nhap-pin', { body })
  if (error) throw error
  return data
}

/** Mã lớp → { lop, hoc_sinh: [{ id, ten }] } hoặc { loi: 'ma_sai' }. */
export const layTenTheoMaLop = ma => goiPin({ ma })

/** Đăng nhập học sinh bằng mã lớp + PIN. Trả null nếu vào được, ngược lại { loi, con?, den? } từ máy chủ. */
export async function dangNhapPin(ma, hsId, pin) {
  const kq = await goiPin({ ma, hs: hsId, pin })
  if (!kq?.access_token) return kq ?? { loi: 'khac' }
  const { error } = await supabase.auth.setSession({ access_token: kq.access_token, refresh_token: kq.refresh_token })
  if (error) throw error
  return null
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
