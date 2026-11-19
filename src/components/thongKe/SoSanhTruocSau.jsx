// So sánh trước – sau (8 chỉ số, gộp các lớp thí điểm). "Trước": thủ thư nhập từ sổ mượn + khảo sát.
// "Sau": 4 chỉ số app tự đo (từ khoảng đang xem); 4 chỉ số khảo sát / bấm giờ thủ thư nhập. Máy chủ kiểm lại khi lưu.
import { useState } from 'react'
import toast from 'react-hot-toast'
import { chuChenh, docSo, kiemSo, loiThongKe } from '../../domain/thongKe'

const O = 'w-full rounded-lg border border-stone-300 px-2 py-1.5'
const chu = x => (x == null ? '' : String(x).replace('.', ','))

function DongSua({ r, onLuu, onDong }) {
  const [f, setF] = useState({ truoc: chu(r.truoc), nguonTruoc: r.nguonTruoc, sau: r.tuDong ? '' : chu(r.sau), nguonSau: r.tuDong ? '' : r.nguonSau })
  const [dangLuu, setDangLuu] = useState(false)
  const doi = k => e => setF(x => ({ ...x, [k]: e.target.value }))
  const truoc = docSo(f.truoc), sau = r.tuDong ? null : docSo(f.sau)
  const loi = kiemSo(r.ma, truoc) ?? kiemSo(r.ma, sau)

  async function luu(e) {
    e.preventDefault()
    if (loi) return
    setDangLuu(true)
    try {
      await onLuu(r.ma, { truoc, nguonTruoc: f.nguonTruoc.trim(), sau, nguonSau: r.tuDong ? '' : f.nguonSau.trim() })
      toast.success('Đã lưu')
      onDong()
    } catch (err) {
      toast.error(loiThongKe(err), { duration: 6000 })
    } finally { setDangLuu(false) }
  }

  return (
    <form onSubmit={luu} className="grid gap-2 rounded-lg bg-stone-50 p-3 sm:grid-cols-2">
      <label className="space-y-1 text-sm"><span className="font-semibold">Trước ({r.donVi})</span><input value={f.truoc} onChange={doi('truoc')} inputMode="decimal" className={O} /></label>
      <label className="space-y-1 text-sm"><span className="font-semibold">Nguồn số Trước</span><input value={f.nguonTruoc} onChange={doi('nguonTruoc')} maxLength={200} placeholder="VD: Sổ mượn HK I 2025–2026" className={O} /></label>
      {!r.tuDong && <>
        <label className="space-y-1 text-sm"><span className="font-semibold">Sau ({r.donVi})</span><input value={f.sau} onChange={doi('sau')} inputMode="decimal" className={O} /></label>
        <label className="space-y-1 text-sm"><span className="font-semibold">Nguồn số Sau</span><input value={f.nguonSau} onChange={doi('nguonSau')} maxLength={200} placeholder="VD: Khảo sát lại tháng 3" className={O} /></label>
      </>}
      {loi && <p className="text-sm text-rose-700 sm:col-span-2">{loi}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={!!loi || dangLuu} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white disabled:opacity-50">{dangLuu ? 'Đang lưu…' : 'Lưu'}</button>
        <button type="button" onClick={onDong} className="rounded-lg border border-stone-300 px-3 py-1.5">Huỷ</button>
      </div>
    </form>
  )
}

export default function SoSanhTruocSau({ bang, phamVi, onLuu }) {
  const [dangSua, setDangSua] = useState(null)
  return (
    <section className="space-y-3">
      <p className="text-sm text-stone-600">
        Số <b>Trước</b> nhập gộp cho các lớp thí điểm (từ sổ mượn và phiếu khảo sát). Cột <b>Sau</b>: 4 chỉ số đầu app tự đo trong khoảng đang xem;
        4 chỉ số sau lấy từ khảo sát lại / bấm giờ nên thầy cô nhập.
      </p>
      {phamVi !== 'thi_diem' && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">⚠ Đang xem phạm vi khác "Các lớp thí điểm" — số Sau app tự đo sẽ không cùng nhóm với số Trước.</p>}
      <ul className="space-y-2">
        {bang.map(r => (
          <li key={r.ma} className="space-y-2 rounded-xl bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p className="min-w-[14rem] flex-1 font-semibold">{r.ten} <span className="font-normal text-stone-500">({r.donVi})</span></p>
              <p className="text-sm">Trước: <b>{r.truoc == null ? '—' : chu(r.truoc)}</b></p>
              <p className="text-sm">Sau: <b>{r.sau == null ? '—' : chu(r.sau)}</b>{r.tuDong && <span className="text-stone-500"> (app)</span>}</p>
              <p className={`text-sm font-semibold ${r.tot === true ? 'text-emerald-700' : r.tot === false ? 'text-rose-700' : 'text-stone-500'}`}>{chuChenh(r)}</p>
              {dangSua !== r.ma && <button onClick={() => setDangSua(r.ma)} className="text-sm text-emerald-700 underline">Nhập số</button>}
            </div>
            {(r.nguonTruoc || (!r.tuDong && r.nguonSau)) && dangSua !== r.ma &&
              <p className="text-xs text-stone-500">{r.nguonTruoc && `Trước: ${r.nguonTruoc}`}{!r.tuDong && r.nguonSau && ` · Sau: ${r.nguonSau}`}</p>}
            {dangSua === r.ma && <DongSua r={r} onLuu={onLuu} onDong={() => setDangSua(null)} />}
          </li>
        ))}
      </ul>
    </section>
  )
}
