// Tạo nhiều tài khoản một lần (nhập danh sách học sinh từ Excel, hoặc thêm 1 nhân viên).
// Vào: { ds: [{ ho_ten, ten_dang_nhap, mat_khau, vai_tro?, lop_id? }] } — tối đa 40 người / lần.
// Ra:  { kq: [{ ten_dang_nhap, ok, loi? }] }. Tên đăng nhập đã có → bỏ qua, báo "da_co" (không ghi đè ai).
// Thủ thư chỉ tạo được học sinh; tạo thủ thư / giáo viên / quản trị phải là quản trị (Neon kiểm thêm lần nữa).
import { DUOI_EMAIL, json, laOptions, neon, nguoiGoi, quanTriSupabase } from '../_shared/chung.ts'

const VAI_TRO = ['quan_tri', 'thu_thu', 'giao_vien', 'hoc_sinh']
const TEN_HOP_LE = /^[a-z0-9._]{3,30}$/

Deno.serve(async (req) => {
  const o = laOptions(req)
  if (o) return o
  try {
    const sb = quanTriSupabase()
    const toi = await nguoiGoi(req, sb)
    if (!toi) return json({ error: 'Không có quyền tạo tài khoản' }, 403)

    const { ds } = await req.json()
    if (!Array.isArray(ds) || ds.length === 0 || ds.length > 40) return json({ error: 'Mỗi lần 1–40 tài khoản' }, 400)

    const kq = []
    for (const n of ds) {
      const ten = String(n?.ten_dang_nhap ?? '').trim().toLowerCase()
      const vaiTro = n?.vai_tro ?? 'hoc_sinh'
      const hoTen = String(n?.ho_ten ?? '').trim()
      const matKhau = String(n?.mat_khau ?? '')
      const loi = !TEN_HOP_LE.test(ten) ? 'ten_khong_hop_le'
        : !hoTen || hoTen.length > 100 ? 'thieu_ho_ten'
        : matKhau.length < 6 ? 'mat_khau_ngan'
        : !VAI_TRO.includes(vaiTro) ? 'vai_tro_sai'
        : vaiTro !== 'hoc_sinh' && toi.vaiTro !== 'quan_tri' ? 'forbidden'
        : null
      if (loi) { kq.push({ ten_dang_nhap: ten, ok: false, loi }); continue }

      const { data, error } = await sb.auth.admin.createUser({ email: ten + DUOI_EMAIL, password: matKhau, email_confirm: true })
      if (error || !data.user) {
        kq.push({ ten_dang_nhap: ten, ok: false, loi: /already|registered|exists/i.test(error?.message ?? '') ? 'da_co' : 'loi_tao' })
        continue
      }
      try {
        await neon('rpc/tao_ho_so', toi.token, {
          method: 'POST',
          body: JSON.stringify({ p_id: data.user.id, p_ho_ten: hoTen, p_vai_tro: vaiTro, p_ten_dang_nhap: ten, p_lop_id: n?.lop_id ?? null }),
        })
        kq.push({ ten_dang_nhap: ten, ok: true })
      } catch (e) {
        // Không tạo được hồ sơ → xoá tài khoản vừa tạo để khỏi có tài khoản "mồ côi"
        await sb.auth.admin.deleteUser(data.user.id)
        kq.push({ ten_dang_nhap: ten, ok: false, loi: (e as Error).message === 'forbidden' ? 'forbidden' : 'loi_ho_so' })
      }
    }
    return json({ kq })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
