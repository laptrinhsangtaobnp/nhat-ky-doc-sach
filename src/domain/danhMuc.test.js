import { describe, it, expect } from 'vitest'
import { chuanHoaMaSach, chuKhoi, docBangSach, docKhoi, mauTim, tachCauHoiExcel, tachChuDe, tachNxbNam } from './danhMuc.js'

describe('danhMuc', () => {
  it('chuẩn hoá mã sách', () => {
    expect(chuanHoaMaSach(' tn 001 ')).toBe('TN001')
    expect(chuanHoaMaSach('TT-01.a')).toBe('TT-01.A')
    expect(chuanHoaMaSach('sách1')).toBe(null)
    expect(chuanHoaMaSach('')).toBe(null)
  })
  it('tách NXB – năm', () => {
    expect(tachNxbNam('Kim Đồng, 2020')).toEqual({ nxb: 'Kim Đồng', nam: 2020 })
    expect(tachNxbNam('NXB Giáo dục - 2019')).toEqual({ nxb: 'Giáo dục', nam: 2019 })
    expect(tachNxbNam('Trẻ (2018)')).toEqual({ nxb: 'Trẻ', nam: 2018 })
    expect(tachNxbNam('2021')).toEqual({ nxb: null, nam: 2021 })
    expect(tachNxbNam('Kim Đồng')).toEqual({ nxb: 'Kim Đồng', nam: null })
    expect(tachNxbNam('')).toEqual({ nxb: null, nam: null })
  })
  it('đọc khối', () => {
    expect(docKhoi('3')).toEqual({ khoi_tu: 3, khoi_den: 3 })
    expect(docKhoi('3-4')).toEqual({ khoi_tu: 3, khoi_den: 4 })
    expect(docKhoi('Khối 3 và 5')).toEqual({ khoi_tu: 3, khoi_den: 5 })
    expect(docKhoi('')).toEqual({ khoi_tu: 1, khoi_den: 5 })
    expect(docKhoi('7')).toBe(null)
    expect(docKhoi('abc')).toBe(null)
  })
  it('tách chủ đề, bỏ trùng', () => {
    expect(tachChuDe('Cổ tích; Khoa học')).toEqual(['Cổ tích', 'Khoa học'])
    expect(tachChuDe('Cổ tích, cổ tích')).toEqual(['Cổ tích'])
    expect(tachChuDe('')).toEqual([])
  })
  it('đọc bảng: tìm tiêu đề, báo dòng lỗi, chống trùng mã, chủ đề mới', () => {
    const dongs = [
      ['DANH MỤC SÁCH THƯ VIỆN'],
      ['Mã sách', 'Tên sách', 'Tác giả', 'NXB - năm', 'Chủ đề', 'Khối', 'Số bản', 'Vị trí', 'Giới thiệu'],
      ['tn001', 'Dế Mèn phiêu lưu ký', 'Tô Hoài', 'Kim Đồng, 2020', 'Phiêu lưu; Cổ tích', '3-4', 2, 'Kệ A1', 'Chú dế...'],
      ['TN002', '', '', '', '', '', '', '', ''],
      ['TN001', 'Trùng mã', '', '', '', '', '', '', ''],
      ['TN003', 'Sách khối sai', '', '', '', '8', '', '', ''],
      ['TN004', 'Ba chủ đề', '', '', 'A; B; C', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['TN005', 'Số bản sai', '', '', '', '', 'hai', '', ''],
    ]
    const { sach, loi, chuDeMoi } = docBangSach(dongs, ['cổ tích'])
    expect(sach).toHaveLength(1)
    expect(sach[0]).toMatchObject({ dong: 3, ma_sach: 'TN001', nxb: 'Kim Đồng', nam: 2020, khoi_tu: 3, khoi_den: 4, so_ban: 2, chu_de: ['Phiêu lưu', 'Cổ tích'] })
    expect(loi.map(l => l.dong)).toEqual([4, 5, 6, 7, 9])
    expect(loi[1].ly_do).toMatch(/trùng với dòng 3/)
    expect(chuDeMoi).toEqual(['Phiêu lưu'])
  })
  it('đọc cột Số trang, Câu hỏi (xuống dòng hoặc ;)', () => {
    const { sach, loi } = docBangSach([
      ['Mã sách', 'Tên sách', 'Số trang', 'Câu hỏi'],
      ['A1', 'Dế Mèn', 96, 'Vì sao Dế Mèn hối hận?\nCon thích nhân vật nào?'],
      ['A2', 'Không trang', '', 'Câu 1 ; Câu 2;'],
      ['A3', 'Trang sai', 'mười', ''],
      ['A4', 'Trang quá lớn', 5000, ''],
    ])
    expect(sach[0]).toMatchObject({ so_trang: 96, cau_hoi: 'Vì sao Dế Mèn hối hận?\nCon thích nhân vật nào?' })
    expect(sach[1]).toMatchObject({ so_trang: null, cau_hoi: 'Câu 1\nCâu 2' })
    expect(loi.map(l => l.dong)).toEqual([4, 5])
    expect(tachCauHoiExcel(null)).toBe('')
  })
  it('không có tiêu đề → báo lỗi', () => {
    expect(docBangSach([['a', 'b']]).loi[0].ly_do).toMatch(/Mã sách/)
  })
  it('hiển thị khối, mẫu tìm', () => {
    expect(chuKhoi(1, 5)).toBe('Mọi khối')
    expect(chuKhoi(3, 3)).toBe('Khối 3')
    expect(chuKhoi(3, 4)).toBe('Khối 3–4')
    expect(mauTim('  Dế   Mèn, (x)% ')).toBe('de men x')
  })
})
