// Thử quyền THẬT cho mã lớp + PIN: HS không xem mã lớp / không tạo PIN / không gọi kiem_pin; nhân viên tạo / đặt lại PIN;
// vai trò dang_nhap_pin (Edge Function dùng) chỉ gọi 2 hàm; sai 5 lần → khoá; đặt lại PIN → mở khoá; mã lớp sai → không có.
// Edge Function dang-nhap-pin (đúng PIN → vào đúng tài khoản em đó). LƯU Ý: xoá / đặt lại PIN của các em lớp thử (lớp của THU_HS1).
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { DU, lay, sqlChu, vao } from './_chung.js'

const pinSql = async (cau, thamSo) => {
  const { default: pg } = await import('pg')
  const c = new pg.Client({ connectionString: lay('NEON_PIN_URL') })
  await c.connect()
  try { return (await c.query(cau, thamSo)).rows } finally { await c.end() }
}
const kiem = async (ma, hs, pin) => (await pinSql('select public.kiem_pin($1, $2, $3) kq', [ma, hs, pin]))[0].kq

describe.skipIf(!DU || !lay('NEON_PIN_URL'))('quyền mã lớp + PIN thật', () => {
  let hs1, tt, lop, ma, pin1
  const loi = r => r.error?.message
  const donPin = () => sqlChu('delete from public.pin_hs where hoc_sinh_id in (select id from public.ho_so where lop_id = $1)', [lop])

  beforeAll(async () => {
    ;[hs1, tt] = await Promise.all([vao('THU_HS1'), vao('THU_THU_THU')])
    lop = (await sqlChu('select lop_id from public.ho_so where id = $1', [hs1.id]))[0].lop_id
    await donPin()
    await sqlChu('delete from public.lop_sai_pin where lop_id = $1', [lop])
  })
  afterAll(async () => { if (lop) { await donPin(); await sqlChu('delete from public.lop_sai_pin where lop_id = $1', [lop]) } })

  it('HS: không xem mã lớp, không tạo PIN, không gọi kiem_pin / ds_ten_theo_ma; vẫn xem tên lớp', async () => {
    expect(loi(await hs1.db.rpc('lay_ma_lop', { p_lop_id: lop }))).toBe('forbidden')
    expect(loi(await hs1.db.rpc('tao_pin', { p_lop_id: lop }))).toBe('forbidden')
    expect(loi(await hs1.db.rpc('tinh_trang_pin_lop', { p_lop_id: lop }))).toBe('forbidden')
    expect((await hs1.db.rpc('kiem_pin', { p_ma: 'AAAAAA', p_hs: hs1.id, p_pin: '1234' })).error).toBeTruthy()
    expect((await hs1.db.rpc('ds_ten_theo_ma', { p_ma: 'AAAAAA' })).error).toBeTruthy()
    expect((await hs1.db.from('lop').select('ma_lop').eq('id', lop)).error).toBeTruthy()
    expect((await hs1.db.from('pin_hs').select('pin_hash')).error).toBeTruthy()
    expect((await hs1.db.from('lop').select('ten').eq('id', lop)).data).toHaveLength(1)
    expect((await tt.db.from('lop').update({ ma_lop: 'AAAAAA' }).eq('id', lop)).error).toBeTruthy()   // kể cả nhân viên: chỉ qua doi_ma_lop
  })

  it('nhân viên tạo PIN cho em chưa có (PIN rõ chỉ trả 1 lần, máy chủ lưu bản băm)', async () => {
    ma = (await tt.db.rpc('lay_ma_lop', { p_lop_id: lop })).data
    expect(ma).toMatch(/^[A-Z2-9]{6}$/)
    const kq = (await tt.db.rpc('tao_pin', { p_lop_id: lop })).data
    pin1 = kq.find(x => x.id === hs1.id)?.pin
    expect(pin1).toMatch(/^\d{4}$/)
    expect((await tt.db.rpc('tao_pin', { p_lop_id: lop })).data).toEqual([])          // ai cũng có rồi → không tạo lại
    const [{ pin_hash: h }] = await sqlChu('select pin_hash from public.pin_hs where hoc_sinh_id = $1', [hs1.id])
    expect(h).not.toContain(pin1)
    expect((await tt.db.rpc('tinh_trang_pin_lop', { p_lop_id: lop })).data.find(x => x.id === hs1.id)).toMatchObject({ co_pin: true, bi_khoa: false })
    expect(loi(await tt.db.rpc('tao_pin', { p_lop_id: lop, p_hs: tt.id }))).toBe('forbidden')   // người không thuộc lớp
  })

  it('vai trò dang_nhap_pin: chỉ gọi 2 hàm; tên rút gọn; sai 5 lần → khoá; đặt lại PIN → mở khoá', async () => {
    await expect(pinSql('select 1 from public.ho_so limit 1')).rejects.toThrow()
    await expect(pinSql('select public.tao_pin($1)', [lop])).rejects.toThrow()
    const ds = (await pinSql('select public.ds_ten_theo_ma($1) kq', [ma.toLowerCase()]))[0].kq
    expect(ds.hoc_sinh.some(h => h.id === hs1.id)).toBe(true)
    expect(JSON.stringify(ds)).not.toContain('ho_ten')
    expect((await pinSql('select public.ds_ten_theo_ma($1) kq', ['ZZZZZZ']))[0].kq).toBeNull()
    expect(await kiem('ZZZZZZ', hs1.id, pin1)).toBe('khong_co')
    const sai = pin1 === '0000' ? '1111' : '0000'
    expect(await kiem(ma, hs1.id, sai)).toBe('sai:4')
    for (let i = 0; i < 3; i++) await kiem(ma, hs1.id, sai)
    expect(await kiem(ma, hs1.id, sai)).toMatch(/^khoa:/)
    expect(await kiem(ma, hs1.id, pin1)).toMatch(/^khoa:/)                           // đúng PIN cũng phải chờ
    expect((await tt.db.rpc('tinh_trang_pin_lop', { p_lop_id: lop })).data.find(x => x.id === hs1.id).bi_khoa).toBe(true)
    pin1 = (await tt.db.rpc('tao_pin', { p_lop_id: lop, p_hs: hs1.id })).data[0].pin
    expect(await kiem(ma, hs1.id, pin1)).toBe('ok')
  })

  it('đổi mã lớp: mã cũ hết dùng được', async () => {
    const moi = (await tt.db.rpc('doi_ma_lop', { p_lop_id: lop })).data
    expect(moi).not.toBe(ma)
    expect(await kiem(ma, hs1.id, pin1)).toBe('khong_co')
    expect(await kiem(moi, hs1.id, pin1)).toBe('ok')
    ma = moi
  })

  it('Edge Function dang-nhap-pin: đúng PIN → phiên của đúng em; sai PIN → không có phiên', async () => {
    const khach = createClient(lay('VITE_SUPABASE_URL'), lay('VITE_SUPABASE_ANON_KEY'), { auth: { persistSession: false } })
    const goi = async body => (await khach.functions.invoke('dang-nhap-pin', { body })).data
    expect((await goi({ ma })).hoc_sinh.some(h => h.id === hs1.id)).toBe(true)
    expect(await goi({ ma: 'ZZZZZZ' })).toEqual({ loi: 'ma_sai' })
    const sai = await goi({ ma, hs: hs1.id, pin: pin1 === '0000' ? '1111' : '0000' })
    expect(sai).toMatchObject({ loi: 'sai' })
    expect(sai.access_token).toBeUndefined()
    const dung = await goi({ ma, hs: hs1.id, pin: pin1 })
    const { data } = await khach.auth.setSession(dung)
    expect(data.user.id).toBe(hs1.id)
  })
})
