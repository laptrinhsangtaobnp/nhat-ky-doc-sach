// Dùng chung cho các Edge Function tài khoản. Thư mục bắt đầu bằng "_" không thành hàm riêng.
// Vai trò người gọi đọc ở NEON (nơi chứa hồ sơ) bằng chính thẻ đăng nhập của người gọi — không tin gì trình duyệt gửi.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const DUOI_EMAIL = '@school.local'
const NEON = Deno.env.get('NEON_DATA_URL') ?? ''

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
export const laOptions = (req: Request) => (req.method === 'OPTIONS' ? new Response('ok', { headers: cors }) : null)

export const quanTriSupabase = () =>
  createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
    auth: { autoRefreshToken: false, persistSession: false },
  })

export async function neon(duong: string, token: string, init: RequestInit = {}) {
  const r = await fetch(`${NEON}/rest/v1/${duong}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  const t = await r.text()
  if (!r.ok) throw new Error(t.includes('forbidden') ? 'forbidden' : `Neon ${r.status}: ${t.slice(0, 200)}`)
  return t ? JSON.parse(t) : null
}

// Trả về { id, vaiTro, token } của người gọi nếu là nhân viên (quan_tri / thu_thu) đang hoạt động, ngược lại null.
export async function nguoiGoi(req: Request, sb: ReturnType<typeof quanTriSupabase>) {
  if (!NEON) throw new Error('Thiếu secret NEON_DATA_URL')
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return null
  const [hs] = (await neon(`ho_so?id=eq.${user.id}&select=vai_tro,hoat_dong`, token)) ?? []
  if (!hs || !hs.hoat_dong || !['quan_tri', 'thu_thu'].includes(hs.vai_tro)) return null
  return { id: user.id, vaiTro: hs.vai_tro as string, token }
}

// Vai trò hiện tại của một tài khoản (người gọi là nhân viên nên RLS cho đọc mọi hồ sơ)
export async function vaiTroCua(id: string, token: string): Promise<string | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const [hs] = (await neon(`ho_so?id=eq.${id}&select=vai_tro`, token)) ?? []
  return hs?.vai_tro ?? null
}
