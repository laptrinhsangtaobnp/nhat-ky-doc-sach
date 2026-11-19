// Thử quyền THẬT cho GVCN (tài khoản THU_GV = GVCN lớp của THU_HS1): xem Lớp của tôi (chỉ lớp mình, chỉ con số), đọc chữ chỉ ở
// lần ghi em "Cho cô xem", không xem em lớp khác / người không phải HS; mã lớp + PIN chỉ lớp mình; không ghi nhật ký,
// không sửa danh mục. Tạo 1 sách + 1 lớp tạm "THU-GV" rồi dọn. LƯU Ý: xoá nhật ký + PIN của lớp thử.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DU, lay, sqlChu, vao } from './_chung.js'

const MA = 'THU-GV-01'

describe.skipIf(!DU || !lay('THU_GV'))('quyền GVCN thật', () => {
  let gv, hs1, tt, lop, lopKhac, sachId, nk = {}
  const loi = r => r.error?.message
  const don = async () => {
    await sqlChu('delete from public.nhat_ky where hoc_sinh_id = $1', [hs1.id])
    await sqlChu('delete from public.moc_dat where hoc_sinh_id = $1', [hs1.id])
    await sqlChu('delete from public.pin_hs where hoc_sinh_id in (select id from public.ho_so where lop_id = $1)', [lop])
    await sqlChu('delete from public.sach where ma_sach = $1', [MA])
    await sqlChu("delete from public.lop where ten = 'GVX' and nam_hoc = '2099-2100'")
  }

  beforeAll(async () => {
    ;[gv, hs1, tt] = await Promise.all([vao('THU_GV'), vao('THU_HS1'), vao('THU_THU_THU')])
    lop = (await sqlChu('select lop_id from public.ho_so where id = $1', [hs1.id]))[0].lop_id
    await don()
    ;[{ id: sachId }] = await sqlChu(`insert into public.sach (ma_sach, ten) values ($1, 'Sách thử GVCN') returning id`, [MA])
    ;[{ id: lopKhac }] = await sqlChu(`insert into public.lop (ten, khoi, nam_hoc) values ('GVX', 4, '2099-2100') returning id`)
    nk.rieng = (await hs1.db.rpc('ghi_nhat_ky', { p_sach_id: sachId, p_cam_xuc: 'vui', p_doan_nho: 'Bí mật của em nhé' })).data.id
    nk.chia = (await hs1.db.rpc('ghi_nhat_ky', { p_sach_id: sachId, p_cam_xuc: 'buon', p_doan_nho: 'Em cho cô xem đoạn này', p_cho_co_xem: true })).data.id
  })
  afterAll(async () => { if (hs1) await don() })

  it('Lớp của tôi: chỉ lớp mình (bỏ qua lớp truyền vào), chỉ con số', async () => {
    const kq = (await gv.db.rpc('lop_tong_quan', {})).data
    const em = kq.hoc_sinh.find(h => h.id === hs1.id)
    expect(em).toMatchObject({ so_chia_se: 1 })
    expect(JSON.stringify(kq)).not.toContain('Bí mật')
    expect((await gv.db.rpc('lop_tong_quan', { p_lop_id: lopKhac })).data.lop).toBe(kq.lop)
  })

  it('đọc chữ chỉ ở lần em cho cô xem; Nhìn lại không có chữ em viết', async () => {
    const { data } = await gv.db.from('nhat_ky').select('id, doan_nho').eq('hoc_sinh_id', hs1.id)
    expect(data.map(x => x.id)).toEqual([nk.chia])
    const nl = (await gv.db.rpc('nhin_lai_nam', { p_hs: hs1.id })).data
    expect(nl).toMatchObject({ la_em: false, so_chia_se: 1, thu: [] })
    expect(JSON.stringify(nl)).not.toContain('Bí mật')
    expect((await gv.db.from('doc_xong').select('cam_nhan').eq('hoc_sinh_id', hs1.id)).data).toEqual([])
  })

  it('không xem được người ngoài lớp / không phải học sinh', async () => {
    expect(loi(await gv.db.rpc('nhin_lai_nam', { p_hs: tt.id }))).toBe('forbidden')
    expect((await gv.db.from('ho_so').select('id').eq('id', tt.id)).data).toEqual([])
  })

  it('mã lớp + PIN: chỉ lớp mình', async () => {
    expect((await gv.db.rpc('lay_ma_lop', { p_lop_id: lop })).data).toMatch(/^[A-Z2-9]{6}$/)
    expect(loi(await gv.db.rpc('lay_ma_lop', { p_lop_id: lopKhac }))).toBe('forbidden')
    expect(loi(await gv.db.rpc('tao_pin', { p_lop_id: lopKhac }))).toBe('forbidden')
    expect(loi(await gv.db.rpc('doi_ma_lop', { p_lop_id: lopKhac }))).toBe('forbidden')
    const pin = (await gv.db.rpc('tao_pin', { p_lop_id: lop, p_hs: hs1.id })).data
    expect(pin[0]).toMatchObject({ id: hs1.id })
  })

  it('không ghi nhật ký thay em, không sửa nhật ký em, không sửa danh mục / lớp', async () => {
    expect(loi(await gv.db.rpc('ghi_nhat_ky', { p_sach_id: sachId, p_cam_xuc: 'vui', p_doan_nho: 'x y z' }))).toBe('forbidden')
    expect(loi(await gv.db.rpc('sua_nhat_ky', { p_id: nk.chia, p_cam_xuc: 'vui', p_doan_nho: 'sửa bậy' }))).toBe('forbidden')
    expect(loi(await gv.db.rpc('doi_cho_co_xem', { p_id: nk.rieng, p_cho: true }))).toBe('forbidden')
    expect(loi(await gv.db.rpc('nhap_danh_muc', { p_ds: [{ ma_sach: 'HACKGV', ten: 'x' }] }))).toBe('forbidden')
    const { data } = await gv.db.from('lop').update({ thi_diem: true }).eq('id', lop).select('id')
    expect(data ?? []).toEqual([])
  })
})
