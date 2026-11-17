import { describe, it, expect } from 'vitest'
import { chuanHoaLop, csvTaiKhoan, docBangHocSinh, ganTenDangNhap } from './nhapHocSinh.js'

describe('nhapHocSinh', () => {
  it('chuẩn hoá lớp', () => {
    expect(chuanHoaLop(' 4 a ')).toBe('4A')
    expect(chuanHoaLop('Lớp 3b')).toBe('3B')
    expect(chuanHoaLop('6A')).toBe(null)
    expect(chuanHoaLop('')).toBe(null)
  })

  it('tìm dòng tiêu đề, bỏ dòng trống, báo lỗi theo số dòng Excel', () => {
    const bang = [
      ['DANH SÁCH HỌC SINH'],
      [],
      ['STT', 'Họ và tên', 'Lớp', 'Ghi chú'],
      [1, 'Nguyễn Văn An', '4a', ''],
      [2, '', '4A'],
      [],
      [3, 'Trần Thị Bình', '7C'],
    ]
    const { hocSinh, loi } = docBangHocSinh(bang)
    expect(hocSinh).toEqual([{ dong: 4, ho_ten: 'Nguyễn Văn An', lop: '4A', khoi: 4, ten_dang_nhap: '', mat_khau: '' }])
    expect(loi.map(l => l.dong)).toEqual([5, 7])
  })

  it('ghép 2 cột Họ + Tên, đọc cột tên đăng nhập', () => {
    const { hocSinh } = docBangHocSinh([['Họ đệm', 'Tên', 'Lớp', 'Tên đăng nhập'], ['Lê Thị', 'Hoa', '3B', 'HoaLT']])
    expect(hocSinh[0]).toMatchObject({ ho_ten: 'Lê Thị Hoa', lop: '3B', ten_dang_nhap: 'hoalt' })
  })

  it('không có tiêu đề → báo lỗi', () => {
    expect(docBangHocSinh([['a', 'b']]).loi).toHaveLength(1)
  })

  it('điền tên đăng nhập, tránh trùng với tài khoản đã có, báo trùng trong tệp', () => {
    const hs = [
      { dong: 2, ho_ten: 'Nguyễn Văn An', lop: '4A', ten_dang_nhap: '', mat_khau: '' },
      { dong: 3, ho_ten: 'Bé', lop: '4A', ten_dang_nhap: 'be01', mat_khau: '123456' },
      { dong: 4, ho_ten: 'Bé Hai', lop: '4A', ten_dang_nhap: 'be01', mat_khau: '' },
    ]
    const { hocSinh, loi } = ganTenDangNhap(hs, new Set(['annv']), () => 0.1)
    expect(hocSinh.map(h => h.ten_dang_nhap)).toEqual(['annv2', 'be01'])
    expect(hocSinh[0].mat_khau).toBe('111111')
    expect(hocSinh[1].mat_khau).toBe('123456')
    expect(loi).toEqual([{ dong: 4, ly_do: 'Tên đăng nhập "be01" bị trùng' }])
  })

  it('CSV có BOM và thoát dấu ngoặc kép', () => {
    const s = csvTaiKhoan([{ lop: '4A', ho_ten: 'An "Bé"', ten_dang_nhap: 'annv', mat_khau: '123456' }])
    expect(s.startsWith('﻿"Lớp"')).toBe(true)
    expect(s).toContain('"An ""Bé"""')
  })
})
