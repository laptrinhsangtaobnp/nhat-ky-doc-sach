// Thử quyền THẬT cho nhật ký (Neon): HS không đọc / sửa nhật ký của bạn, không ghi thẳng bảng; máy chủ tự tính lần ghi được
// tính cho cây (≥ 3 chữ, 1 lần / ngày), số ngày cây lớn, mốc; sửa / xoá chỉ trong 7 ngày; đọc xong cần đã ghi nhật ký;
// RIÊNG TƯ: nhân viên / GVCN chỉ đọc chữ ở lần ghi em "Cho cô xem", không đọc cảm nhận / thư gửi chính mình;
// thư chỉ mở khi đến ngày. Tạo sách "THU-NK-*" rồi dọn. LƯU Ý: xoá dữ liệu đọc sách của 2 tài khoản thử THU_HS1, THU_HS2.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DU, nguoiLa, sqlChu, vao } from './_chung.js'

const TIEN_TO = 'THU-NK-'
const CAU = 'Dế Mèn rất dũng cảm'        // 5 chữ → đủ tính cho cây (ngưỡng 3)

async function don(ids) {
  for (const b of ['nhat_ky', 'doc_xong', 'moc_dat', 'tuy_chon_hs', 'thu_gui_minh']) await sqlChu(`delete from public.${b} where hoc_sinh_id = any($1::uuid[])`, [ids])
  for (const b of ['nhat_ky', 'doc_xong', 'thu_gui_minh']) {
    await sqlChu(`delete from public.${b} where sach_id in (select id from public.sach where ma_sach like $1)`, [TIEN_TO + '%'])
  }
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
    expect((await tt.db.from('sach').update({ so_trang: 120, cau_hoi: 'Câu hỏi thử?' }).eq('id', sach['02']).select('so_trang')).data).toEqual([{ so_trang: 120 }])
  })
  afterAll(async () => { if (hs1 && hs2) await don([hs1.id, hs2.id]) })

  it('người lạ không đọc / ghi được', async () => {
    expect((await la.from('nhat_ky').select('id').limit(3)).data ?? []).toEqual([])
    expect((await la.rpc('ghi_nhat_ky', { p_sach_id: sach['01'], p_cam_xuc: 'vui', p_em_nghi: 'x' })).error).toBeTruthy()
  })

  it('máy chủ tự tính cho cây: 2 chữ không tính, 1 câu tính, lần thứ 2 trong ngày không tính', async () => {
    const r1 = await ghi(hs1, sach['01'], { p_em_nghi: 'Hay quá' })
    expect(r1.error).toBeNull()
    expect(r1.data.tinh_chuoi).toBe(false)
    expect(r1.data.cay).toMatchObject({ so_ngay: 0, hom_nay: false })
    const r2 = await ghi(hs1, sach['01'], { p_doan_nho: CAU, p_trang: 12 })
    expect(r2.data.tinh_chuoi).toBe(true)
    expect(r2.data.cay).toMatchObject({ so_ngay: 1, tuan_nay: 1, hom_nay: true })
    const r3 = await ghi(hs1, sach['01'], { p_em_nghi: CAU })
    expect(r3.data.tinh_chuoi).toBe(false)
    expect(r3.data.cay.so_ngay).toBe(1)
    Object.assign(nk, { ngan: r1.data.id, dai: r2.data.id, dai2: r3.data.id })
    expect(loi(await ghi(hs1, sach['01'], {}))).toBeTruthy()                         // không có nội dung → bị chặn
    expect(loi(await ghi(hs1, sach.AN, { p_em_nghi: 'x' }))).toBe('khong_co_sach')  // sách ẩn
  })

  it('xoá lần được tính → lần đủ dài khác cùng ngày được tính thay', async () => {
    expect((await hs1.db.rpc('xoa_nhat_ky', { p_id: nk.dai })).error).toBeNull()
    expect((await hs1.db.from('nhat_ky').select('tinh_chuoi').eq('id', nk.dai2).single()).data.tinh_chuoi).toBe(true)
  })

  it('bạn khác không đọc / sửa / xoá được; HS không ghi thẳng bảng, không đọc thẳng bảng thư', async () => {
    expect((await hs2.db.from('nhat_ky').select('id').eq('id', nk.ngan)).data).toEqual([])
    expect(loi(await hs2.db.rpc('sua_nhat_ky', { p_id: nk.ngan, p_cam_xuc: 'buon', p_em_nghi: 'sửa bậy' }))).toBe('forbidden')
    expect(loi(await hs2.db.rpc('xoa_nhat_ky', { p_id: nk.ngan }))).toBe('forbidden')
    expect(loi(await hs2.db.rpc('doi_cho_co_xem', { p_id: nk.ngan, p_cho: true }))).toBe('forbidden')
    expect(loi(await hs2.db.rpc('nhin_lai_nam', { p_hs: hs1.id }))).toBe('forbidden')
    expect(loi(await hs2.db.rpc('lop_tong_quan', {}))).toBe('forbidden')
    expect((await hs1.db.from('nhat_ky').insert({ hoc_sinh_id: hs1.id, sach_id: sach['01'], ngay: '2026-01-01', cam_xuc: 'vui', em_nghi: 'x', tinh_chuoi: true }).select()).error).toBeTruthy()
    const { data: sua } = await hs1.db.from('nhat_ky').update({ tinh_chuoi: true, cho_co_xem: true }).eq('id', nk.ngan).select()
    expect(sua ?? []).toEqual([])
    expect((await hs1.db.from('doc_xong').insert({ hoc_sinh_id: hs1.id, sach_id: sach['02'], muc_thich: 5, ngay: '2026-11-01' }).select()).error).toBeTruthy()
    expect((await hs1.db.from('moc_dat').insert({ hoc_sinh_id: hs1.id, ma: 'ngay_100' }).select()).error).toBeTruthy()
    expect((await hs1.db.from('thu_gui_minh').insert({ hoc_sinh_id: hs1.id, sach_id: sach['01'], noi_dung: 'x', viet_ngay: '2026-01-01', mo_ngay: '2026-01-01' })).error).toBeTruthy()
    expect((await hs1.db.from('thu_gui_minh').select('noi_dung')).error).toBeTruthy()
  })

  it('sửa được trong 7 ngày, quá 7 ngày bị chặn', async () => {
    expect((await hs1.db.rpc('sua_nhat_ky', { p_id: nk.ngan, p_cam_xuc: 'hoi_hop', p_em_nghi: 'Sửa lại' })).error).toBeNull()
    await sqlChu(`update public.nhat_ky set ngay = ngay - 8 where id = $1`, [nk.ngan])
    expect(loi(await hs1.db.rpc('sua_nhat_ky', { p_id: nk.ngan, p_cam_xuc: 'vui', p_em_nghi: 'x' }))).toBe('het_han_sua')
    expect(loi(await hs1.db.rpc('xoa_nhat_ky', { p_id: nk.ngan }))).toBe('het_han_sua')
  })

  it('riêng tư: nhân viên chỉ đọc chữ ở lần em "Cho cô xem"; bật / tắt lúc nào cũng được (kể cả quá 7 ngày)', async () => {
    const tuDoc = async () => (await tt.db.from('nhat_ky').select('id, doan_nho, em_nghi').eq('hoc_sinh_id', hs1.id)).data
    expect(await tuDoc()).toEqual([])
    expect((await hs1.db.rpc('doi_cho_co_xem', { p_id: nk.ngan, p_cho: true })).error).toBeNull()
    expect((await tuDoc()).map(x => x.id)).toEqual([nk.ngan])
    const r = await ghi(hs1, sach['02'], { p_doan_nho: CAU, p_cho_co_xem: true, p_trang: 30 })
    expect((await tuDoc()).map(x => x.id).sort()).toEqual([nk.ngan, r.data.id].sort())
    expect((await hs1.db.rpc('doi_cho_co_xem', { p_id: nk.ngan, p_cho: false })).error).toBeNull()
    expect((await tuDoc()).map(x => x.id)).toEqual([r.data.id])
    expect((await hs1.db.from('nhat_ky').select('id').eq('hoc_sinh_id', hs1.id)).data.length).toBe(3)   // em vẫn thấy hết
  })

  it('đọc xong cần đã ghi nhật ký; cảm nhận + thư chỉ em xem; thư chỉ mở khi đến ngày', async () => {
    expect(loi(await hs1.db.rpc('danh_dau_doc_xong', { p_sach_id: sach.AN, p_muc_thich: 5 }))).toBe('chua_ghi_nhat_ky')
    const r = await hs1.db.rpc('danh_dau_doc_xong', { p_sach_id: sach['01'], p_muc_thich: 4, p_cam_nhan: 'Cảm nhận riêng', p_thu: 'Thư bí mật' })
    expect(r.error).toBeNull()
    expect(loi(await hs1.db.rpc('danh_dau_doc_xong', { p_sach_id: sach['01'], p_muc_thich: 9 }))).toBeTruthy()
    expect(loi(await hs1.db.rpc('mo_thu', { p_sach_id: sach['01'] }))).toBe('chua_den_ngay')
    expect((await hs1.db.rpc('tong_quan_cua_toi')).data).toMatchObject({ thu_den_han: [] })
    expect((await hs1.db.rpc('tong_quan_cua_toi')).data.thu_cho).toBeTruthy()
    await sqlChu('update public.thu_gui_minh set mo_ngay = mo_ngay - 90 where hoc_sinh_id = $1', [hs1.id])
    expect((await hs1.db.rpc('tong_quan_cua_toi')).data.thu_den_han).toHaveLength(1)
    expect(loi(await hs2.db.rpc('mo_thu', { p_sach_id: sach['01'] }))).toBe('chua_den_ngay')          // bạn khác không mở được
    expect(loi(await tt.db.rpc('mo_thu', { p_sach_id: sach['01'] }))).toBe('forbidden')
    expect((await hs1.db.rpc('mo_thu', { p_sach_id: sach['01'] })).data).toMatchObject({ noi_dung: 'Thư bí mật' })
    expect((await hs1.db.rpc('tong_quan_cua_toi')).data.thu_den_han).toEqual([])
    expect((await hs1.db.rpc('nhin_lai_nam')).data).toMatchObject({ la_em: true, thu: [{ noi_dung: 'Thư bí mật' }] })
    // nhân viên: không đọc bảng doc_xong / thư; Nhìn lại không có cảm nhận / thư
    expect((await tt.db.from('doc_xong').select('cam_nhan').eq('hoc_sinh_id', hs1.id)).data).toEqual([])
    const nl = (await tt.db.rpc('nhin_lai_nam', { p_hs: hs1.id })).data
    expect(nl).toMatchObject({ la_em: false, thu: [], so_cuon: 1, so_chia_se: 1 })
    expect(nl.sach.every(s => s.cam_nhan === null)).toBe(true)
    expect(JSON.stringify(nl)).not.toContain('Cảm nhận riêng')
    expect(JSON.stringify(nl)).not.toContain('Dế Mèn')
  })

  it('cây + mốc theo số ngày; bố mẹ viết → Gia đình đọc sách; đọc tiếp có trang', async () => {
    for (let k = 1; k <= 6; k++) {
      await sqlChu(`insert into public.nhat_ky (hoc_sinh_id, sach_id, ngay, cam_xuc, em_nghi, tinh_chuoi)
        values ($1, $2, public.hom_nay() - $3::int, 'vui', $4, true)`, [hs1.id, sach['01'], k + 10, CAU])
    }
    for (let k = 0; k < 4; k++) {
      await sqlChu(`insert into public.nhat_ky (hoc_sinh_id, sach_id, ngay, cam_xuc, em_nghi, cung_bo_me)
        values ($1, $2, public.hom_nay() - 30, 'vui', 'x', true)`, [hs1.id, sach['01']])
    }
    const r = await ghi(hs1, sach['02'], { p_doan_nho: 'Mẹ con cùng đọc', p_bo_me_viet: 'Mẹ rất vui', p_trang: 45 })
    expect(r.data.moc_moi.sort()).toEqual(['gia_dinh', 'ngay_7'])
    expect((await hs1.db.from('nhat_ky').select('cung_bo_me, bo_me_viet').eq('id', r.data.id).single()).data)
      .toEqual({ cung_bo_me: true, bo_me_viet: 'Mẹ rất vui' })
    const tq = (await hs1.db.rpc('tong_quan_cua_toi')).data
    expect(tq.cay.so_ngay).toBe(7)
    expect(tq.dang_doc[0]).toMatchObject({ id: sach['02'], trang_cuoi: 45, so_trang: 120 })
    expect(tq.dang_doc.some(s => s.id === sach['01'])).toBe(false)                // đã đọc xong → không ở "đọc tiếp"
    expect(tq.tuan.bo_me).toBeGreaterThanOrEqual(1)
  })

  it('Lớp: nhân viên xem con số (cây, số lần cho cô xem), không có chữ; HS bị chặn', async () => {
    const lop = (await sqlChu('select lop_id from public.ho_so where id = $1', [hs1.id]))[0].lop_id
    const lq = (await tt.db.rpc('lop_tong_quan', { p_lop_id: lop })).data
    const em = lq.hoc_sinh.find(h => h.id === hs1.id)
    expect(em).toMatchObject({ so_cuon_nam: 1, so_chia_se: 1, cay: { so_ngay: 7 } })
    expect(Object.keys(em).sort()).toEqual(['cay', 'ho_ten', 'id', 'lan_ghi_cuoi', 'so_chia_se', 'so_cuon_nam', 'so_tem'])
    expect(loi(await hs1.db.rpc('lop_tong_quan', { p_lop_id: lop }))).toBe('forbidden')
  })
})
