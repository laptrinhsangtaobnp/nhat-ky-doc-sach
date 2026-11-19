// Phiếu đăng nhập in cho từng em (cắt rời): tên, lớp, mã lớp, PIN, mã QR mở thẳng trang đăng nhập có sẵn mã lớp.
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export const linkLop = ma => `${window.location.origin}/dang-nhap?lop=${ma}`

export function MaQr({ ma, co = 120 }) {
  const [anh, setAnh] = useState(null)
  useEffect(() => { QRCode.toDataURL(linkLop(ma), { margin: 1, width: co * 2 }).then(setAnh, () => setAnh(null)) }, [ma, co])
  return anh ? <img src={anh} alt={`Mã QR vào lớp, mã ${ma}`} width={co} height={co} /> : <div style={{ width: co, height: co }} />
}

export default function PhieuDangNhap({ tenLop, ma, ds }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-2 print:gap-2">
      {ds.map(h => (
        <div key={h.id} className="flex break-inside-avoid gap-3 rounded-xl border-2 border-dashed border-stone-300 bg-white p-3">
          <MaQr ma={ma} co={96} />
          <div className="min-w-0 space-y-0.5 text-sm">
            <p className="font-bold">📖 Nhật ký đọc sách</p>
            <p className="text-base font-semibold">{h.ho_ten}</p>
            <p>Lớp <b>{tenLop}</b> · Mã lớp: <b className="font-mono text-base tracking-wider">{ma}</b></p>
            <p>PIN của em: <b className="font-mono text-xl tracking-widest">{h.pin}</b></p>
            <p className="text-xs text-stone-500">Quét mã QR → chọn tên → nhập PIN. Giữ PIN bí mật nhé!</p>
          </div>
        </div>
      ))}
    </div>
  )
}
