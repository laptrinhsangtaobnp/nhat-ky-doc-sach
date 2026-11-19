import { describe, it, expect, vi } from 'vitest'
import { fetchGoiLai } from './goiLai'

const tra = (ok, chu) => ({ ok, clone: () => ({ text: async () => chu }) })

describe('fetchGoiLai', () => {
  it('gọi lại khi máy chủ báo chua_nhan_dien, dừng khi thành công', async () => {
    const goc = vi.fn()
      .mockResolvedValueOnce(tra(false, '{"message":"chua_nhan_dien"}'))
      .mockResolvedValueOnce(tra(false, '{"message":"chua_nhan_dien"}'))
      .mockResolvedValueOnce(tra(true, '[]'))
    const r = await fetchGoiLai(goc, { cho: 1 })('u', { body: 'x' })
    expect(r.ok).toBe(true)
    expect(goc).toHaveBeenCalledTimes(3)
    expect(goc).toHaveBeenLastCalledWith('u', { body: 'x' })
  })

  it('lỗi khác (vd forbidden) không gọi lại', async () => {
    const goc = vi.fn().mockResolvedValue(tra(false, '{"message":"forbidden"}'))
    const r = await fetchGoiLai(goc, { cho: 1 })('u')
    expect(r.ok).toBe(false)
    expect(goc).toHaveBeenCalledTimes(1)
  })

  it('có giới hạn số lần', async () => {
    const goc = vi.fn().mockResolvedValue(tra(false, 'chua_nhan_dien'))
    await fetchGoiLai(goc, { soLan: 3, cho: 1 })('u')
    expect(goc).toHaveBeenCalledTimes(3)
  })
})
