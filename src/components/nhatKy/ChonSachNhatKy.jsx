// Chọn cuốn sách để ghi nhật ký: sách em đang mượn hiện sẵn; cuốn khác thì tìm trong danh mục thư viện.
import { useEffect, useState } from 'react'
import { timSach } from '../../data/sach'
import BiaSach from '../sach/BiaSach'

export default function ChonSachNhatKy({ sach, dangMuon, onChon }) {
  const [tuKhoa, setTuKhoa] = useState('')
  const [ketQua, setKetQua] = useState([])

  useEffect(() => {
    if (tuKhoa.trim().length < 2) return
    let huy = false
    const t = setTimeout(() => timSach({ tuKhoa }).then(({ data }) => { if (!huy) setKetQua((data ?? []).slice(0, 6)) }), 300)
    return () => { huy = true; clearTimeout(t) }
  }, [tuKhoa])

  if (sach) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
        <div className="w-12 shrink-0"><BiaSach sach={sach} /></div>
        <div className="min-w-0 flex-1"><p className="font-semibold">{sach.ten}</p>{sach.tac_gia && <p className="text-sm text-stone-500">{sach.tac_gia}</p>}</div>
        {onChon && <button type="button" onClick={() => onChon(null)} className="text-sm underline">Đổi sách</button>}
      </div>
    )
  }
  const goiY = tuKhoa.trim().length < 2 ? [] : ketQua
  return (
    <div className="space-y-2">
      {dangMuon.length > 0 && <>
        <p className="text-sm text-stone-600">Sách em đang mượn:</p>
        <div className="flex flex-wrap gap-2">
          {dangMuon.map(s => (
            <button key={s.id} type="button" onClick={() => onChon(s)} className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm hover:bg-emerald-100">{s.ten}</button>
          ))}
        </div>
      </>}
      <input value={tuKhoa} onChange={e => setTuKhoa(e.target.value)} placeholder="Hoặc gõ tên sách khác của thư viện…" aria-label="Tìm sách"
        className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base" />
      {goiY.length > 0 && (
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
          {goiY.map(s => <li key={s.id}><button type="button" onClick={() => onChon(s)} className="w-full px-3 py-2 text-left hover:bg-stone-50">{s.ten}
            {s.tac_gia && <span className="text-sm text-stone-500"> · {s.tac_gia}</span>}</button></li>)}
        </ul>
      )}
    </div>
  )
}
