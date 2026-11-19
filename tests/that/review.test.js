// Thử quyền THẬT cho review của bạn bè: không ai đọc / ghi thẳng bảng; chỉ em đã đọc xong mới viết; bài chờ duyệt không hiện;
// chỉ nhân viên duyệt (GVCN, HS bị chặn); duyệt cần đúng bản đang xem; sửa → duyệt lại; ẩn tên thì máy chủ không gửi tên;
// sách ẩn không xem được; tối đa 5 bài / ngày. Tạo sách "THU-RV-*" rồi dọn.
// LƯU Ý: xoá dữ liệu đọc sách của 2 tài khoản thử THU_HS1, THU_HS2.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DU, lay, nguoiLa, sqlChu, vao } from './_chung.js'

const TIEN_TO = 'THU-RV-'
const BAI = 'Sách này rất hay, các bạn nên đọc nhé!'

async function don(ids) {
  for (const b of ['review', 'nhat_ky', 'doc_xong', 'moc_dat']) await sqlChu(`delete from public.${b} where hoc_sinh_id = any($1::uuid[])`, [ids])
  await sqlChu('delete from public.sach where ma_sach like $1', [TIEN_TO + '%'])
}

describe.skipIf(!DU)('quyền review thật', () => {
  let hs1, hs2, tt, gv, tenHs1, sach = {}
  const loi = r => r.error?.message
  const docXong = async (ai, id) => {
    expect(loi(await ai.db.rpc('ghi_nhat_ky', { p_sach_id: id, p_cam_xuc: 'vui', p_doan_nho: 'Em thích cuốn này' }))).toBeUndefined()
    expect(loi(await ai.db.rpc('danh_dau_doc_xong', { p_sach_id: id, p_muc_thich: 5 }))).toBeUndefined()
  }
  const xem = async (ai, id = sach['01']) => (await ai.db.rpc('review_cua_sach', { p_sach_id: id })).data
  const viet = (ai, nd = BAI, an = false, id = sach['01']) => ai.db.rpc('viet_review', { p_sach_id: id, p_noi_dung: nd, p_an_ten: an })

  beforeAll(async () => {
    ;[hs1, hs2, tt] = await Promise.all([vao('THU_HS1'), vao('THU_HS2'), vao('THU_THU_THU')])
    if (lay('THU_GV')) gv = await vao('THU_GV')
    await don([hs1.id, hs2.id])
    tenHs1 = (await sqlChu('select ho_ten from public.ho_so where id = $1', [hs1.id]))[0].ho_ten
    const ma = ['01', 'AN', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6']
    const { error } = await tt.db.rpc('nhap_danh_muc', { p_ds: ma.map(m => ({ ma_sach: TIEN_TO + m, ten: 'Sách thử review ' + m })) })
    if (error) throw new Error(error.message)
    for (const r of (await tt.db.from('sach').select('id, ma_sach').like('ma_sach', TIEN_TO + '%')).data) sach[r.ma_sach.slice(TIEN_TO.length)] = r.id
    await tt.db.from('sach').update({ an: true }).eq('id', sach.AN)
  })
  afterAll(async () => { if (hs1 && hs2) await don([hs1.id, hs2.id]) })

  it('người lạ và mọi vai trò không đọc / ghi thẳng bảng review', async () => {
    expect((await nguoiLa().rpc('review_cua_sach', { p_sach_id: sach['01'] })).error).toBeTruthy()
    for (const ai of [hs1, tt]) {
      expect((await ai.db.from('review').select('id').limit(1)).error).toBeTruthy()
      expect((await ai.db.from('review').insert({ hoc_sinh_id: ai.id, sach_id: sach['01'], noi_dung: BAI })).error).toBeTruthy()
    }
  })

  it('chưa đọc xong thì không viết được; quá ngắn bị chặn', async () => {
    expect(loi(await viet(hs1))).toBe('chua_doc_xong')
    await docXong(hs1, sach['01'])
    expect((await viet(hs1, 'ngắn')).error?.code).toBe('23514')
    expect(loi(await viet(hs1, BAI, true))).toBeUndefined()
    expect(loi(await tt.db.rpc('viet_review', { p_sach_id: sach['01'], p_noi_dung: BAI }))).toBe('forbidden')
  })

  it('bài chờ duyệt không hiện cho bạn; chỉ nhân viên xem hàng chờ / duyệt', async () => {
    const b2 = await xem(hs2)
    expect(b2).toMatchObject({ da_doc: 1, review: [], em_doc_xong: false, cua_em: null })
    expect((await xem(hs1)).cua_em).toMatchObject({ trang_thai: 'cho_duyet', an_ten: true })
    for (const ai of [hs1, hs2, gv].filter(Boolean)) {
      expect(loi(await ai.db.rpc('review_cho_duyet'))).toBe('forbidden')
      expect(loi(await ai.db.rpc('duyet_review', { p_id: 1, p_duyet: true }))).toBe('forbidden')
    }
  })

  it('duyệt cần đúng bản đang xem; ẩn tên thì không gửi tên', async () => {
    const r = (await tt.db.rpc('review_cho_duyet')).data.ds.find(x => x.sach_id === sach['01'])
    expect(r).toMatchObject({ ho_ten: tenHs1, an_ten: true })
    expect(loi(await tt.db.rpc('duyet_review', { p_id: r.id, p_duyet: true, p_sua_luc: '2000-01-01T00:00:00Z' }))).toBe('da_thay_doi')
    expect(loi(await tt.db.rpc('duyet_review', { p_id: r.id, p_duyet: true, p_sua_luc: r.sua_luc }))).toBeUndefined()
    const b2 = await xem(hs2)
    expect(b2.review).toHaveLength(1)
    expect(b2.review[0]).toMatchObject({ ten: null, noi_dung: BAI, la_cua_em: false })
    expect(JSON.stringify(b2)).not.toContain(tenHs1)
    expect(JSON.stringify(b2)).not.toContain(hs1.id)
    expect(Object.keys(b2.review[0]).sort()).toEqual(['id', 'la_cua_em', 'lop', 'ngay', 'noi_dung', 'ten'])
    if (gv) expect((await xem(gv)).review).toHaveLength(1)
  })

  it('em sửa → chờ duyệt lại; không duyệt cần lý do; em xoá được', async () => {
    expect(loi(await viet(hs1, BAI + ' Sửa lại.', false))).toBeUndefined()
    expect((await xem(hs2)).review).toEqual([])
    const r = (await tt.db.rpc('review_cho_duyet')).data.ds.find(x => x.sach_id === sach['01'])
    expect(loi(await tt.db.rpc('duyet_review', { p_id: r.id, p_duyet: false }))).toBe('thieu_ly_do')
    expect(loi(await tt.db.rpc('duyet_review', { p_id: r.id, p_duyet: false, p_ly_do: 'lo_thong_tin' }))).toBeUndefined()
    expect((await xem(hs1)).cua_em).toMatchObject({ trang_thai: 'khong_duyet', ly_do: 'lo_thong_tin' })
    expect(loi(await hs2.db.rpc('xoa_review', { p_sach_id: sach['01'] }))).toBeUndefined()   // xoá của bạn: không ảnh hưởng
    expect((await xem(hs1)).cua_em).not.toBeNull()
    expect(loi(await hs1.db.rpc('xoa_review', { p_sach_id: sach['01'] }))).toBeUndefined()
    expect((await xem(hs1)).cua_em).toBeNull()
  })

  it('sách ẩn: học sinh không xem / viết được', async () => {
    expect(loi(await hs1.db.rpc('review_cua_sach', { p_sach_id: sach.AN }))).toBe('khong_co_sach')
    expect(loi(await viet(hs1, BAI, false, sach.AN))).toBe('khong_co_sach')
  })

  it('tối đa 5 bài / ngày', async () => {
    const ds = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']
    for (const m of ds) await docXong(hs2, sach[m])
    for (const m of ds.slice(0, 5)) expect(loi(await viet(hs2, BAI, false, sach[m]))).toBeUndefined()
    expect(loi(await viet(hs2, BAI, false, sach.L6))).toBe('qua_nhieu_review')
    expect(loi(await viet(hs2, BAI + ' sửa', false, sach.L1))).toBeUndefined()   // sửa bài đã có vẫn được
  })
})
