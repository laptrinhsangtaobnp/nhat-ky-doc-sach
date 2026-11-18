// Thử quyền THẬT cho mượn – trả (Neon): người lạ / học sinh không tự đổi trạng thái, không xem lượt của bạn,
// máy chủ chặn đặt trùng, vượt tối đa, hết bản, sách ẩn; đủ vòng đặt → soạn → cho mượn → trả; báo mất giảm số bản.
// Tạo sách "THU-MUON-*" rồi dọn ở cuối. LƯU Ý: xoá mọi lượt mượn của 2 tài khoản thử THU_HS1, THU_HS2 (chỉ dùng để test).
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DU, nguoiLa, sqlChu, vao } from './_chung.js'

const TIEN_TO = 'THU-MUON-'

async function don(ids) {
  await sqlChu(`delete from public.luot_muon where hoc_sinh_id = any($1::uuid[])
    or sach_id in (select id from public.sach where ma_sach like $2)`, [ids, TIEN_TO + '%'])
  await sqlChu('delete from public.sach where ma_sach like $1', [TIEN_TO + '%'])
}

describe.skipIf(!DU)('quyền mượn – trả thật', () => {
  let la, hs1, hs2, tt, toiDa, soNgayMuon, sach = {}, luot = {}

  const maLoi = r => r.error?.message
  const homNayVN = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())

  beforeAll(async () => {
    la = nguoiLa()
    ;[hs1, hs2, tt] = await Promise.all([vao('THU_HS1'), vao('THU_HS2'), vao('THU_THU_THU')])
    await don([hs1.id, hs2.id])
    const cd = (await tt.db.from('cai_dat').select('so_sach_toi_da, so_ngay_muon').eq('id', 1).single()).data
    toiDa = cd.so_sach_toi_da
    soNgayMuon = cd.so_ngay_muon
    const ds = Array.from({ length: toiDa + 1 }, (_, i) => ({ ma_sach: `${TIEN_TO}${String(i + 1).padStart(2, '0')}`, ten: `Sách thử mượn ${i + 1}`, so_ban: 1 }))
    ds.push({ ma_sach: TIEN_TO + 'AN', ten: 'Sách thử mượn (ẩn)', so_ban: 1 })
    const { error } = await tt.db.rpc('nhap_danh_muc', { p_ds: ds })
    if (error) throw new Error('thủ thư không nhập được sách thử: ' + error.message)
    for (const r of (await tt.db.from('sach').select('id, ma_sach').like('ma_sach', TIEN_TO + '%')).data) sach[r.ma_sach.slice(TIEN_TO.length)] = r.id
    await tt.db.from('sach').update({ an: true }).eq('id', sach.AN)
  })
  afterAll(async () => { if (hs1 && hs2) await don([hs1.id, hs2.id]) })

  it('người lạ không đọc lượt mượn, không gọi được hàm', async () => {
    expect((await la.from('luot_muon').select('id').limit(5)).data ?? []).toEqual([])
    expect((await la.rpc('dat_truoc', { p_sach_id: sach['01'] })).error).toBeTruthy()
    expect((await la.rpc('ds_muon', { p_loai: 'dang_muon' })).error).toBeTruthy()
  })

  it('HS đặt trước được; đặt lại cùng cuốn bị chặn; bạn khác không thấy lượt của em', async () => {
    const r = await hs1.db.rpc('dat_truoc', { p_sach_id: sach['01'] })
    expect(r.error).toBeNull()
    luot.hs1 = r.data.id
    expect(maLoi(await hs1.db.rpc('dat_truoc', { p_sach_id: sach['01'] }))).toBe('da_dat')
    expect((await hs1.db.from('luot_muon').select('id').eq('id', luot.hs1)).data).toHaveLength(1)
    expect((await hs2.db.from('luot_muon').select('id').eq('id', luot.hs1)).data).toEqual([])
    const cua2 = (await hs2.db.rpc('muon_cua_toi')).data
    expect(cua2.some(l => l.id === luot.hs1)).toBe(false)
  })

  it('HS không ghi thẳng bảng, không gọi hàm của thủ thư, không huỷ lượt của bạn', async () => {
    expect((await hs1.db.from('luot_muon').insert({ sach_id: sach['02'], hoc_sinh_id: hs1.id, trang_thai: 'dang_muon' }).select()).error).toBeTruthy()
    const { data: sua } = await hs1.db.from('luot_muon').update({ trang_thai: 'da_tra' }).eq('id', luot.hs1).select()
    expect(sua ?? []).toEqual([])
    await hs1.db.from('luot_muon').delete().eq('id', luot.hs1)
    for (const [ham, ts] of [['soan_sach', { p_id: luot.hs1 }], ['cho_muon', { p_id: luot.hs1 }], ['ghi_tra', { p_id: luot.hs1 }],
      ['bao_mat', { p_id: luot.hs1 }], ['ds_muon', { p_loai: 'can_soan' }], ['dem_muon', {}],
      ['cho_muon_truc_tiep', { p_hoc_sinh_id: hs1.id, p_sach_id: sach['02'] }]]) {
      expect(maLoi(await hs1.db.rpc(ham, ts)), ham).toBe('forbidden')
    }
    expect(maLoi(await hs2.db.rpc('huy_dat_truoc', { p_id: luot.hs1 }))).toBe('forbidden')
    expect((await tt.db.from('luot_muon').select('trang_thai').eq('id', luot.hs1).single()).data.trang_thai).toBe('dat_truoc')
  })

  it('hàng chờ → soạn → cho mượn → trả → bạn chờ sau được soạn', async () => {
    const r = await hs2.db.rpc('dat_truoc', { p_sach_id: sach['01'] })
    expect(r.error).toBeNull()
    luot.hs2 = r.data.id
    const tt2 = (await hs2.db.rpc('tinh_trang_sach', { p_sach_id: sach['01'] })).data
    expect(tt2).toMatchObject({ so_ban: 1, con_ban: 1, hang_cho: 2, cua_em: { thu_tu_cho: 2 } })

    expect((await tt.db.rpc('soan_sach', { p_id: luot.hs1 })).error).toBeNull()
    expect(maLoi(await tt.db.rpc('soan_sach', { p_id: luot.hs2 }))).toBe('het_ban')
    expect(maLoi(await hs1.db.rpc('huy_dat_truoc', { p_id: luot.hs1 }))).toBe('da_soan_roi')

    expect((await tt.db.rpc('cho_muon', { p_id: luot.hs1 })).error).toBeNull()
    const l = (await hs1.db.from('luot_muon').select('trang_thai, han_tra').eq('id', luot.hs1).single()).data
    expect(l.trang_thai).toBe('dang_muon')
    expect(Math.round((Date.parse(l.han_tra) - Date.parse(homNayVN())) / 86400000)).toBe(soNgayMuon)
    expect((await tt.db.rpc('dem_muon')).data).toMatchObject({ dang_muon: expect.any(Number) })
    expect((await tt.db.rpc('ds_muon', { p_loai: 'dang_muon', p_tu_khoa: 'thu muon' })).data.some(x => x.id === luot.hs1)).toBe(true)

    expect((await tt.db.rpc('ghi_tra', { p_id: luot.hs1 })).error).toBeNull()
    expect(maLoi(await tt.db.rpc('ghi_tra', { p_id: luot.hs1 }))).toBe('sai_trang_thai')
    expect((await tt.db.rpc('soan_sach', { p_id: luot.hs2 })).error).toBeNull()
    expect((await tt.db.rpc('huy_dat_truoc', { p_id: luot.hs2 })).error).toBeNull()       // thủ thư cất lại
  })

  it('máy chủ chặn vượt số cuốn tối đa (cả đặt trước lẫn cho mượn tại chỗ)', async () => {
    const ids = []
    for (let i = 1; i <= toiDa; i++) {
      const r = await hs1.db.rpc('dat_truoc', { p_sach_id: sach[String(i).padStart(2, '0')] })
      expect(r.error, `cuốn ${i}`).toBeNull()
      ids.push(r.data.id)
    }
    const cuoi = sach[String(toiDa + 1).padStart(2, '0')]
    expect(maLoi(await hs1.db.rpc('dat_truoc', { p_sach_id: cuoi }))).toBe('qua_toi_da')
    expect(maLoi(await tt.db.rpc('cho_muon_truc_tiep', { p_hoc_sinh_id: hs1.id, p_sach_id: cuoi }))).toBe('qua_toi_da')
    for (const id of ids) expect((await hs1.db.rpc('huy_dat_truoc', { p_id: id })).error).toBeNull()
  })

  it('HS không đặt được sách ẩn; báo mất → giảm số bản → hết sách', async () => {
    expect(maLoi(await hs1.db.rpc('dat_truoc', { p_sach_id: sach.AN }))).toBe('khong_co_sach')
    expect((await hs1.db.rpc('tinh_trang_sach', { p_sach_id: sach.AN })).data).toBeNull()

    const r = await tt.db.rpc('cho_muon_truc_tiep', { p_hoc_sinh_id: hs2.id, p_sach_id: sach['01'] })
    expect(r.error).toBeNull()
    expect(maLoi(await tt.db.rpc('cho_muon_truc_tiep', { p_hoc_sinh_id: tt.id, p_sach_id: sach['02'] }))).toBe('khong_phai_hoc_sinh')
    expect((await tt.db.rpc('bao_mat', { p_id: r.data.id })).error).toBeNull()
    expect((await tt.db.from('sach').select('so_ban').eq('id', sach['01']).single()).data.so_ban).toBe(0)
    expect(maLoi(await hs1.db.rpc('dat_truoc', { p_sach_id: sach['01'] }))).toBe('het_sach')
  })
})
