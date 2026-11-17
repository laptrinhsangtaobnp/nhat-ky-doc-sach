import { it, expect } from 'vitest'
import { namHocHienTai } from './namHoc.js'

it('năm học đổi từ tháng 8', () => {
  expect(namHocHienTai(new Date(2026, 10, 17))).toBe('2026-2027')
  expect(namHocHienTai(new Date(2027, 2, 1))).toBe('2026-2027')
  expect(namHocHienTai(new Date(2027, 7, 1))).toBe('2027-2028')
})
