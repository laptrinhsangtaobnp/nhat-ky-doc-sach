// Thử quyền THẬT cho thử thách lớp: không ai đọc / ghi thẳng bảng; HS không đặt / kết thúc / xem chi tiết lớp;
// GVCN chỉ lớp mình (gửi lớp khác bị bỏ qua / bị chặn); máy chủ kiểm ngày + số ngày; 1 thử thách chưa xong / lớp;
// máy chủ tự đếm ngày cây lớn, HS chỉ thấy con số (không tên bạn); đạt → mốc thu_thach; kết thúc sớm.
// Tạo sách "THU-TT-*", thử thách tên "THU-TT …" rồi dọn. LƯU Ý: xoá dữ liệu đọc sách của THU_HS1, THU_HS2.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DU, lay, nguoiLa, sqlChu, vao } from './_chung.js'

const SA = 'THU-TT-', TEN = 'THU-TT thử thách'
const cong = (d, n) => { const x = new Date(`${d}T00:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10) }

async function don(ids) {
  for (const b of ['nhat_ky', 'doc_xong', 'moc_dat']) await sqlChu(`delete from public.${b} where hoc_sinh_id = any($1::uuid[])`, [ids])
  await sqlChu('delete from public.thu_thach_lop where ten like $1', ['THU-TT%'])
  await sqlChu('delete from public.sach where ma_sach like $1', [SA + '%'])
}

describe.skipIf(!DU)('quyền thử thách lớp thật', () => {
  let hs1, hs2, tt, gv, lop, lopKhac, hn, sachId
  const loi = r => r.error?.message
  const tao = (ai, lopId, o = {}) => ai.db.rpc('tao_thu_thach', {
    p_lop_id: lopId, p_ten: o.ten ?? TEN, p_tu: o.tu ?? cong(hn, -3), p_den: o.den ?? cong(hn, 10), p_so_ngay: o.soNgay ?? 2 })

  beforeAll(async () => {
    ;[hs1, hs2, tt] = await Promise.all([vao('THU_HS1'), vao('THU_HS2'), vao('THU_THU_THU')])
    if (lay('THU_GV')) gv = await vao('THU_GV')
    await don([hs1.id, hs2.id])
    lop = (await sqlChu('select lop_id from public.ho_so where id = $1', [hs1.id]))[0].lop_id
    lopKhac = (await sqlChu('select id from public.lop where id <> $1 order by id limit 1', [lop]))[0]?.id
    hn = (await sqlChu("select to_char(public.hom_nay(), 'YYYY-MM-DD') d"))[0].d
    const { error } = await tt.db.rpc('nhap_danh_muc', { p_ds: [{ ma_sach: SA + '1', ten: 'Sách thử thử thách' }] })
    if (error) throw new Error(error.message)
    sachId = (await tt.db.from('sach').select('id').eq('ma_sach', SA + '1').single()).data.id
  })
  afterAll(async () => { if (hs1 && hs2) await don([hs1.id, hs2.id]) })

  it('không ai đọc / ghi thẳng bảng; người lạ và HS bị chặn', async () => {
    for (const ai of [hs1, tt, gv].filter(Boolean)) {
      expect((await ai.db.from('thu_thach_lop').select('id').limit(1)).error).toBeTruthy()
      expect((await ai.db.from('thu_thach_lop').insert({ lop_id: lop, ten: TEN, tu: hn, den: hn, so_ngay: 1 })).error).toBeTruthy()
    }
    expect((await nguoiLa().rpc('thu_thach_cua_toi')).error).toBeTruthy()
    expect((await tao({ db: nguoiLa() }, lop)).error).toBeTruthy()
    expect(loi(await tao(hs1, lop))).toBe('forbidden')
    expect(loi(await hs1.db.rpc('thu_thach_lop', { p_lop_id: lop }))).toBe('forbidden')
    for (const ai of [tt, gv].filter(Boolean)) expect(loi(await ai.db.rpc('thu_thach_cua_toi'))).toBe('forbidden')
    for (const h of ['ngay_ghi_trong', 'tom_tat_thu_thach']) expect((await hs1.db.rpc(h, {})).error).toBeTruthy()
    expect(await hs1.db.rpc('thu_thach_cua_toi')).toMatchObject({ data: null, error: null })
  })

  it('máy chủ kiểm tên, ngày, số ngày', async () => {
    const ai = gv ?? tt
    expect(loi(await tao(ai, lop, { ten: ' a ' }))).toBe('sai_ten')
    expect(loi(await tao(ai, lop, { tu: hn, den: cong(hn, 62) }))).toBe('sai_ngay')
    expect(loi(await tao(ai, lop, { tu: cong(hn, -40), den: cong(hn, 5) }))).toBe('sai_ngay')
    expect(loi(await tao(ai, lop, { tu: cong(hn, -10), den: cong(hn, -1) }))).toBe('sai_ngay')
    expect(loi(await tao(ai, lop, { tu: hn, den: cong(hn, 4), soNgay: 6 }))).toBe('sai_so_ngay')
  })

  it('GVCN đặt cho lớp mình (gửi lớp khác bị bỏ qua); chỉ 1 thử thách chưa xong', async () => {
    const ai = gv ?? tt
    const r = await tao(ai, gv ? lopKhac ?? lop : lop)
    expect(r.error).toBeNull()
    expect((await sqlChu('select lop_id from public.thu_thach_lop where id = $1', [r.data]))[0].lop_id).toBe(lop)
    expect(loi(await tao(tt, lop, { tu: cong(hn, 20), den: cong(hn, 30) }))).toBe('dang_co_thu_thach')
  })

  it('máy chủ đếm ngày cây lớn; HS chỉ thấy con số; đạt → mốc', async () => {
    let v = (await hs1.db.rpc('thu_thach_cua_toi')).data
    expect(Object.keys(v).sort()).toEqual(['cua_em', 'den', 'id', 'si_so', 'so_dat', 'so_ngay', 'ten', 'tu'])
    expect(v).toMatchObject({ ten: TEN, cua_em: 0, so_dat: 0, so_ngay: 2 })
    await sqlChu(`insert into public.nhat_ky (hoc_sinh_id, sach_id, ngay, cam_xuc, doan_nho, tinh_chuoi) values ($1, $2, $3, 'vui', 'Em thích lắm', true)`,
      [hs1.id, sachId, cong(hn, -1)])
    await sqlChu(`insert into public.nhat_ky (hoc_sinh_id, sach_id, ngay, cam_xuc, doan_nho, tinh_chuoi) values ($1, $2, $3, 'vui', 'Ngoài thời gian', true)`,
      [hs1.id, sachId, cong(hn, -5)])
    const g = await hs1.db.rpc('ghi_nhat_ky', { p_sach_id: sachId, p_cam_xuc: 'vui', p_doan_nho: 'Hôm nay em đọc thêm một chương' })
    expect(g.error).toBeNull()
    expect(g.data.moc_moi).toContain('thu_thach')
    v = (await hs1.db.rpc('thu_thach_cua_toi')).data
    expect(v).toMatchObject({ cua_em: 2, so_dat: 1 })
    expect((await hs2.db.rpc('thu_thach_cua_toi')).data).toMatchObject({ cua_em: 0, so_dat: 1 })
  })

  it('GVCN / nhân viên xem số ngày từng em (chỉ con số)', async () => {
    for (const ai of [tt, gv].filter(Boolean)) {
      const kq = (await ai.db.rpc('thu_thach_lop', { p_lop_id: lop })).data
      expect(kq.hien_tai.hs.find(h => h.id === hs1.id)).toEqual({ id: hs1.id, so_ngay: 2 })
      expect(Object.keys(kq.hien_tai.hs[0]).sort()).toEqual(['id', 'so_ngay'])
    }
  })

  it('kết thúc sớm: HS / GVCN lớp khác bị chặn; xong thì vào "truoc", không kết thúc lại được', async () => {
    const id = (await tt.db.rpc('thu_thach_lop', { p_lop_id: lop })).data.hien_tai.id
    expect(loi(await hs1.db.rpc('ket_thuc_thu_thach', { p_id: id }))).toBe('forbidden')
    if (gv && lopKhac) {
      const r = await tao(tt, lopKhac, { tu: hn, den: cong(hn, 5), soNgay: 1 })
      if (!r.error) {
        expect(loi(await gv.db.rpc('ket_thuc_thu_thach', { p_id: r.data }))).toBe('forbidden')
        expect(loi(await tt.db.rpc('ket_thuc_thu_thach', { p_id: r.data }))).toBeUndefined()     // bắt đầu hôm nay → xoá
        expect((await sqlChu('select count(*) n from public.thu_thach_lop where id = $1', [r.data]))[0].n).toBe('0')
      }
    }
    expect(loi(await (gv ?? tt).db.rpc('ket_thuc_thu_thach', { p_id: id }))).toBeUndefined()
    const kq = (await tt.db.rpc('thu_thach_lop', { p_lop_id: lop })).data
    expect(kq.hien_tai).toBeNull()
    expect(kq.truoc[0]).toMatchObject({ id, den: cong(hn, -1), so_dat: 0 })                // hôm nay không còn tính → 1/2 ngày
    expect(loi(await tt.db.rpc('ket_thuc_thu_thach', { p_id: id }))).toBe('da_ket_thuc')
    expect((await hs1.db.rpc('thu_thach_cua_toi')).data).toMatchObject({ id, cua_em: 1 })   // vừa xong: hôm nay không còn tính
    expect(loi(await tao(tt, lop, { tu: cong(hn, -2) }))).toBe('dang_co_thu_thach')         // chồng thời gian cũ
  })
})
