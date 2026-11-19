// Đầu trang chủ học sinh: nút Ghi nhật ký, chuỗi tuần, mục tiêu tháng, dòng nhắc. Số liệu do máy chủ tính (tong_quan_cua_toi).
import { Link } from 'react-router-dom'
import { PenLine } from 'lucide-react'
import { chuChuoi, loiNhac } from '../../domain/nhatKy'

export default function KhungThoiQuen({ tq, homNay, onMucTieu }) {
  const c = chuChuoi(tq.chuoi)
  const nhac = loiNhac(tq.lan_ghi_cuoi, homNay)
  return (
    <section className="space-y-3">
      <Link to="/nhat-ky/ghi" className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-xl font-bold text-white shadow hover:bg-emerald-700">
        <PenLine size={24} aria-hidden /> Ghi nhật ký
      </Link>
      {nhac && <p className="rounded-xl bg-amber-50 px-4 py-2 text-amber-900">⏰ {nhac}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-lg font-bold">{c.chuoi}</p>
          <div className="my-2 flex gap-1.5" aria-label={`Tuần này ${tq.chuoi.tuan_nay} trên ${tq.chuoi.can} lần`}>
            {Array.from({ length: tq.chuoi.can }, (_, i) => (
              <span key={i} className={`flex size-8 items-center justify-center rounded-full text-sm ${i < tq.chuoi.tuan_nay ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                {i < tq.chuoi.tuan_nay ? '✓' : i + 1}
              </span>
            ))}
          </div>
          <p className="text-sm text-stone-600">{c.tuan}</p>
          {tq.chuoi.dai_nhat > 0 && <p className="text-xs text-stone-400">Chuỗi dài nhất: {tq.chuoi.dai_nhat} tuần</p>}
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-lg font-bold">📖 Tháng này: {tq.doc_xong_thang}/{tq.muc_tieu} cuốn</p>
          <div className="my-2 h-3 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (tq.doc_xong_thang / tq.muc_tieu) * 100)}%` }} />
          </div>
          <label className="text-sm text-stone-600">Mục tiêu của em: đọc xong{' '}
            <select value={tq.muc_tieu} onChange={e => onMucTieu(Number(e.target.value))} className="rounded border border-stone-300 px-1 py-0.5">
              {[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
            </select> cuốn / tháng
          </label>
        </div>
      </div>
    </section>
  )
}
