import { describe, it, expect } from 'vitest'
import { congNgay, doDai, kiemThuThach, loiEm, loiThuThach, phanTramEm, thuThachMau, tinhTrangThuThach } from './thuThach'

const HN = '2026-11-19'

describe('thử thách lớp', () => {
  it('congNgay, doDai qua tháng / năm', () => {
    expect(congNgay('2026-11-30', 1)).toBe('2026-12-01')
    expect(congNgay('2026-12-31', 1)).toBe('2027-01-01')
    expect(congNgay(HN, -1)).toBe('2026-11-18')
    expect(doDai(HN, HN)).toBe(1)
    expect(doDai('2026-11-01', '2026-11-30')).toBe(30)
  })

  it('mẫu hợp lệ', () => {
    expect(kiemThuThach(thuThachMau(HN), HN)).toBeNull()
    expect(doDai(thuThachMau(HN).tu, thuThachMau(HN).den)).toBe(28)
  })

  it('kiemThuThach bắt lỗi như máy chủ', () => {
    const m = thuThachMau(HN)
    expect(kiemThuThach({ ...m, ten: '  a ' }, HN)).toMatch(/3 đến 80/)
    expect(kiemThuThach({ ...m, den: '2026-11-10' }, HN)).toMatch(/sau ngày bắt đầu/)
    expect(kiemThuThach({ ...m, den: congNgay(HN, 62) }, HN)).toMatch(/62 ngày/)
    expect(kiemThuThach({ ...m, den: congNgay(HN, 61) }, HN)).toBeNull()
    expect(kiemThuThach({ ...m, tu: '2026-11-01', den: '2026-11-18' }, HN)).toMatch(/đã qua/)
    expect(kiemThuThach({ ...m, tu: congNgay(HN, -32) }, HN)).toMatch(/31 ngày/)
    expect(kiemThuThach({ ...m, soNgay: 29 }, HN)).toMatch(/1 đến 28/)
    expect(kiemThuThach({ ...m, soNgay: '2.5' }, HN)).toMatch(/1 đến 28/)
  })

  it('trạng thái và chữ', () => {
    expect(tinhTrangThuThach({ tu: '2026-11-21', den: '2026-12-01' }, HN)).toMatchObject({ trangThai: 'sap', chu: 'Bắt đầu sau 2 ngày nữa' })
    expect(tinhTrangThuThach({ tu: '2026-11-01', den: HN }, HN)).toMatchObject({ trangThai: 'dang', chu: 'Hôm nay là ngày cuối' })
    expect(tinhTrangThuThach({ tu: '2026-11-01', den: '2026-11-24' }, HN).chu).toBe('Còn 5 ngày')
    expect(tinhTrangThuThach({ tu: '2026-11-01', den: '2026-11-18' }, HN).trangThai).toBe('xong')
  })

  it('phần trăm, lời em, lỗi', () => {
    expect(phanTramEm(6, 12)).toBe(50)
    expect(phanTramEm(20, 12)).toBe(100)
    expect(loiEm(12, 12, 'dang')).toMatch(/hoàn thành/)
    expect(loiEm(9, 12, 'dang')).toMatch(/Còn 3 ngày/)
    expect(loiEm(3, 12, 'xong')).toMatch(/Lần sau/)
    expect(loiThuThach({ message: 'dang_co_thu_thach' })).toMatch(/Kết thúc/)
    expect(loiThuThach({ message: 'forbidden' })).toMatch(/quyền/)
  })
})
