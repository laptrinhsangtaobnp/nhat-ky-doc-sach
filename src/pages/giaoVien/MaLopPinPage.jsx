// Mã lớp & PIN (GVCN: lớp mình; nhân viên: lớp chọn qua ?lop=ID). Hiện mã lớp + QR, đổi mã lớp, tình trạng PIN từng em,
// tạo PIN cho em chưa có / đặt lại PIN 1 em, in phiếu cho các em vừa có PIN. Máy chủ kiểm quyền (quan_ly_lop).
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePinLop } from '../../hooks/usePinLop'
import { laNhanVien } from '../../domain/taiKhoan'
import PhieuDangNhap, { MaQr, linkLop } from '../../components/dangNhap/PhieuDangNhap'

export default function MaLopPinPage() {
  const { hoSo } = useAuth()
  const [tim] = useSearchParams()
  const dieuHuong = useNavigate()
  const lopId = laNhanVien(hoSo?.vai_tro) ? Number(tim.get('lop')) || null : hoSo?.lop_id
  const tenLop = tim.get('ten') ?? ''
  const p = usePinLop(lopId)
  const [inPhieu, setInPhieu] = useState(false)

  if (!lopId) return <p className="rounded-xl bg-white p-6 text-center">Chưa chọn lớp (hoặc thầy cô chưa được gắn lớp chủ nhiệm).</p>
  if (!p.ds) return <p className="text-stone-500" role="status">Đang tải…</p>

  const chuaCo = p.ds.filter(h => !h.co_pin).length
  const coPinMoi = p.ds.filter(h => p.pinMoi[h.id]).map(h => ({ ...h, pin: p.pinMoi[h.id] }))

  if (inPhieu) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button onClick={() => setInPhieu(false)} className="mr-auto flex items-center gap-1 text-sm text-stone-600"><ArrowLeft size={16} aria-hidden /> Quay lại</button>
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white"><Printer size={18} aria-hidden /> In phiếu</button>
        </div>
        <p className="text-sm text-stone-600 print:hidden">PIN chỉ hiện lúc vừa tạo. Rời trang này thì không xem lại được — muốn in lại phải đặt PIN mới.</p>
        <PhieuDangNhap tenLop={tenLop} ma={p.ma} ds={coPinMoi} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <button onClick={() => dieuHuong(-1)} className="flex items-center gap-1 text-sm text-stone-600"><ArrowLeft size={16} aria-hidden /> Quay lại</button>
      <h1 className="text-2xl font-bold">🔑 Mã lớp & PIN {tenLop && `— ${tenLop}`}</h1>

      <section className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
        <MaQr ma={p.ma} co={120} />
        <div className="min-w-0 flex-1 space-y-2">
          <p>Mã lớp: <b className="font-mono text-3xl tracking-widest">{p.ma}</b></p>
          <p className="break-all text-sm text-stone-500">{linkLop(p.ma)}</p>
          <button disabled={p.dangLam} onClick={() => confirm('Đổi mã lớp? Mã và QR cũ sẽ không dùng được nữa (PIN của các em giữ nguyên).') && p.doiMa()}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm">Đổi mã lớp (khi bị lộ / cả lớp bị khoá)</button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto">{p.ds.length} học sinh · {chuaCo > 0 ? <b className="text-rose-700">{chuaCo} em chưa có PIN</b> : 'em nào cũng có PIN'}</p>
          {chuaCo > 0 && <button disabled={p.dangLam} onClick={p.taoChoEmChuaCo} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50">Tạo PIN cho {chuaCo} em</button>}
          {coPinMoi.length > 0 && <button onClick={() => setInPhieu(true)} className="flex items-center gap-2 rounded-lg border border-emerald-600 px-4 py-2 font-semibold text-emerald-700"><Printer size={18} aria-hidden /> In phiếu ({coPinMoi.length})</button>}
        </div>
        <ul className="divide-y divide-stone-100 rounded-xl bg-white shadow-sm">
          {p.ds.map(h => (
            <li key={h.id} className="flex flex-wrap items-center gap-2 p-3">
              <span className="mr-auto font-medium">{h.ho_ten}</span>
              {p.pinMoi[h.id] ? <span className="font-mono text-lg font-bold tracking-widest text-emerald-700">{p.pinMoi[h.id]}</span>
                : h.bi_khoa ? <span className="text-sm text-rose-700">đang bị khoá (nhập sai nhiều)</span>
                : <span className="text-sm text-stone-500">{h.co_pin ? 'đã có PIN' : 'chưa có PIN'}</span>}
              {h.co_pin && <button disabled={p.dangLam} onClick={() => confirm(`Đặt PIN mới cho ${h.ho_ten}? PIN cũ hết dùng được.`) && p.datLai(h.id)}
                className="text-sm text-emerald-700 underline">Đặt PIN mới</button>}
            </li>
          ))}
        </ul>
        <p className="text-sm text-stone-500">Em quên PIN hoặc bị khoá: bấm “Đặt PIN mới” rồi in / đọc PIN cho em. PIN chỉ hiện ngay lúc tạo.
          Các em báo "lớp tạm khoá đăng nhập" (có người nhập sai rất nhiều lần): bấm “Đổi mã lớp” rồi phát mã mới — lớp mở khoá ngay.</p>
      </section>
    </div>
  )
}
