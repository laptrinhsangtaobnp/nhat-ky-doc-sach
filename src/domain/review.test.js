import { describe, it, expect } from 'vitest'
import { chuDaDoc, kiemReview, loiReview, tenNguoiViet } from './review'

describe('review', () => {
  it('kiemReview: 10–300 ký tự sau khi bỏ khoảng trắng', () => {
    expect(kiemReview('   ngắn   ')).toMatch(/ít nhất/)
    expect(kiemReview('Sách hay lắm các bạn ơi')).toBeNull()
    expect(kiemReview('a'.repeat(301))).toMatch(/dài quá/)
    expect(kiemReview(null)).toMatch(/ít nhất/)
  })

  it('tenNguoiViet: có tên / ẩn tên / không lớp', () => {
    expect(tenNguoiViet({ ten: 'Lan N.T.', lop: '3A' })).toBe('Lan N.T. – lớp 3A')
    expect(tenNguoiViet({ ten: null, lop: '3A' })).toBe('Một bạn lớp 3A')
    expect(tenNguoiViet({ ten: null, lop: null })).toBe('Một bạn')
  })

  it('chuDaDoc: chỉ con số', () => {
    expect(chuDaDoc({ da_doc: 0 })).toBe('')
    expect(chuDaDoc({ da_doc: 12, cung_lop: 5, lop: '3A' })).toBe('12 bạn đã đọc · 5 bạn lớp 3A')
    expect(chuDaDoc({ da_doc: 12, cung_lop: 0, lop: '3A' })).toBe('12 bạn đã đọc')
  })

  it('loiReview dịch mã lỗi máy chủ', () => {
    expect(loiReview({ message: 'chua_doc_xong' })).toMatch(/đọc xong/)
    expect(loiReview({ message: 'da_thay_doi' })).toMatch(/Làm mới/)
    expect(loiReview({ message: 'Failed to fetch' })).toMatch(/mạng/)
  })
})
