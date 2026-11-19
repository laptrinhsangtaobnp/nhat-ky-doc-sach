// Trang Mã lớp & PIN: tải mã lớp + tình trạng PIN, tạo PIN cho em chưa có, đặt lại PIN 1 em, đổi mã lớp.
// PIN rõ chỉ có trong bộ nhớ trang (vừa tạo) để in phiếu — máy chủ chỉ giữ bản băm.
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { doiMaLop, layMaLop, layTinhTrangPin, taoPin } from '../data/pin'

export function usePinLop(lopId) {
  const [ma, setMa] = useState(null)
  const [ds, setDs] = useState(null)               // [{ id, ho_ten, co_pin, bi_khoa }]
  const [pinMoi, setPinMoi] = useState({})         // { [id]: pin } vừa tạo trong lần mở trang này
  const [dangLam, setDangLam] = useState(false)

  const tai = useCallback(() => {
    if (!lopId) return
    Promise.all([layMaLop(lopId), layTinhTrangPin(lopId)]).then(([m, d]) => { setMa(m); setDs(d) },
      () => { setDs([]); toast.error('Không tải được (không có quyền hoặc lỗi mạng)') })
  }, [lopId])
  useEffect(() => { tai() }, [tai])

  async function lam(viec, thanhCong) {
    setDangLam(true)
    try {
      thanhCong(await viec())
    } catch {
      toast.error('Chưa làm được, thử lại nhé')
    } finally {
      setDangLam(false)
    }
  }

  const nhanPin = kq => {
    setPinMoi(p => ({ ...p, ...Object.fromEntries(kq.map(x => [x.id, x.pin])) }))
    setDs(d => d.map(h => (kq.some(x => x.id === h.id) ? { ...h, co_pin: true, bi_khoa: false } : h)))
  }

  return {
    ma, ds, pinMoi, dangLam,
    taoChoEmChuaCo: () => lam(() => taoPin(lopId), kq => { nhanPin(kq); toast.success(`Đã tạo PIN cho ${kq.length} em — in phiếu ngay nhé`) }),
    datLai: hsId => lam(() => taoPin(lopId, hsId), kq => { nhanPin(kq); toast.success('Đã đặt PIN mới') }),
    doiMa: () => lam(() => doiMaLop(lopId), m => { setMa(m); toast.success('Đã đổi mã lớp. Phiếu cũ không dùng được nữa.') }),
  }
}
