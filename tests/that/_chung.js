// Dùng chung cho test quyền thật: đọc .env, đăng nhập tài khoản thử, client người lạ.
import { createClient } from '@supabase/supabase-js'
import { emailDangNhap } from '../../src/domain/taiKhoan.js'
import { docEnv } from '../../scripts/docEnv.mjs'

export const lay = docEnv()
const URL_SB = lay('VITE_SUPABASE_URL'), KHOA = lay('VITE_SUPABASE_ANON_KEY'), NEON = lay('VITE_NEON_DATA_URL')

/** Đủ biến để chạy test thật chưa (thiếu thì bỏ qua, không báo đỏ). */
export const DU = Boolean(URL_SB && KHOA && NEON && lay('NEON_DATABASE_URL') && lay('THU_HS1') && lay('THU_HS2') && lay('THU_THU_THU'))

/** Đăng nhập tài khoản thử trong .env (dạng tên:mật khẩu) → { sb, db, id }. */
export async function vao(bien) {
  const v = lay(bien), i = v.indexOf(':')
  const sb = createClient(URL_SB, KHOA, { auth: { persistSession: false } })
  const { data, error } = await sb.auth.signInWithPassword({ email: emailDangNhap(v.slice(0, i)), password: v.slice(i + 1) })
  if (error) throw new Error(`${bien}: ${error.message}`)
  const db = createClient(NEON, KHOA, { accessToken: async () => data.session.access_token })
  return { sb, db, id: data.user.id }
}

/** Client Neon chưa đăng nhập. */
export const nguoiLa = () => createClient(NEON, KHOA)

/** Chạy SQL bằng quyền chủ CSDL (NEON_DATABASE_URL) — CHỈ để dọn dữ liệu thử, không dùng để kiểm quyền. */
export async function sqlChu(cau, thamSo = []) {
  const { default: pg } = await import('pg')
  const c = new pg.Client({ connectionString: lay('NEON_DATABASE_URL') })
  await c.connect()
  try { return (await c.query(cau, thamSo)).rows } finally { await c.end() }
}
