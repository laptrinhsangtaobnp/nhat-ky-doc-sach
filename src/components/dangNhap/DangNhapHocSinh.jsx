// Học sinh vào app: (máy đã nhớ em → bấm tên) hoặc nhập mã lớp (QR điền sẵn) → chọn tên → PIN 4 số.
// Máy chỉ nhớ tên rút gọn + mã lớp để anh chị em dùng chung điện thoại bố mẹ chọn nhanh; PIN luôn phải nhập.
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { dangNhapPin, layTenTheoMaLop } from '../../data/dangNhap'
import { docConDaLuu, ghiConDaLuu } from '../../lib/conDaLuu'
import { boCon, chuanMaLop, loiPin, MA_LOP_HOP_LE, themCon } from '../../domain/dangNhapPin'
import { ngayVN } from '../../domain/ngay'
import BanPhimPin from './BanPhimPin'

const NUT = 'w-full rounded-2xl bg-emerald-600 py-3.5 text-lg font-semibold text-white hover:bg-emerald-700 disabled:opacity-50'

export default function DangNhapHocSinh({ maTuQr }) {
  const [daLuu, setDaLuu] = useState(docConDaLuu)
  const [buoc, setBuoc] = useState(maTuQr ? 'ma' : daLuu.length ? 'chon_con' : 'ma')
  const [ma, setMa] = useState(chuanMaLop(maTuQr))
  const [lop, setLop] = useState(null)               // { lop, hoc_sinh }
  const [em, setEm] = useState(null)                 // { id, ten, lop, ma }
  const [pin, setPin] = useState('')
  const [dangGui, setDangGui] = useState(() => MA_LOP_HOP_LE.test(chuanMaLop(maTuQr)))   // QR → đang tìm lớp
  const [baoLoi, setBaoLoi] = useState('')

  async function timLop(maNhap = ma) {
    if (!MA_LOP_HOP_LE.test(maNhap)) return setBaoLoi('Mã lớp có 6 chữ / số, em xem lại phiếu nhé.')
    setDangGui(true); setBaoLoi('')
    try {
      const kq = await layTenTheoMaLop(maNhap)
      if (kq?.loi) return setBaoLoi(loiPin(kq))
      setLop(kq); setBuoc('chon_ten')
    } catch {
      setBaoLoi('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
    } finally {
      setDangGui(false)
    }
  }

  // Quét QR (có ?lop=) → tự tìm lớp luôn
  useEffect(() => {
    const m = chuanMaLop(maTuQr)
    if (!MA_LOP_HOP_LE.test(m)) return
    let huy = false
    layTenTheoMaLop(m).then(kq => {
      if (huy) return
      if (kq?.loi) setBaoLoi(loiPin(kq))
      else { setLop(kq); setBuoc('chon_ten') }
    }, () => { if (!huy) setBaoLoi('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.') }).finally(() => { if (!huy) setDangGui(false) })
    return () => { huy = true }
  }, [maTuQr])

  function chonEm(e) { setEm(e); setPin(''); setBaoLoi(''); setBuoc('pin') }

  async function gui(pinDu) {
    setDangGui(true); setBaoLoi('')
    try {
      const loi = await dangNhapPin(em.ma, em.id, pinDu)
      if (loi) { setBaoLoi(loiPin(loi, ngayVN())); setPin(''); return }
      const ds = themCon(daLuu, em)
      ghiConDaLuu(ds); setDaLuu(ds)
    } catch {
      setPin('')
      toast.error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
    } finally {
      setDangGui(false)
    }
  }

  function quen(id) {
    const ds = boCon(daLuu, id)
    ghiConDaLuu(ds); setDaLuu(ds)
    if (!ds.length) setBuoc('ma')
  }

  if (buoc === 'chon_con') {
    return (
      <div className="space-y-3">
        <p className="text-center text-lg font-semibold">Ai đang đọc sách?</p>
        <ul className="space-y-2">
          {daLuu.map(c => (
            <li key={c.id} className="flex items-center gap-2">
              <button type="button" onClick={() => chonEm(c)} className="flex-1 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-lg font-semibold hover:bg-emerald-100">
                📖 {c.ten} <span className="text-sm font-normal text-stone-500">· lớp {c.lop}</span>
              </button>
              <button type="button" onClick={() => confirm(`Bỏ ${c.ten} khỏi máy này?`) && quen(c.id)} aria-label={`Bỏ ${c.ten} khỏi máy này`} className="px-2 text-stone-400">✕</button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => { setBuoc('ma'); setBaoLoi('') }} className="w-full rounded-2xl border border-stone-300 py-3 font-semibold">＋ Bạn khác (nhập mã lớp)</button>
      </div>
    )
  }

  if (buoc === 'chon_ten') {
    return (
      <div className="space-y-3">
        <p className="text-center text-lg font-semibold">Lớp {lop.lop} — em là ai?</p>
        {lop.hoc_sinh.length === 0 && <p className="text-center text-stone-600">Lớp chưa có bạn nào có PIN. Em hỏi cô giáo nhé.</p>}
        <div className="grid grid-cols-2 gap-2">
          {lop.hoc_sinh.map(h => (
            <button key={h.id} type="button" onClick={() => chonEm({ id: h.id, ten: h.ten, lop: lop.lop, ma })}
              className="rounded-2xl border-2 border-stone-200 bg-white px-3 py-3 text-lg font-semibold hover:border-emerald-400">{h.ten}</button>
          ))}
        </div>
        <button type="button" onClick={() => setBuoc('ma')} className="w-full text-sm text-stone-500 underline">← Nhập mã lớp khác</button>
      </div>
    )
  }

  if (buoc === 'pin') {
    return (
      <div className="space-y-4">
        <p className="text-center text-lg">Chào <b>{em.ten}</b>! Nhập PIN 4 số của em</p>
        <BanPhimPin giaTri={pin} onDoi={setPin} onDu={gui} khoa={dangGui} />
        {dangGui && <p className="text-center text-stone-500" role="status">Đang vào…</p>}
        {baoLoi && <p className="rounded-xl bg-rose-50 p-3 text-center text-rose-800" role="alert">{baoLoi}</p>}
        <button type="button" onClick={() => setBuoc(daLuu.some(c => c.id === em.id) ? 'chon_con' : 'chon_ten')} className="w-full text-sm text-stone-500 underline">← Quay lại</button>
      </div>
    )
  }

  return (
    <form onSubmit={e => { e.preventDefault(); timLop() }} className="space-y-3">
      <label className="block text-center">
        <span className="text-lg font-semibold">Mã lớp của em</span>
        <input value={ma} onChange={e => setMa(chuanMaLop(e.target.value))} autoCapitalize="characters" autoComplete="off" spellCheck={false}
          placeholder="VD: K7M2QX" aria-label="Mã lớp"
          className="mt-2 w-full rounded-2xl border-2 border-stone-300 px-3 py-3 text-center font-mono text-3xl tracking-[0.3em] uppercase" />
      </label>
      {baoLoi && <p className="rounded-xl bg-rose-50 p-3 text-center text-rose-800" role="alert">{baoLoi}</p>}
      <button disabled={dangGui || ma.length < 6} className={NUT}>{dangGui ? 'Đang tìm…' : 'Tiếp'}</button>
      {daLuu.length > 0 && <button type="button" onClick={() => setBuoc('chon_con')} className="w-full text-sm text-stone-500 underline">← Các bạn đã vào trên máy này</button>}
      <p className="text-center text-xs text-stone-500">Mã lớp và PIN có trên phiếu cô giáo phát. Hoặc quét mã QR trên phiếu.</p>
    </form>
  )
}
