// Đặt lại mật khẩu. Vào: { id, mat_khau }. Thủ thư chỉ đặt lại cho học sinh; nhân viên khác phải là quản trị.
// (Họ tên, lớp, khoá / mở: trang gọi hàm sua_ho_so ở Neon — Neon tự kiểm quyền, không cần qua đây.)
import { json, laOptions, nguoiGoi, quanTriSupabase, vaiTroCua } from '../_shared/chung.ts'

Deno.serve(async (req) => {
  const o = laOptions(req)
  if (o) return o
  try {
    const sb = quanTriSupabase()
    const toi = await nguoiGoi(req, sb)
    if (!toi) return json({ error: 'Không có quyền' }, 403)
    const { id, mat_khau } = await req.json()
    if (typeof id !== 'string' || String(mat_khau ?? '').length < 6) return json({ error: 'Mật khẩu ít nhất 6 ký tự' }, 400)
    const vai = await vaiTroCua(id, toi.token)
    if (!vai) return json({ error: 'Không tìm thấy tài khoản' }, 404)
    if (vai !== 'hoc_sinh' && toi.vaiTro !== 'quan_tri') return json({ error: 'Không có quyền' }, 403)
    const { error } = await sb.auth.admin.updateUserById(id, { password: String(mat_khau) })
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
