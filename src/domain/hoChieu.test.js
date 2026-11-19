import { describe, it, expect } from 'vitest'
import { loiHoChieu, mauTem, tienDoHoChieu } from './hoChieu'

describe('hộ chiếu', () => {
  it('tienDoHoChieu đếm tem đã có', () => {
    expect(tienDoHoChieu([{ ngay: '2026-11-19' }, { ngay: null }, { ngay: null }])).toEqual({ co: 1, tong: 3, conLai: 2 })
    expect(tienDoHoChieu()).toEqual({ co: 0, tong: 0, conLai: 0 })
  })

  it('loiHoChieu theo tiến độ', () => {
    expect(loiHoChieu({ co: 0, tong: 0, conLai: 0 })).toMatch(/chưa có thể loại/)
    expect(loiHoChieu({ co: 0, tong: 8, conLai: 8 })).toMatch(/đầu tiên/)
    expect(loiHoChieu({ co: 3, tong: 8, conLai: 5 })).toMatch('3/8')
    expect(loiHoChieu({ co: 8, tong: 8, conLai: 0 })).toMatch(/đầy tem/)
  })

  it('mauTem xoay vòng', () => {
    expect(mauTem(0)).toBe(mauTem(8))
    expect(mauTem(1)).not.toBe(mauTem(0))
  })
})
