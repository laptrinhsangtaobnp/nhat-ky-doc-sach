import { describe, it, expect } from 'vitest'
import { camXuc, camXucNhieuNhat, chuChuoi, chuThang, conSuaDuoc, demChu, duDaiTinhChuoi, loiNhac, loiNhatKy } from './nhatKy'

const HOM_NAY = '2026-11-18'

describe('nhật ký', () => {
  it('demChu đếm từ, bỏ khoảng trắng thừa', () => {
    expect(demChu('  Dế Mèn  rất   dũng cảm ')).toBe(5)
    expect(demChu('')).toBe(0)
    expect(demChu(null)).toBe(0)
  })

  it('duDaiTinhChuoi: một trong hai ô đủ dài', () => {
    const dai = Array(20).fill('chữ').join(' ')
    expect(duDaiTinhChuoi(dai, '', 20)).toBe(true)
    expect(duDaiTinhChuoi('ngắn', dai, 20)).toBe(true)
    expect(duDaiTinhChuoi('ngắn', 'cũng ngắn', 20)).toBe(false)
  })

  it('conSuaDuoc: trong 7 ngày', () => {
    expect(conSuaDuoc('2026-11-11', HOM_NAY)).toBe(true)
    expect(conSuaDuoc('2026-11-10', HOM_NAY)).toBe(false)
  })

  it('loiNhac: chưa ghi / lâu chưa ghi / mới ghi', () => {
    expect(loiNhac(null, HOM_NAY)).toContain('chưa ghi')
    expect(loiNhac('2026-11-13', HOM_NAY)).toContain('5 ngày')
    expect(loiNhac('2026-11-17', HOM_NAY)).toBeNull()
  })

  it('chuChuoi', () => {
    expect(chuChuoi({ tuan_nay: 1, can: 3, chuoi: 0 })).toEqual({ tuan: 'Tuần này em ghi 1/3 lần, còn 2 lần nữa.', chuoi: 'Bắt đầu chuỗi tuần đầu tiên nào!' })
    expect(chuChuoi({ tuan_nay: 4, can: 3, chuoi: 5 }).tuan).toContain('đã đủ')
    expect(chuChuoi({ tuan_nay: 4, can: 3, chuoi: 5 }).chuoi).toBe('Chuỗi 5 tuần 🔥')
  })

  it('camXucNhieuNhat, chuThang, camXuc lạ', () => {
    expect(camXucNhieuNhat({ vui: 2, hoi_hop: 5 }).ma).toBe('hoi_hop')
    expect(camXucNhieuNhat({})).toBeNull()
    expect(chuThang('2026-09')).toBe('T9')
    expect(camXuc('la').hinh).toBe('📖')
  })

  it('loiNhatKy', () => {
    expect(loiNhatKy({ message: 'chua_ghi_nhat_ky' })).toContain('ít nhất 1 lần')
    expect(loiNhatKy({ message: 'het_han_sua' })).toContain('7 ngày')
    expect(loiNhatKy({ message: 'Failed to fetch' })).toContain('mạng')
  })
})
