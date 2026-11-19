// Thử quyền THẬT cho nhật ký (Neon): HS không đọc / sửa nhật ký của bạn, không ghi thẳng bảng; máy chủ tự tính "tính chuỗi",
// chuỗi tuần, mốc; sửa / xoá chỉ trong 7 ngày; đọc xong cần đã ghi nhật ký; nhân viên xem được; Nhìn lại / Lớp kiểm quyền.
// Tạo sách "THU-NK-*" rồi dọn. LƯU Ý: xoá nhật ký / đọc xong / mốc / mục tiêu của 2 tài khoản thử THU_HS1, THU_HS2.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DU, nguoiLa, sqlChu, vao } from './_chung.js'

const TIEN_TO = 'THU-NK-'
const DAI = Array.from({ length: 25 }, (_, i) => `chữ${i}`).join(' ')     // 25 chữ → đủ tính chuỗi (ngưỡng mặc định 20)

async function don(ids) {
  for (const b of ['nhat_ky', 'doc_xong', 'moc_dat', 'tuy_chon_hs']) await sqlChu(`delete from public.${b} where hoc_sinh_id = any($1::uuid[])`, [ids])
  await sqlChu(`delete from public.nhat_ky where sach_id in (select id from public.sach where ma_sach like $1)`, [TIEN_TO + '%'])
  await sqlChu(`delete from public.doc_xong where sach_id in (select id from public.sach where ma_sach like $1)`, [TIEN_TO + '%'])
  await sqlChu('delete from public.sach where ma_sach like $1', [TIEN_TO + '%'])
}

describe.skipIf(!DU)('quyền nhật ký thật', () => {
  let la, hs1, hs2, tt, sach = {}, nk = {}
  const loi = r => r.error?.message
  const ghi = (ai, sachId, nd = {}) => ai.db.rpc('ghi_nhat_ky', { p_sach_id: sachId, p_cam_xuc: 'vui', ...nd })

  beforeAll(async () => {
    la = nguoiLa()
    ;[hs1, hs2, tt] = await Promise.all([vao('THU_HS1'), vao('THU_HS2'), vao('THU_THU_THU')])
    await don([hs1.id, hs2.id])
    const { error } = await tt.db.rpc('nhap_danh_muc', { p_ds: ['01', '02', 'AN'].map(m => ({ ma_sach: TIEN_TO + m, ten: 'Sách thử nhật ký ' + m })) })
    if (error) throw new Error(error.message)
    for (const r of (await tt.db.from('sach').select('id, ma_sach').like('ma_sach', TIEN_TO + '%')).data) sach[r.ma_sach.slice(TIEN_TO.length)] = r.id
    await tt.db.from('sach').update({ an: true }).eq('id', sach.AN)
  })
  afterAll(async () => { if (hs1 && hs2) await don([hs1.id, hs2.id]) })

  it('người lạ không đọc / ghi được', async () => {
    expect((await la.from('nhat_ky').select('id').limit(3)).data ?? []).toEqual([])
    expect((await la.rpc('ghi_nhat_ky', { p_sach_id: sach['01'], p_cam_xuc: 'vui', p_em_nghi: 'x' })).error).toBeTruthy()
  })

  it('máy chủ tự tính "tính chuỗi": ngắn không tính, dài tính, lần dài thứ 2 trong ngày không tính', async () => {
    const r1 = await ghi(hs1, sach['01'], { p_em_nghi: 'Hay quá' })
    expect(r1.error).toBeNull()
    expect(r1.data.tinh_chuoi).toBe(false)
    const r2 = await ghi(hs1, sach['01'], { p_doan_nho: DAI, p_trang: 12, p_cung_bo_me: true })
    expect(r2.data.tinh_chuoi).toBe(true)
    expect(r2.data.chuoi.tuan_nay).toBe(1)
    const r3 = await ghi(hs1, sach['01'], { p_em_nghi: DAI })
    expect(r3.data.tinh_chuoi).toBe(false)
    Object.assign(nk, { ngan: r1.data.id, dai: r2.data.id, dai2: r3.data.id })
    expect(loi(await ghi(hs1, sach['01'], {}))).toBeTruthy()                         // không có nội dung → bị chặn
    expect(loi(await ghi(hs1, sach.AN, { p_em_nghi: 'x' }))).toBe('khong_co_sach')  // sách ẩn
  })

  it('xoá lần được tính → lần đủ dài khác cùng ngày được tính thay', async () => {
    expect((await hs1.db.rpc('xoa_nhat_ky', { p_id: nk.dai })).error).toBeNull()
    expect((await hs1.db.from('nhat_ky').select('tinh_chuoi').eq('id', nk.dai2).single()).data.tinh_chuoi).toBe(true)
  })

  it('bạn khác không đọc / sửa / xoá được; HS không ghi thẳng bảng', async () => {
    expect((await hs2.db.from('nhat_ky').select('id').eq('id', nk.ngan)).data).toEqual([])
    expect(loi(await hs2.db.rpc('sua_nhat_ky', { p_id: nk.ngan, p_cam_xuc: 'buon', p_em_nghi: 'sửa bậy' }))).toBe('forbidden')
    expect(loi(await hs2.db.rpc('xoa_nhat_ky', { p_id: nk.ngan }))).toBe('forbidden')
    expect(loi(await hs2.db.rpc('nhin_lai_nam', { p_hs: hs1.id }))).toBe('forbidden')
    expect(loi(await hs2.db.rpc('lop_tong_quan', {}))).toBe('forbidden')
    expect((await hs1.db.from('nhat_ky').insert({ hoc_sinh_id: hs1.id, sach_id: sach['01'], ngay: '2026-01-01', cam_xuc: 'vui', em_nghi: 'x', tinh_chuoi: true }).select()).error).toBeTruthy()
    const { data: sua } = await hs1.db.from('nhat_ky').update({ tinh_chuoi: true }).eq('id', nk.ngan).select()
    expect(sua ?? []).toEqual([])
    expect((await hs1.db.from('doc_xong').insert({ hoc_sinh_id: hs1.id, sach_id: sach['02'], muc_thich: 5, ngay: '2026-11-01' }).select()).error).toBeTruthy()
    expect((await hs1.db.from('moc_dat').insert({ hoc_sinh_id: hs1.id, ma: 'cuon_20' }).select()).error).toBeTruthy()
  })

  it('sửa được trong 7 ngày, quá 7 ngày bị chặn', async () => {
    expect((await hs1.db.rpc('sua_nhat_ky', { p_id: nk.ngan, p_cam_xuc: 'hoi_hop', p_em_nghi: 'Sửa lại' })).error).toBeNull()
    await sqlChu(`update public.nhat_ky set ngay = ngay - 8 where id = $1`, [nk.ngan])
    expect(loi(await hs1.db.rpc('sua_nhat_ky', { p_id: nk.ngan, p_cam_xuc: 'vui', p_em_nghi: 'x' }))).toBe('het_han_sua')
    expect(loi(await hs1.db.rpc('xoa_nhat_ky', { p_id: nk.ngan }))).toBe('het_han_sua')
  })

  it('đọc xong cần đã ghi nhật ký; đạt mốc cuốn đầu tiên 1 lần', async () => {
    expect(loi(await hs1.db.rpc('danh_dau_doc_xong', { p_sach_id: sach['02'], p_muc_thich: 5 }))).toBe('chua_ghi_nhat_ky')
    const r = await hs1.db.rpc('danh_dau_doc_xong', { p_sach_id: sach['01'], p_muc_thich: 4, p_cam_nhan: 'Hay' })
    expect(r.error).toBeNull()
    expect(r.data.moc_moi).toEqual(['cuon_1'])
    expect((await hs1.db.rpc('danh_dau_doc_xong', { p_sach_id: sach['01'], p_muc_thich: 5 })).data.moc_moi).toEqual([])
    expect(loi(await hs1.db.rpc('danh_dau_doc_xong', { p_sach_id: sach['01'], p_muc_thich: 9 }))).toBeTruthy()
  })

  it('chuỗi tuần: 4 tuần trước đều đủ 3 lần → chuỗi 4, đạt mốc chuỗi 4 tuần', async () => {
    for (let tuan = 1; tuan <= 4; tuan++) {
      for (let k = 0; k < 3; k++) {
        await sqlChu(`insert into public.nhat_ky (hoc_sinh_id, sach_id, ngay, cam_xuc, em_nghi, tinh_chuoi)
          values ($1, $2, date_trunc('week', public.hom_nay())::date - $3::int * 7 + $4::int, 'vui', $5, true)`, [hs1.id, sach['01'], tuan, k, DAI])
      }
    }
    const tq = (await hs1.db.rpc('tong_quan_cua_toi')).data
    expect(tq.chuoi).toMatchObject({ chuoi: 4, dai_nhat: 4, can: 3 })
    expect(tq.doc_xong).toContain(sach['01'])
    const r = await ghi(hs1, sach['02'], { p_em_nghi: 'Thêm một lần' })
    expect(r.data.moc_moi).toContain('chuoi_4')
  })

  it('mục tiêu tháng 1–3; nhân viên xem được nhật ký, Nhìn lại, Lớp', async () => {
    expect((await hs1.db.rpc('dat_muc_tieu', { p_so: 3 })).error).toBeNull()
    expect((await hs1.db.rpc('dat_muc_tieu', { p_so: 5 })).error).toBeTruthy()
    expect((await hs1.db.rpc('tong_quan_cua_toi')).data.muc_tieu).toBe(3)
    expect((await tt.db.from('nhat_ky').select('id').eq('hoc_sinh_id', hs1.id)).data.length).toBeGreaterThan(5)
    const nl = (await tt.db.rpc('nhin_lai_nam', { p_hs: hs1.id })).data
    expect(nl).toMatchObject({ so_cuon: 1, so_lan_bo_me: 0 })
    expect(nl.so_lan_ghi).toBeGreaterThan(0)
    const lop = (await sqlChu('select lop_id from public.ho_so where id = $1', [hs1.id]))[0].lop_id
    const lq = (await tt.db.rpc('lop_tong_quan', { p_lop_id: lop })).data
    expect(lq.hoc_sinh.find(h => h.id === hs1.id)).toMatchObject({ so_cuon_nam: 1 })
    expect(loi(await hs1.db.rpc('lop_tong_quan', { p_lop_id: lop }))).toBe('forbidden')
  })
})
