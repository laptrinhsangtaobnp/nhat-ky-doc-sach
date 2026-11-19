// Trang Thống kê: bộ lọc (khoảng ngày, phạm vi, lớp) → số liệu máy chủ tính; số "Trước / Sau" đã nhập; lưu 1 chỉ số tại chỗ.
import { useCallback, useEffect, useState } from 'react'
import { layThongKe, laySoLieuSangKien, luuSoLieu } from '../data/thongKe'
import { khoangMacDinh, kiemKhoang } from '../domain/thongKe'
import { ngayVN } from '../domain/ngay'

export function useThongKe() {
  const [loc, setLoc] = useState(() => ({ ...khoangMacDinh(ngayVN()), phamVi: 'thi_diem', lopId: null }))
  const [tk, setTk] = useState(undefined)          // undefined = đang tải, null = lỗi
  const [loiTai, setLoiTai] = useState(null)
  const [soLieu, setSoLieu] = useState([])

  const xem = useCallback(async (l = loc) => {
    const sai = kiemKhoang(l.tu, l.den) ?? (l.phamVi === 'lop' && !l.lopId ? 'Chọn lớp cần xem.' : null)
    if (sai) { setLoiTai(sai); return }
    setTk(undefined); setLoiTai(null)
    try { setTk(await layThongKe(l)) } catch (e) { setTk(null); setLoiTai(e) }
  }, [loc])

  useEffect(() => {
    let huy = false
    layThongKe(loc).then(d => { if (!huy) setTk(d) }, e => { if (!huy) { setTk(null); setLoiTai(e) } })
    laySoLieuSangKien().then(d => { if (!huy) setSoLieu(d ?? []) }, () => {})
    return () => { huy = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- chỉ tải lần đầu; sau đó bấm "Xem"

  /** Lưu 1 chỉ số rồi cập nhật tại chỗ (không tải lại cả trang). Ném lỗi để giao diện báo. */
  async function luu(chiSo, gt) {
    await luuSoLieu(chiSo, gt)
    setSoLieu(ds => [...ds.filter(x => x.chi_so !== chiSo),
      { chi_so: chiSo, truoc: gt.truoc, nguon_truoc: gt.nguonTruoc || null, sau: gt.sau, nguon_sau: gt.nguonSau || null }])
  }

  return { loc, setLoc, tk, loiTai, xem, soLieu, luu }
}
