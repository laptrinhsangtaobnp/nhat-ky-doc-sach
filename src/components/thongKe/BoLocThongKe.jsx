// Bộ lọc thống kê: từ – đến ngày, phạm vi (lớp thí điểm / toàn trường / 1 lớp), nút Xem.
import { useEffect, useState } from 'react'
import { layCacLop } from '../../data/lop'
import { namHocHienTai } from '../../domain/namHoc'
import { PHAM_VI } from '../../domain/thongKe'

const O = 'rounded-lg border border-stone-300 bg-white px-3 py-2'

export default function BoLocThongKe({ loc, setLoc, onXem, dangTai }) {
  const [cacLop, setCacLop] = useState([])
  useEffect(() => { layCacLop(namHocHienTai()).then(({ data }) => setCacLop(data ?? [])) }, [])
  const doi = k => e => setLoc(l => ({ ...l, [k]: k === 'lopId' ? Number(e.target.value) || null : e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onXem() }} className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
      <label className="space-y-1"><span className="block text-sm font-semibold">Từ ngày</span>
        <input type="date" value={loc.tu} onChange={doi('tu')} className={O} /></label>
      <label className="space-y-1"><span className="block text-sm font-semibold">Đến ngày</span>
        <input type="date" value={loc.den} onChange={doi('den')} className={O} /></label>
      <label className="space-y-1"><span className="block text-sm font-semibold">Phạm vi</span>
        <select value={loc.phamVi} onChange={doi('phamVi')} className={O}>
          {PHAM_VI.map(p => <option key={p.ma} value={p.ma}>{p.ten}</option>)}
        </select></label>
      {loc.phamVi === 'lop' && (
        <label className="space-y-1"><span className="block text-sm font-semibold">Lớp</span>
          <select value={loc.lopId ?? ''} onChange={doi('lopId')} className={O}>
            <option value="">— Chọn lớp —</option>
            {cacLop.map(l => <option key={l.id} value={l.id}>{l.ten}{l.thi_diem ? ' ★' : ''}</option>)}
          </select></label>
      )}
      <button disabled={dangTai} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
        {dangTai ? 'Đang tính…' : 'Xem'}</button>
    </form>
  )
}
