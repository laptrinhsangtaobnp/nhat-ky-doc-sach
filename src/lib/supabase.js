// Kết nối: đăng nhập ở Supabase, dữ liệu ở Neon (Neon Data API nhận thẻ đăng nhập của Supabase).
// CHỈ src/data/ được dùng from() / rpc() / functions — trang và thành phần gọi hàm có tên trong src/data/.
import { createClient } from '@supabase/supabase-js'
import { fetchGoiLai } from './goiLai'

const url = import.meta.env.VITE_SUPABASE_URL
const khoa = import.meta.env.VITE_SUPABASE_ANON_KEY
const neonUrl = import.meta.env.VITE_NEON_DATA_URL

export const THIEU_CAU_HINH = !url || !khoa || !neonUrl

const sb = createClient(url || 'http://chua-cau-hinh.local', khoa || 'x')
const neon = createClient(neonUrl || 'http://chua-cau-hinh.local', khoa || 'x', {
  accessToken: async () => (await sb.auth.getSession()).data.session?.access_token ?? null,
  global: { fetch: fetchGoiLai() },        // Neon đôi khi chưa nhận thẻ đăng nhập → gọi lại
})

export const supabase = {
  auth: sb.auth,                       // đăng nhập / đăng xuất (Supabase)
  functions: sb.functions,             // Edge Function tài khoản (Supabase)
  from: (...a) => neon.from(...a),     // bảng (Neon)
  rpc: (...a) => neon.rpc(...a),       // hàm máy chủ (Neon)
}
