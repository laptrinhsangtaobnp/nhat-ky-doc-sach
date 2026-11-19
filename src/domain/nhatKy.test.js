import { describe, it, expect } from 'vitest'
import {
  camXuc, camXucNhieuNhat, cauHoiHomNay, cauTroChuyen, CAU_GOI_Y, CAU_TRO_CHUYEN, chuCay, chuThang, conSuaDuoc, demChu, duDaiTinhChuoi,
  giaiDoanCay, loiNhac, loiNhatKy, tachCauHoi, trangToiDa, viTriHanhTrinh,
} from './nhatKy'

const HOM_NAY = '2026-11-18'

describe('nhật ký', () => {
  it('demChu đếm từ, bỏ khoảng trắng thừa', () => {
    expect(demChu('  Dế Mèn  rất   dũng cảm ')).toBe(5)
    expect(demChu('')).toBe(0)
    expect(demChu(null)).toBe(0)
  })

  it('duDaiTinhChuoi: một trong hai ô đủ dài (ngưỡng do máy chủ gửi)', () => {
    expect(duDaiTinhChuoi('Dế Mèn dũng cảm', '', 3)).toBe(true)
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

  it('giaiDoanCay: lớn theo số ngày, không lùi, có phần trăm tới giai đoạn kế', () => {
    expect(giaiDoanCay(0)).toMatchObject({ ten: 'Hạt mầm', conLai: 1, phanTram: 0 })
    expect(giaiDoanCay(5)).toMatchObject({ ten: 'Cây con', conLai: 2, phanTram: 50 })
    expect(giaiDoanCay(7).ten).toBe('Cây nhỏ')
    expect(giaiDoanCay(150)).toMatchObject({ sau: null, conLai: 0, phanTram: 100 })
    expect(giaiDoanCay(-3).ten).toBe('Hạt mầm')
  })

  it('chuCay', () => {
    expect(chuCay({ hom_nay: true, tuan_nay: 2 })).toEqual({ homNay: 'Hôm nay em đã tưới cây rồi 💧', tuan: 'Tuần này em ghi 2 ngày.' })
    expect(chuCay({ hom_nay: false, tuan_nay: 0 }).homNay).toContain('Ghi nhật ký hôm nay')
  })

  it('câu gợi ý đổi theo ngày, cùng ngày cùng câu, "Câu khác" đổi câu', () => {
    expect(cauHoiHomNay(HOM_NAY)).toBe(cauHoiHomNay(HOM_NAY))
    expect(cauHoiHomNay('2026-11-19')).not.toBe(cauHoiHomNay(HOM_NAY))
    expect(cauHoiHomNay(HOM_NAY, 1)).toBe(cauHoiHomNay('2026-11-19'))
    expect(CAU_GOI_Y).toContain(cauHoiHomNay('2030-01-01', 5))
  })

  it('5 phút trò chuyện: câu theo sách trước (tối đa 2), câu chung bù đủ 3', () => {
    expect(tachCauHoi(' Câu 1 \n\n Câu 2\n')).toEqual(['Câu 1', 'Câu 2'])
    const c = cauTroChuyen(HOM_NAY, 'Vì sao Dế Mèn hối hận?\nEm học được gì?\nCâu ba?')
    expect(c).toHaveLength(3)
    expect(c.slice(0, 2).every(x => !CAU_TRO_CHUYEN.includes(x))).toBe(true)
    expect(CAU_TRO_CHUYEN).toContain(c[2])
    expect(cauTroChuyen(HOM_NAY, null).every(x => CAU_TRO_CHUYEN.includes(x))).toBe(true)
  })

  it('viTriHanhTrinh: theo trang nếu có, không thì theo thứ tự', () => {
    expect(viTriHanhTrinh([{ trang: 50, cam_xuc: 'vui' }, { trang: 100, cam_xuc: 'buon' }], 200).map(x => x.viTri)).toEqual([25, 50])
    expect(viTriHanhTrinh([{ trang: 30 }, { trang: 60 }], null).map(x => x.viTri)).toEqual([50, 100])
    expect(viTriHanhTrinh([{ trang: null }, { trang: null }, { trang: null }], null).map(x => x.viTri)).toEqual([0, 50, 100])
    expect(viTriHanhTrinh([{ trang: null }], null)[0].viTri).toBe(50)
    expect(viTriHanhTrinh(null, 100)).toEqual([])
  })

  it('trangToiDa', () => {
    expect(trangToiDa(120, 80)).toBe(120)
    expect(trangToiDa(null, null)).toBe(200)
    expect(trangToiDa(null, 230)).toBe(300)
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
    expect(loiNhatKy({ message: 'chua_den_ngay' })).toContain('chưa đến ngày')
    expect(loiNhatKy({ message: 'Failed to fetch' })).toContain('mạng')
  })
})
