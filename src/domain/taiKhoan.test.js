import { describe, it, expect } from 'vitest'
import { boDau, emailDangNhap, goiYTenDangNhap, laNhanVien, loiDangNhap, taoMatKhau, trangChu } from './taiKhoan.js'

describe('taiKhoan', () => {
  it('bỏ dấu tiếng Việt, kể cả đ', () => {
    expect(boDau('Nguyễn Đức Ánh')).toBe('nguyen duc anh')
  })
  it('email đăng nhập', () => {
    expect(emailDangNhap(' AnNV ')).toBe('annv@school.local')
    expect(emailDangNhap('co@gmail.com')).toBe('co@gmail.com')
  })
  it('báo đúng lý do đăng nhập lỗi', () => {
    expect(loiDangNhap({ code: 'invalid_credentials', status: 400 })).toMatch(/Sai tên đăng nhập/)
    expect(loiDangNhap({ status: 429 })).toMatch(/nhiều lần/)
    expect(loiDangNhap({ status: 0 })).toMatch(/kết nối/)
    expect(loiDangNhap({ code: 'la', status: 400 })).toBe('Không đăng nhập được (la).')
  })
  it('gợi ý tên đăng nhập + chống trùng', () => {
    const da = new Set()
    expect(goiYTenDangNhap('Nguyễn Văn An', da)).toBe('annv')
    expect(goiYTenDangNhap('Nông Văn An', da)).toBe('annv2')
    expect(goiYTenDangNhap('Lê Bo', da)).toBe('bol')
    expect(goiYTenDangNhap('Y', da)).toBe('yxx')
    expect(goiYTenDangNhap('  ', da)).toBe(null)
  })
  it('mật khẩu 6 chữ số', () => {
    expect(taoMatKhau(() => 0.55)).toBe('555555')
    expect(taoMatKhau()).toMatch(/^\d{6}$/)
  })
  it('vai trò', () => {
    expect(laNhanVien('thu_thu')).toBe(true)
    expect(laNhanVien('giao_vien')).toBe(false)
    expect(trangChu('hoc_sinh')).toBe('/hoc-sinh')
    expect(trangChu('quan_tri')).toBe('/thu-vien')
    expect(trangChu(undefined)).toBe('/dang-nhap')
  })
})
