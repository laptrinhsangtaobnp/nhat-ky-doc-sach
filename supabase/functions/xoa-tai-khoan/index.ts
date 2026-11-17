// Xoá hẳn tài khoản + hồ sơ (chỉ quản trị). Vào: { id }. Xoá hồ sơ ở Neon trước (Neon tự kiểm quyền), rồi xoá đăng nhập.
import { json, laOptions, neon, nguoiGoi, quanTriSupabase } from '../_shared/chung.ts'

Deno.serve(async (req) => {
  const o = laOptions(req)
  if (o) return o
  try {
    const sb = quanTriSupabase()
    const toi = await nguoiGoi(req, sb)
    if (!toi || toi.vaiTro !== 'quan_tri') return json({ error: 'Chỉ quản trị được xoá tài khoản' }, 403)
    const { id } = await req.json()
    if (typeof id !== 'string' || id === toi.id) return json({ error: 'Không xoá được tài khoản này' }, 400)
    await neon('rpc/xoa_ho_so', toi.token, { method: 'POST', body: JSON.stringify({ p_id: id }) })
    const { error } = await sb.auth.admin.deleteUser(id)
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
