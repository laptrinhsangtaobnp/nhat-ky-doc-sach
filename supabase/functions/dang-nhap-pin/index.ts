// Học sinh đăng nhập bằng MÃ LỚP + chọn tên + PIN 4 số (không cần đăng nhập trước → đưa lên với --no-verify-jwt).
// Vào: { ma } → { lop, hoc_sinh: [{ id, ten }] } (tên hiện rút gọn, chỉ em đã có PIN)
//      { ma, hs, pin } → { access_token, refresh_token } khi đúng PIN; sai → { loi: 'sai', con } / { loi: 'khoa', den } / ...
// Kiểm PIN ở Neon bằng vai trò riêng `dang_nhap_pin` (chỉ gọi được ds_ten_theo_ma, kiem_pin; tự đếm sai và khoá).
// Đúng PIN → tạo phiên Supabase cho đúng tài khoản em đó (magic link do máy chủ tạo + xác nhận ngay, không gửi email).
import { neon as neonSql } from 'npm:@neondatabase/serverless@0.10.4'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { json, laOptions, quanTriSupabase } from '../_shared/chung.ts'

const MA = /^[A-Z2-9]{6}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  const o = laOptions(req)
  if (o) return o
  try {
    const url = Deno.env.get('NEON_PIN_URL')
    if (!url) return json({ error: 'Thiếu secret NEON_PIN_URL' }, 500)
    const sql = neonSql(url)
    const b = await req.json().catch(() => ({}))
    const ma = String(b?.ma ?? '').trim().toUpperCase()
    if (!MA.test(ma)) return json({ loi: 'ma_sai' })

    if (b.hs === undefined) {
      const [{ kq }] = await sql`select public.ds_ten_theo_ma(${ma}) kq`
      return kq ? json(kq) : json({ loi: 'ma_sai' })
    }

    const hs = String(b.hs), pin = String(b.pin ?? '')
    if (!UUID.test(hs) || !/^\d{4}$/.test(pin)) return json({ loi: 'sai', con: null })
    const [{ kq }] = await sql`select public.kiem_pin(${ma}, ${hs}::uuid, ${pin}) kq`
    if (kq !== 'ok') {
      const [loai, them] = String(kq).split(/:(.*)/)
      return json({ loi: loai, ...(loai === 'sai' ? { con: Number(them) } : loai === 'khoa' ? { den: them } : {}) })
    }

    const sb = quanTriSupabase()
    const { data: u, error: e1 } = await sb.auth.admin.getUserById(hs)
    if (e1 || !u.user?.email) return json({ error: 'Không tìm thấy tài khoản' }, 500)
    const { data: link, error: e2 } = await sb.auth.admin.generateLink({ type: 'magiclink', email: u.user.email })
    if (e2) return json({ error: 'Không tạo được phiên' }, 500)
    const khach = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: p, error: e3 } = await khach.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'magiclink' })
    if (e3 || !p.session) return json({ error: 'Không tạo được phiên' }, 500)
    return json({ access_token: p.session.access_token, refresh_token: p.session.refresh_token })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
