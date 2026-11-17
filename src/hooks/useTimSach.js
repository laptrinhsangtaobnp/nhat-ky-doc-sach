// Tải + thao tác trang Tìm sách: chủ đề, kết quả tìm (30 cuốn / lần, "Xem thêm" nối tiếp), cập nhật tại chỗ sau khi sửa.
import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { layChuDe } from '../data/chuDe'
import { SACH_MOI_TRANG, timSach } from '../data/sach'

export function useTimSach() {
  const [chuDe, setChuDe] = useState([])
  const [loc, setLoc] = useState({ tuKhoa: '', chuDeId: null, khoi: null })
  const [ds, setDs] = useState([])
  const [tong, setTong] = useState(0)
  const [trang, setTrang] = useState(0)
  const [dangTai, setDangTai] = useState(true)
  const lanGoi = useRef(0)                        // bỏ kết quả cũ nếu người dùng đã gõ tiếp

  const taiChuDe = useCallback(() => layChuDe().then(({ data, error }) => {
    if (error) return toast.error('Không tải được chủ đề')
    setChuDe(data)
  }), [])

  const tai = useCallback(async (trangMoi) => {
    const lan = ++lanGoi.current
    setDangTai(true)
    const { data, count, error } = await timSach({ ...loc, trang: trangMoi })
    if (lan !== lanGoi.current) return
    setDangTai(false)
    if (error) return toast.error('Không tải được danh sách sách')
    setDs(cu => (trangMoi === 0 ? data : [...cu, ...data]))
    setTong(count ?? 0)
    setTrang(trangMoi)
  }, [loc])

  useEffect(() => { taiChuDe() }, [taiChuDe])
  useEffect(() => {
    const t = setTimeout(() => tai(0), 300)      // chờ gõ xong ô tìm
    return () => clearTimeout(t)
  }, [tai])

  return {
    chuDe, loc, ds, tong, dangTai,
    datLoc: thayDoi => setLoc(l => ({ ...l, ...thayDoi })),
    conNua: ds.length < tong,
    xemThem: () => tai(trang + 1),
    taiLai: () => { taiChuDe(); tai(0) },
    taiChuDe,
    capNhat: sach => setDs(d => d.map(s => (s.id === sach.id ? { ...s, ...sach } : s))),
    boKhoiDs: id => { setDs(d => d.filter(s => s.id !== id)); setTong(t => t - 1) },
    MOI_TRANG: SACH_MOI_TRANG,
  }
}
