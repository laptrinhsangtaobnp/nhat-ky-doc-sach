import { describe, it, expect } from 'vitest'
import { bangSoSanh, cacTrangExcel, chuChenh, docSo, giaTriTuDong, khoangMacDinh, kiemKhoang, kiemSo, moiThang, theoKhoi, tiLe } from './thongKe'

const TK = {
  tu: '2026-09-01', den: '2026-11-29', so_ngay: 90, si_so: 40,
  muon: { tong: 120, so_hs: 30, tre: 3, mat: 1, dat_app: 50, dat_goi_y: 10,
    theo_thang: [{ thang: '2026-09', so: 40 }], top: [{ ma_sach: 'A1', ten: 'Dế Mèn', so: 9 }],
    theo_lop: [{ lop: '3A', khoi: 3, si_so: 20, so_luot: 70, so_hs: 16 }, { lop: '3B', khoi: 3, si_so: 20, so_luot: 50, so_hs: 14 }] },
  nam_im: { so: 2, tong_sach: 10, ds: [{ ma_sach: 'B1', ten: 'Sách im' }] },
  app: { so_hs_nhat_ky: 25, so_lan_ghi: 300, so_ngay_ghi: 250, so_hs_bo_me: 8, so_lan_bo_me: 20, doc_xong: 60, review_duyet: 5,
    thu_thach_dat: 12, tem_tb: 2.5, chu_de: [{ ten: 'Cổ tích', so_muon: 20, so_doc_xong: 9, thich_tb: 4.5 }] },
}

describe('thống kê sáng kiến', () => {
  it('quy đổi tháng, tỉ lệ', () => {
    expect(moiThang(120, 90)).toBe(40)
    expect(moiThang(5, 0)).toBe(0)
    expect(tiLe(30, 40)).toBe(75)
    expect(tiLe(1, 3)).toBe(33.3)
    expect(tiLe(1, 0)).toBe(0)
  })

  it('khoảng mặc định theo năm học, kiểm khoảng', () => {
    expect(khoangMacDinh('2026-11-19')).toEqual({ tu: '2026-09-01', den: '2026-11-19' })
    expect(khoangMacDinh('2027-03-02')).toEqual({ tu: '2026-09-01', den: '2027-03-02' })
    expect(kiemKhoang('2026-09-01', '2026-08-01')).toMatch(/sau/)
    expect(kiemKhoang('2026-01-01', '2027-03-01')).toMatch(/13 tháng/)
    expect(kiemKhoang('2026-09-01', '2026-11-19')).toBeNull()
  })

  it('đọc / kiểm số nhập tay', () => {
    expect(docSo('12,5')).toBe(12.5)
    expect(docSo(' ')).toBeNull()
    expect(docSo('abc')).toBeNaN()
    expect(docSo('-3')).toBeNaN()
    expect(kiemSo('thich_doc', 120)).toMatch(/0 đến 100/)
    expect(kiemSo('gio_bao_cao', 120)).toBeNull()
    expect(kiemSo('gio_bao_cao', NaN)).toMatch(/Chỉ nhập số/)
  })

  it('bảng so sánh: app tự điền 4 chỉ số, chiều tốt đúng', () => {
    const td = giaTriTuDong(TK)
    expect(td).toEqual({ luot_thang: 40, ti_le_muon: 75, nam_im: 2, tre_mat: 4 })
    const b = bangSoSanh([
      { chi_so: 'luot_thang', truoc: '20', sau: '999' },               // "sau" của chỉ số tự đo bị bỏ qua
      { chi_so: 'nam_im', truoc: 5 },
      { chi_so: 'thich_doc', truoc: 50, sau: 50 },
      { chi_so: 'gio_bao_cao', truoc: 8, sau: 1, nguon_sau: 'Bấm giờ' },
    ], td)
    const r = Object.fromEntries(b.map(x => [x.ma, x]))
    expect(r.luot_thang).toMatchObject({ truoc: 20, sau: 40, chenh: 20, phanTramDoi: 100, tot: true, nguonSau: 'App tự đo' })
    expect(r.nam_im).toMatchObject({ chenh: -3, tot: true })
    expect(r.gio_bao_cao).toMatchObject({ chenh: -7, tot: true, nguonSau: 'Bấm giờ' })
    expect(r.thich_doc.tot).toBeNull()
    expect(r.phu_huynh).toMatchObject({ truoc: null, sau: null, chenh: null })
    expect(bangSoSanh([], null).find(x => x.ma === 'luot_thang').sau).toBeNull()
  })

  it('chữ chênh lệch', () => {
    expect(chuChenh({ chenh: 12.5, phanTramDoi: 30 })).toBe('+12,5 (+30%)')
    expect(chuChenh({ chenh: -2, phanTramDoi: null })).toBe('-2')
    expect(chuChenh({ chenh: null })).toBe('—')
  })

  it('gộp khối, trang Excel không có tên học sinh', () => {
    expect(theoKhoi(TK.muon.theo_lop)).toEqual([{ khoi: 3, si_so: 40, so_luot: 120, so_hs: 30 }])
    const trang = cacTrangExcel(TK, bangSoSanh([], giaTriTuDong(TK)), 'Các lớp thí điểm')
    expect(trang.map(t => t.sheet)).toEqual(['So sánh trước – sau', 'Tổng quan', 'Mượn theo tháng', 'Theo lớp', 'Top 10 sách', 'Chủ đề yêu thích', 'Sách nằm im'])
    expect(trang.every(t => t.sheet.length <= 31)).toBe(true)                // giới hạn tên trang của Excel
    expect(cacTrangExcel(TK, null, 'x')[0].sheet).toBe('Tổng quan')
  })
})
