import { describe, it, expect } from 'vitest'
import { boCon, chuanMaLop, loiPin, MA_LOP_HOP_LE, themCon, TOI_DA_CON } from './dangNhapPin'

describe('đăng nhập PIN', () => {
  it('chuanMaLop: viết hoa, bỏ khoảng trắng / gạch, tối đa 6', () => {
    expect(chuanMaLop(' k7m-2qx ')).toBe('K7M2QX')
    expect(chuanMaLop('abcdefgh')).toBe('ABCDEF')
    expect(chuanMaLop(null)).toBe('')
    expect(MA_LOP_HOP_LE.test('K7M2QX')).toBe(true)
    expect(MA_LOP_HOP_LE.test('K0M2QX')).toBe(false)    // không có số 0 trong mã
  })

  it('loiPin', () => {
    expect(loiPin({ loi: 'sai', con: 2 })).toContain('còn 2 lần')
    expect(loiPin({ loi: 'khoa', den: '2026-11-19T03:15:00Z' }, '2026-11-19')).toContain('10:15')
    expect(loiPin({ loi: 'khoa', den: '2026-11-19T17:00:00Z' }, '2026-11-19')).toContain('00:00')
    expect(loiPin({ loi: 'lop_khoa' })).toContain('tạm khoá')
    expect(loiPin({ loi: 'ma_sai' })).toContain('mã lớp')
    expect(loiPin({})).toContain('thử lại')
  })

  it('themCon / boCon: không trùng, mới nhất lên đầu, có giới hạn', () => {
    let ds = themCon([], { id: 'a', ten: 'Lan N.' })
    ds = themCon(ds, { id: 'b', ten: 'Minh T.' })
    ds = themCon(ds, { id: 'a', ten: 'Lan N.' })
    expect(ds.map(c => c.id)).toEqual(['a', 'b'])
    for (let i = 0; i < 10; i++) ds = themCon(ds, { id: `x${i}` })
    expect(ds).toHaveLength(TOI_DA_CON)
    expect(boCon(ds, 'x9').some(c => c.id === 'x9')).toBe(false)
  })
})
