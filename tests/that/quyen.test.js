// Thử quyền THẬT trên Neon + Supabase: người lạ / học sinh / thủ thư cố làm việc không được phép → phải bị chặn.
// Chạy: npm run test:quyen. Cần trong .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_NEON_DATA_URL,
//   THU_HS1=tendangnhap:matkhau, THU_HS2=..., THU_THU_THU=... (tài khoản thử, tạo riêng, không phải học sinh thật).
// Kiểm tra không để lại thay đổi: mọi lệnh ghi thử đều phải bị chặn; nếu lọt thì báo đỏ.
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = existsSync('.env') ? readFileSync('.env', 'utf8') : ''
const lay = k => env.match(new RegExp(`^\\s*${k}\\s*=\\s*['"]?([^'"\\s]+)`, 'm'))?.[1]
const URL_SB = lay('VITE_SUPABASE_URL'), KHOA = lay('VITE_SUPABASE_ANON_KEY'), NEON = lay('VITE_NEON_DATA_URL')
const DU = URL_SB && KHOA && NEON && lay('THU_HS1') && lay('THU_HS2') && lay('THU_THU_THU')

async function vao(bien) {
  const [ten, mk] = lay(bien).split(':')
  const sb = createClient(URL_SB, KHOA, { auth: { persistSession: false } })
  const { data, error } = await sb.auth.signInWithPassword({ email: `${ten}@school.local`, password: mk })
  if (error) throw new Error(`${bien}: ${error.message}`)
  const db = createClient(NEON, KHOA, { accessToken: async () => data.session.access_token })
  return { sb, db, id: data.user.id }
}

describe.skipIf(!DU)('quyền dữ liệu thật', () => {
  let la, hs1, hs2, tt
  beforeAll(async () => {
    la = createClient(NEON, KHOA)
    ;[hs1, hs2, tt] = await Promise.all([vao('THU_HS1'), vao('THU_HS2'), vao('THU_THU_THU')])
  })

  it('người lạ (chưa đăng nhập) không đọc được hồ sơ, lớp', async () => {
    for (const bang of ['ho_so', 'lop', 'cai_dat']) {
      const { data } = await la.from(bang).select('*').limit(5)
      expect(data ?? []).toEqual([])
    }
  })

  it('học sinh chỉ thấy hồ sơ của mình', async () => {
    const { data } = await hs1.db.from('ho_so').select('id').limit(100)
    expect(data.map(d => d.id)).toEqual([hs1.id])
  })

  it('học sinh không tự sửa / khoá / đổi lớp được (kể cả của mình)', async () => {
    const { error } = await hs1.db.rpc('sua_ho_so', { p_id: hs1.id, p_ho_ten: 'Hack', p_lop_id: null, p_hoat_dong: true })
    expect(error).toBeTruthy()
    const { error: e2 } = await hs1.db.rpc('sua_ho_so', { p_id: hs2.id, p_ho_ten: 'Hack', p_lop_id: null, p_hoat_dong: false })
    expect(e2).toBeTruthy()
  })

  it('học sinh không tự nâng vai trò được', async () => {
    const { error } = await hs1.db.rpc('tao_ho_so', { p_id: hs1.id, p_ho_ten: 'X', p_vai_tro: 'quan_tri', p_ten_dang_nhap: 'xxx', p_lop_id: null })
    expect(error).toBeTruthy()
    const { error: e2 } = await hs1.db.from('ho_so').update({ vai_tro: 'quan_tri' }).eq('id', hs1.id).select()
    expect(e2).toBeTruthy()                                   // không có quyền update bảng
    const { data } = await hs1.db.from('ho_so').select('vai_tro').eq('id', hs1.id).single()
    expect(data.vai_tro).toBe('hoc_sinh')
  })

  it('học sinh không thêm lớp, không sửa cài đặt mượn được', async () => {
    const { error } = await hs1.db.from('lop').insert({ ten: '5Z', khoi: 5, nam_hoc: '2099-2100' }).select()
    expect(error).toBeTruthy()
    const { data } = await hs1.db.from('cai_dat').update({ so_sach_toi_da: 10 }).eq('id', 1).select()
    expect(data ?? []).toEqual([])
  })

  it('học sinh không gọi được hàm tạo / đặt lại mật khẩu / xoá tài khoản', async () => {
    for (const [ham, body] of [
      ['tao-tai-khoan', { ds: [{ ho_ten: 'X', ten_dang_nhap: 'hack01', mat_khau: '123456' }] }],
      ['sua-tai-khoan', { id: hs2.id, mat_khau: '999999' }],
      ['xoa-tai-khoan', { id: hs2.id }],
    ]) {
      const { error } = await hs1.sb.functions.invoke(ham, { body })
      expect(error?.context?.status, ham).toBe(403)
    }
  })

  it('thủ thư không tạo được quản trị, không sửa / đặt lại mật khẩu nhân viên khác', async () => {
    const { error } = await tt.db.rpc('tao_ho_so', { p_id: crypto.randomUUID(), p_ho_ten: 'X', p_vai_tro: 'quan_tri', p_ten_dang_nhap: 'hack02', p_lop_id: null })
    expect(error).toBeTruthy()
    const { data: qt } = await tt.db.from('ho_so').select('id').eq('vai_tro', 'quan_tri').limit(1).single()
    const { error: e2 } = await tt.db.rpc('sua_ho_so', { p_id: qt.id, p_ho_ten: 'Hack', p_lop_id: null, p_hoat_dong: false })
    expect(e2).toBeTruthy()
    const { error: e3 } = await tt.sb.functions.invoke('sua-tai-khoan', { body: { id: qt.id, mat_khau: '99999999' } })
    expect(e3?.context?.status).toBe(403)
    const { error: e4 } = await tt.sb.functions.invoke('xoa-tai-khoan', { body: { id: hs2.id } })
    expect(e4?.context?.status).toBe(403)
  })

  it('thủ thư xem được mọi hồ sơ', async () => {
    const { data } = await tt.db.from('ho_so').select('id').limit(1000)
    expect(data.map(d => d.id)).toEqual(expect.arrayContaining([hs1.id, hs2.id, tt.id]))
  })
})
