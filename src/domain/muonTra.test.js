import { describe, it, expect } from 'vitest'
import { chuNgay, ngayVN, soNgayDen } from './ngay'
import { boLuotKhoiHang, coBanChoEm, loiMuonTra, moTaChoEm, nhanHan } from './muonTra'

const HOM_NAY = '2026-11-18'

describe('ngày (giờ Việt Nam)', () => {
  it('ngayVN: 23h UTC đã là sáng hôm sau ở VN', () => {
    expect(ngayVN('2026-11-17T18:00:00Z')).toBe('2026-11-18')
    expect(ngayVN('2026-11-17T16:00:00Z')).toBe('2026-11-17')
  })
  it('soNgayDen', () => {
    expect(soNgayDen('2026-11-25', HOM_NAY)).toBe(7)
    expect(soNgayDen('2026-11-18', HOM_NAY)).toBe(0)
    expect(soNgayDen('2026-11-15', HOM_NAY)).toBe(-3)
    expect(soNgayDen('2026-12-02', '2026-11-30')).toBe(2)
  })
  it('chuNgay: cùng năm bỏ năm, khác năm giữ', () => {
    expect(chuNgay('2026-11-25', HOM_NAY)).toBe('25/11')
    expect(chuNgay('2027-01-03', HOM_NAY)).toBe('03/01/2027')
    expect(chuNgay('2026-11-17T18:00:00Z', HOM_NAY)).toBe('18/11')
    expect(chuNgay(null)).toBe('')
  })
})

describe('mượn – trả: chữ hiển thị', () => {
  it('coBanChoEm: thứ tự chờ ≤ số bản trên kệ', () => {
    expect(coBanChoEm({ trang_thai: 'dat_truoc', thu_tu_cho: 1, con_ban: 1 })).toBe(true)
    expect(coBanChoEm({ trang_thai: 'dat_truoc', thu_tu_cho: 2, con_ban: 1 })).toBe(false)
    expect(coBanChoEm({ trang_thai: 'dat_truoc', thu_tu_cho: 1, con_ban: 0 })).toBe(false)
  })

  it('đặt trước: có bản → chờ soạn; hết bản → xếp hàng', () => {
    expect(moTaChoEm({ trang_thai: 'dat_truoc', thu_tu_cho: 1, con_ban: 2 }, HOM_NAY).mau).toBe('xanh')
    const cho = moTaChoEm({ trang_thai: 'dat_truoc', thu_tu_cho: 3, con_ban: 0 }, HOM_NAY)
    expect(cho.tieuDe).toContain('thứ 3')
    expect(cho.mau).toBe('cam')
  })

  it('đã soạn: còn hạn / hôm nay / quá hạn nhận', () => {
    expect(moTaChoEm({ trang_thai: 'da_soan', han_giu: '2026-11-20' }, HOM_NAY).chiTiet).toContain('20/11')
    expect(moTaChoEm({ trang_thai: 'da_soan', han_giu: HOM_NAY }, HOM_NAY).chiTiet).toContain('hôm nay')
    expect(moTaChoEm({ trang_thai: 'da_soan', han_giu: '2026-11-15' }, HOM_NAY).mau).toBe('do')
  })

  it('đang mượn: còn hạn / sắp hạn / quá hạn', () => {
    expect(moTaChoEm({ trang_thai: 'dang_muon', han_tra: '2026-11-25' }, HOM_NAY)).toMatchObject({ mau: 'xanh' })
    expect(moTaChoEm({ trang_thai: 'dang_muon', han_tra: '2026-11-19' }, HOM_NAY).mau).toBe('cam')
    expect(moTaChoEm({ trang_thai: 'dang_muon', han_tra: HOM_NAY }, HOM_NAY).chiTiet).toContain('Hôm nay')
    const qua = moTaChoEm({ trang_thai: 'dang_muon', han_tra: '2026-11-16' }, HOM_NAY)
    expect(qua).toMatchObject({ mau: 'do' })
    expect(qua.chiTiet).toContain('2 ngày')
  })

  it('đã xong: ai huỷ', () => {
    expect(moTaChoEm({ trang_thai: 'huy', ly_do_huy: 'hoc_sinh_huy' }, HOM_NAY).tieuDe).toBe('Em đã huỷ')
    expect(moTaChoEm({ trang_thai: 'huy', ly_do_huy: 'thu_thu_huy' }, HOM_NAY).tieuDe).toBe('Cô đã huỷ')
  })

  it('nhanHan cho nhân viên', () => {
    expect(nhanHan('2026-11-15', HOM_NAY)).toEqual({ chu: 'Quá hạn 3 ngày', mau: 'do' })
    expect(nhanHan(HOM_NAY, HOM_NAY).mau).toBe('cam')
    expect(nhanHan('2026-11-20', HOM_NAY).chu).toBe('Còn 2 ngày (20/11)')
  })

  it('loiMuonTra: mã lỗi máy chủ → câu dễ hiểu', () => {
    expect(loiMuonTra({ message: 'qua_toi_da' })).toContain('tối đa')
    expect(loiMuonTra({ message: 'da_soan_roi' })).toContain('không huỷ')
    expect(loiMuonTra({ code: '23505', message: 'duplicate key' })).toContain('rồi')
    expect(loiMuonTra({ message: 'TypeError: Failed to fetch' })).toContain('mạng')
    expect(loiMuonTra({ code: 'XX000', message: 'lạ' })).toBe('Không làm được, thử lại sau.')
  })
})

describe('boLuotKhoiHang', () => {
  const s1 = { id: 1 }, s2 = { id: 2 }
  const ds = [
    { id: 10, sach: s1, trang_thai: 'dat_truoc', thu_tu_cho: 1, con_ban: 1 },
    { id: 11, sach: s1, trang_thai: 'dat_truoc', thu_tu_cho: 2, con_ban: 1 },
    { id: 12, sach: s2, trang_thai: 'dat_truoc', thu_tu_cho: 1, con_ban: 0 },
  ]
  it('soạn bản cuối → bạn sau lên thứ 1 nhưng hết bản', () => {
    const moi = boLuotKhoiHang(ds, ds[0], true)
    expect(moi.map(l => l.id)).toEqual([11, 12])
    expect(moi[0]).toMatchObject({ thu_tu_cho: 1, con_ban: 0 })
    expect(moi[1]).toBe(ds[2])
  })
  it('huỷ → bạn sau lên thứ 1, vẫn còn bản', () => {
    expect(boLuotKhoiHang(ds, ds[0], false)[0]).toMatchObject({ thu_tu_cho: 1, con_ban: 1 })
  })
})
