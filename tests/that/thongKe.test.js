// Thử quyền THẬT cho thống kê sáng kiến: chỉ nhân viên (người lạ, HS, GVCN bị chặn); không ai đọc / ghi thẳng bảng số liệu;
// máy chủ kiểm khoảng ngày, phạm vi, số nhập; chỉ số app tự đo không nhập tay "Sau"; con số đúng trên dữ liệu dựng sẵn
// (năm 2020 để không lẫn số thật); không có tên học sinh. Tạo sách "THU-TK-*", chủ đề "THU-TK-CD" rồi dọn.
// LƯU Ý: xoá dữ liệu mượn / đọc sách của THU_HS1, THU_HS2. Số đã nhập của chỉ số gio_bao_cao được giữ lại và trả lại.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DU, lay, nguoiLa, sqlChu, vao } from './_chung.js'

const SA = 'THU-TK-', CD = 'THU-TK-CD', TU = '2020-01-01', DEN = '2020-03-30'

async function don(ids) {
  for (const b of ['nhat_ky', 'doc_xong', 'moc_dat', 'luot_muon']) await sqlChu(`delete from public.${b} where hoc_sinh_id = any($1::uuid[])`, [ids])
  await sqlChu('delete from public.sach where ma_sach like $1', [SA + '%'])
  await sqlChu('delete from public.chu_de where ten = $1', [CD])
}

describe.skipIf(!DU)('quyền thống kê sáng kiến thật', () => {
  let hs1, hs2, tt, gv, lop, sach = {}, cu
  const loi = r => r.error?.message
  const tk = (ai, o = {}) => ai.db.rpc('thong_ke', { p_tu: o.tu ?? TU, p_den: o.den ?? DEN, p_pham_vi: o.pv ?? 'lop', p_lop_id: 'lop' in o ? o.lop : lop })
  const luu = (ai, chiSo, truoc, sau = null) => ai.db.rpc('luu_so_lieu', { p_chi_so: chiSo, p_truoc: truoc, p_nguon_truoc: 'Sổ mượn thử', p_sau: sau, p_nguon_sau: null })

  beforeAll(async () => {
    ;[hs1, hs2, tt] = await Promise.all([vao('THU_HS1'), vao('THU_HS2'), vao('THU_THU_THU')])
    if (lay('THU_GV')) gv = await vao('THU_GV')
    await don([hs1.id, hs2.id])
    cu = (await sqlChu("select * from public.so_lieu_sang_kien where chi_so = 'gio_bao_cao'"))[0] ?? null
    lop = (await sqlChu('select lop_id from public.ho_so where id = $1', [hs1.id]))[0].lop_id
    const { error } = await tt.db.rpc('nhap_danh_muc', { p_ds: ['1', '2', '3'].map(m => ({ ma_sach: SA + m, ten: 'Sách thử thống kê ' + m })) })
    if (error) throw new Error(error.message)
    for (const r of (await tt.db.from('sach').select('id, ma_sach').like('ma_sach', SA + '%')).data) sach[r.ma_sach.slice(SA.length)] = r.id
    const cdId = (await tt.db.from('chu_de').insert({ ten: CD }).select('id').single()).data.id
    await tt.db.rpc('dat_chu_de_sach', { p_sach_id: sach[1], p_chu_de_ids: [cdId] })
    const muon = `insert into public.luot_muon (sach_id, hoc_sinh_id, trang_thai, nguon, ngay_dat, ngay_muon, han_tra, ngay_xong)
                  values ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7::date, $8::timestamptz)`
    await sqlChu(muon, [sach[1], hs1.id, 'da_tra', 'tim_sach', '2020-01-09 08:00+07', '2020-01-10 08:00+07', '2020-01-17', '2020-01-20 08:00+07'])  // trễ
    await sqlChu(muon, [sach[2], hs1.id, 'dang_muon', 'goi_y', '2020-02-04 08:00+07', '2020-02-05 08:00+07', '2020-02-12', null])                 // trễ (chưa trả)
    await sqlChu(muon, [sach[1], hs2.id, 'mat', 'truc_tiep', null, '2020-02-10 08:00+07', '2020-02-17', '2020-03-01 08:00+07'])                     // mất
    await sqlChu(muon, [sach[3], hs2.id, 'huy', 'goi_y', '2020-02-11 08:00+07', null, null, '2020-02-12 08:00+07'])                                 // chỉ đặt
    await sqlChu(muon, [sach[3], hs1.id, 'da_tra', 'tim_sach', '2019-12-30 08:00+07', '2019-12-31 08:00+07', '2020-01-07', '2020-01-05 08:00+07'])  // ngoài khoảng
    const nk = `insert into public.nhat_ky (hoc_sinh_id, sach_id, ngay, cam_xuc, doan_nho, tinh_chuoi, cung_bo_me) values ($1, $2, $3, 'vui', 'Em thích lắm', true, $4)`
    await sqlChu(nk, [hs1.id, sach[1], '2020-01-15', true])
    await sqlChu(nk, [hs1.id, sach[1], '2020-01-16', false])
    await sqlChu("insert into public.doc_xong (hoc_sinh_id, sach_id, muc_thich, ngay) values ($1, $2, 4, '2020-01-16')", [hs1.id, sach[1]])
  })
  afterAll(async () => {
    if (hs1 && hs2) await don([hs1.id, hs2.id])
    await sqlChu("delete from public.so_lieu_sang_kien where chi_so = 'gio_bao_cao'")
    if (cu) await sqlChu(`insert into public.so_lieu_sang_kien (chi_so, truoc, nguon_truoc, sau, nguon_sau, sua_luc, sua_boi)
                          values ($1, $2, $3, $4, $5, $6, $7)`, [cu.chi_so, cu.truoc, cu.nguon_truoc, cu.sau, cu.nguon_sau, cu.sua_luc, cu.sua_boi])
  })

  it('chỉ nhân viên; người lạ, HS, GVCN bị chặn; không ai đọc / ghi thẳng bảng', async () => {
    expect((await tk({ db: nguoiLa() })).error).toBeTruthy()
    for (const ai of [hs1, gv].filter(Boolean)) {
      expect(loi(await tk(ai))).toBe('forbidden')
      expect(loi(await ai.db.rpc('lay_so_lieu_sang_kien'))).toBe('forbidden')
      expect(loi(await luu(ai, 'thich_doc', 50))).toBe('forbidden')
    }
    for (const ai of [hs1, tt, gv].filter(Boolean)) {
      expect((await ai.db.from('so_lieu_sang_kien').select('chi_so').limit(1)).error).toBeTruthy()
      expect((await ai.db.from('so_lieu_sang_kien').insert({ chi_so: 'thich_doc', truoc: 1 })).error).toBeTruthy()
    }
  })

  it('máy chủ kiểm khoảng ngày, phạm vi, số nhập', async () => {
    expect(loi(await tk(tt, { tu: '2020-01-01', den: '2021-03-01' }))).toBe('sai_ngay')
    expect(loi(await tk(tt, { den: '2019-12-01' }))).toBe('sai_ngay')
    expect(loi(await tk(tt, { pv: 'lop', lop: null }))).toBe('sai_pham_vi')
    expect(loi(await tk(tt, { pv: 'ca_nuoc' }))).toBe('sai_pham_vi')
    expect(loi(await luu(tt, 'luot_thang', 10, 20))).toBe('tu_dong')
    expect(loi(await luu(tt, 'thich_doc', 120))).toBe('sai_so')
    expect(loi(await luu(tt, 'gio_bao_cao', -1))).toBe('sai_so')
    expect(loi(await luu(tt, 'linh_tinh', 1))).toBe('sai_chi_so')
  })

  it('con số mượn – trả đúng, không có tên học sinh', async () => {
    const r = await tk(tt)
    expect(r.error).toBeNull()
    const k = r.data
    expect(k).toMatchObject({ so_ngay: 90, si_so: 3 })
    expect(k.muon).toMatchObject({ tong: 3, so_hs: 2, tre: 2, mat: 1, dat_app: 3, dat_goi_y: 2 })
    expect(k.muon.theo_thang).toEqual([{ thang: '2020-01', so: 1 }, { thang: '2020-02', so: 2 }])
    expect(k.muon.top[0]).toMatchObject({ ma_sach: SA + '1', so: 2 })
    expect(k.muon.theo_lop).toEqual([expect.objectContaining({ si_so: 3, so_luot: 3, so_hs: 2 })])
    expect(k.nam_im.ds.some(s => s.ma_sach === SA + '1')).toBe(false)
    expect(k.nam_im.ds.some(s => s.ma_sach === SA + '3')).toBe(true)
    const ten = (await sqlChu('select ho_ten from public.ho_so where id = any($1::uuid[])', [[hs1.id, hs2.id]])).map(x => x.ho_ten)
    const chu = JSON.stringify(k)
    for (const t of [...ten, hs1.id, hs2.id]) expect(chu).not.toContain(t)
  })

  it('số liệu app đúng (nhật ký, bố mẹ, đọc xong, chủ đề)', async () => {
    const a = (await tk(tt)).data.app
    expect(a).toMatchObject({ so_hs_nhat_ky: 1, so_lan_ghi: 2, so_ngay_ghi: 2, so_hs_bo_me: 1, so_lan_bo_me: 1, doc_xong: 1, so_hs_doc_xong: 1 })
    expect(a.chu_de.find(c => c.ten === CD)).toMatchObject({ so_muon: 2, so_doc_xong: 1, thich_tb: 4 })
  })

  it('thủ thư lưu / đọc số "Trước", "Sau" nhập tay', async () => {
    expect(loi(await luu(tt, 'gio_bao_cao', 8.5, 1))).toBeUndefined()
    const ds = (await tt.db.rpc('lay_so_lieu_sang_kien')).data
    expect(ds.find(x => x.chi_so === 'gio_bao_cao')).toMatchObject({ truoc: 8.5, sau: 1, nguon_truoc: 'Sổ mượn thử' })
    expect(loi(await luu(tt, 'gio_bao_cao', null, null))).toBeUndefined()
  })
})
