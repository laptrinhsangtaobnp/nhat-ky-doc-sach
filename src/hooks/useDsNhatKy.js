// Danh sách nhật ký của 1 em (em xem hết; GVCN / nhân viên chỉ thấy lần ghi em cho cô xem — RLS lọc), lọc cảm xúc / chữ,
// "Xem thêm", xoá / bật tắt "Cho cô xem" tại chỗ.
import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { doiChoCoXem, layNhatKy, NHAT_KY_MOI_TRANG, xoaNhatKy } from '../data/nhatKy'
import { loiNhatKy } from '../domain/nhatKy'

export function useDsNhatKy({ hsId, sachId = null }) {
  const [loc, setLoc] = useState({ camXuc: null, tuKhoa: '' })
  const [ds, setDs] = useState([])
  const [trang, setTrang] = useState(0)
  const [conNua, setConNua] = useState(false)
  const [dangTai, setDangTai] = useState(true)
  const lanGoi = useRef(0)

  const tai = useCallback(async trangMoi => {
    if (!hsId) return
    const lan = ++lanGoi.current
    setDangTai(true)
    const { data, error } = await layNhatKy({ hsId, sachId, ...loc, trang: trangMoi })
    if (lan !== lanGoi.current) return
    setDangTai(false)
    if (error) return toast.error('Không tải được nhật ký')
    setDs(cu => (trangMoi === 0 ? data : [...cu, ...data]))
    setTrang(trangMoi)
    setConNua(data.length === NHAT_KY_MOI_TRANG)
  }, [hsId, sachId, loc])

  useEffect(() => {
    const t = setTimeout(() => tai(0), 300)
    return () => clearTimeout(t)
  }, [tai])

  async function xoa(id) {
    try {
      await xoaNhatKy(id)
      setDs(d => d.filter(x => x.id !== id))
      toast.success('Đã xoá')
    } catch (loi) {
      toast.error(loiNhatKy(loi))
    }
  }

  async function doiXem(id, cho) {
    try {
      await doiChoCoXem(id, cho)
      setDs(d => d.map(x => (x.id === id ? { ...x, cho_co_xem: cho } : x)))
      toast.success(cho ? 'Cô sẽ xem được lần ghi này' : 'Chỉ em xem được lần ghi này')
    } catch (loi) {
      toast.error(loiNhatKy(loi))
    }
  }

  return { doiXem, ds, loc, datLoc: t => setLoc(l => ({ ...l, ...t })), dangTai, conNua, xemThem: () => tai(trang + 1), xoa }
}
