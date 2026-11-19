// Thử quyền THẬT cho hộ chiếu thể loại: chỉ HS xem hộ chiếu của mình; tem do máy chủ tính từ "đọc xong" (không gọi được hàm nội bộ);
// sách 2 chủ đề → 2 tem; đọc xong lại không tem lại; gợi ý không có sách ẩn / đã đọc; mốc 5 tem + hộ chiếu đầy; GVCN / nhân viên
// chỉ nhận con số so_tem. Tạo chủ đề "THU-CD-*", sách "THU-HC-*" rồi dọn. LƯU Ý: xoá dữ liệu đọc sách của THU_HS1, THU_HS2.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DU, lay, nguoiLa, sqlChu, vao } from './_chung.js'

const CD = 'THU-CD-', SA = 'THU-HC-'

async function don(ids) {
  for (const b of ['nhat_ky', 'doc_xong', 'moc_dat', 'thu_gui_minh']) await sqlChu(`delete from public.${b} where hoc_sinh_id = any($1::uuid[])`, [ids])
  await sqlChu('delete from public.sach where ma_sach like $1', [SA + '%'])
  await sqlChu('delete from public.chu_de where ten like $1', [CD + '%'])
}

describe.skipIf(!DU)('quyền hộ chiếu thể loại thật', () => {
  let hs1, hs2, tt, gv, cd = [], sach = {}, tongCd
  const loi = r => r.error?.message
  const hoChieu = async ai => (await ai.db.rpc('ho_chieu_cua_toi')).data.tem.filter(t => t.ten.startsWith(CD))
  const docXong = async (ai, id) => {
    expect(loi(await ai.db.rpc('ghi_nhat_ky', { p_sach_id: id, p_cam_xuc: 'vui', p_doan_nho: 'Em thích cuốn này' }))).toBeUndefined()
    const r = await ai.db.rpc('danh_dau_doc_xong', { p_sach_id: id, p_muc_thich: 5 })
    expect(r.error).toBeNull()
    return r.data
  }

  beforeAll(async () => {
    ;[hs1, hs2, tt] = await Promise.all([vao('THU_HS1'), vao('THU_HS2'), vao('THU_THU_THU')])
    if (lay('THU_GV')) gv = await vao('THU_GV')
    await don([hs1.id, hs2.id])
    for (let i = 1; i <= 5; i++) cd.push((await tt.db.from('chu_de').insert({ ten: CD + i }).select('id').single()).data.id)
    const ma = ['1', '2', '3', '4', '5', 'AN']
    const { error } = await tt.db.rpc('nhap_danh_muc', { p_ds: ma.map(m => ({ ma_sach: SA + m, ten: 'Sách thử hộ chiếu ' + m })) })
    if (error) throw new Error(error.message)
    for (const r of (await tt.db.from('sach').select('id, ma_sach').like('ma_sach', SA + '%')).data) sach[r.ma_sach.slice(SA.length)] = r.id
    const gan = [[sach[1], [cd[0], cd[1]]], [sach[2], [cd[2]]], [sach[3], [cd[3]]], [sach[4], [cd[4]]], [sach[5], [cd[4]]], [sach.AN, [cd[2]]]]
    for (const [s, ds] of gan) expect(loi(await tt.db.rpc('dat_chu_de_sach', { p_sach_id: s, p_chu_de_ids: ds }))).toBeUndefined()
    await tt.db.from('sach').update({ an: true }).eq('id', sach.AN)
    tongCd = Number((await sqlChu('select count(*) n from public.chu_de'))[0].n)
  })
  afterAll(async () => { if (hs1 && hs2) await don([hs1.id, hs2.id]) })

  it('chỉ học sinh xem hộ chiếu (của chính mình); không gọi được hàm nội bộ', async () => {
    expect((await nguoiLa().rpc('ho_chieu_cua_toi')).error).toBeTruthy()
    for (const ai of [tt, gv].filter(Boolean)) expect(loi(await ai.db.rpc('ho_chieu_cua_toi'))).toBe('forbidden')
    expect((await hs1.db.rpc('tem_cua', { p_hs: hs1.id })).error).toBeTruthy()
    expect((await hs1.db.rpc('cap_nhat_moc', { p_hs: hs1.id })).error).toBeTruthy()
  })

  it('chưa có tem: gợi ý đúng chủ đề, không có sách ẩn', async () => {
    const hc = await hoChieu(hs1)
    expect(hc).toHaveLength(5)
    expect(hc.every(t => t.ngay === null)).toBe(true)
    expect(hc[2].goi_y.map(s => s.id)).toEqual([sach[2]])
    expect(hc[4].goi_y.map(s => s.id).sort()).toEqual([sach[4], sach[5]].sort())
  })

  it('sách 2 chủ đề → 2 tem; đọc xong lại không tem lại; sách đã đọc không còn trong gợi ý', async () => {
    expect((await docXong(hs1, sach[1])).tem_moi).toEqual([CD + 1, CD + 2])
    expect((await docXong(hs1, sach[1])).tem_moi).toEqual([])
    expect((await docXong(hs1, sach[4])).tem_moi).toEqual([CD + 5])
    expect((await docXong(hs1, sach[5])).tem_moi).toEqual([])
    const hc = await hoChieu(hs1)
    expect(hc[0]).toMatchObject({ sach: 'Sách thử hộ chiếu 1', goi_y: null })
    expect(hc[0].ngay).toBeTruthy()
    expect((await hoChieu(hs2)).every(t => t.ngay === null)).toBe(true)     // bạn khác không bị ảnh hưởng
  })

  it('mốc Nhà thám hiểm (5 tem) và Hộ chiếu đầy', async () => {
    expect((await docXong(hs1, sach[2])).moc_moi).not.toContain('tham_hiem')
    const kq = await docXong(hs1, sach[3])
    expect(kq.moc_moi).toContain('tham_hiem')
    if (tongCd === 5) expect(kq.moc_moi).toContain('ho_chieu_day')
  })

  it('nhân viên / GVCN chỉ nhận con số so_tem', async () => {
    const lop = (await sqlChu('select lop_id from public.ho_so where id = $1', [hs1.id]))[0].lop_id
    for (const ai of [tt, gv].filter(Boolean)) {
      const kq = (await ai.db.rpc('lop_tong_quan', { p_lop_id: lop })).data
      expect(kq.hoc_sinh.find(h => h.id === hs1.id)).toMatchObject({ so_tem: 5 })
      expect(JSON.stringify(kq)).not.toContain('Sách thử hộ chiếu')
    }
    expect(loi(await hs1.db.rpc('lop_tong_quan', { p_lop_id: lop }))).toBe('forbidden')
  })
})
