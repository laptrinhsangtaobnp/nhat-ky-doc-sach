// Ghi nhật ký (học sinh): chọn sách → đoạn em nhớ → cảm xúc → em nghĩ gì (có câu hỏi gợi ý) → đọc cùng bố mẹ → Lưu.
// /nhat-ky/ghi?sach=ID (ghi mới) · /nhat-ky/:id/sua (sửa trong 7 ngày). Máy chủ quyết định tính chuỗi / mốc.
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Lightbulb } from 'lucide-react'
import { useGhiNhatKy } from '../../hooks/useGhiNhatKy'
import { CAU_GOI_Y, demChu, duDaiTinhChuoi } from '../../domain/nhatKy'
import ChonSachNhatKy from '../../components/nhatKy/ChonSachNhatKy'
import ChonCamXuc from '../../components/nhatKy/ChonCamXuc'
import MocMoiModal from '../../components/nhatKy/MocMoiModal'

const O_CHU = 'w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base leading-relaxed'

export default function GhiNhatKyPage() {
  const { id } = useParams()
  const [tim] = useSearchParams()
  const dieuHuong = useNavigate()
  const g = useGhiNhatKy({ id, sachId: Number(tim.get('sach')) || null })
  const [goiY, setGoiY] = useState(null)              // chỉ số câu hỏi gợi ý đang hiện
  const [moc, setMoc] = useState(null)

  if (g.dangTai) return <p className="text-stone-500" role="status">Đang tải…</p>

  const du = duDaiTinhChuoi(g.nd.doanNho, g.nd.emNghi, g.toiThieu)
  const soChu = Math.max(demChu(g.nd.doanNho), demChu(g.nd.emNghi))

  async function luu(e) {
    e.preventDefault()
    const kq = await g.luu()
    if (!kq) return
    if (kq.moc_moi?.length) setMoc(kq.moc_moi)
    else dieuHuong('/nhat-ky')
  }

  return (
    <form onSubmit={luu} className="mx-auto max-w-2xl space-y-5">
      <button type="button" onClick={() => dieuHuong(-1)} className="flex items-center gap-1 text-sm text-stone-600 hover:text-emerald-700">
        <ArrowLeft size={16} aria-hidden /> Quay lại
      </button>
      <h1 className="text-2xl font-bold">{id ? 'Sửa nhật ký' : '✍️ Ghi nhật ký đọc sách'}</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">1. Em đọc cuốn nào?</h2>
        <ChonSachNhatKy sach={g.sach} dangMuon={g.dangMuon} onChon={id ? null : g.setSach} />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">2. Đoạn em nhớ</h2>
        <textarea rows={4} maxLength={1000} value={g.nd.doanNho} onChange={e => g.datNd({ doanNho: e.target.value })}
          placeholder="Chép lại câu em thích, hoặc kể ngắn đoạn em nhớ nhất…" aria-label="Đoạn em nhớ" className={O_CHU} />
        <label className="flex items-center gap-2 text-sm text-stone-600">Ở trang
          <input type="number" min={1} max={3000} value={g.nd.trang} onChange={e => g.datNd({ trang: e.target.value })}
            className="w-24 rounded-lg border border-stone-300 px-2 py-1.5 text-base" /> (không bắt buộc)
        </label>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">3. Đoạn đó làm em thấy thế nào?</h2>
        <ChonCamXuc giaTri={g.nd.camXuc} onChon={camXuc => g.datNd({ camXuc })} />
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="mr-auto font-semibold">4. Em nghĩ gì?</h2>
          <button type="button" onClick={() => setGoiY(i => (i === null ? Math.floor(Math.random() * CAU_GOI_Y.length) : (i + 1) % CAU_GOI_Y.length))}
            className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-900">
            <Lightbulb size={16} aria-hidden /> {goiY === null ? 'Gợi ý' : 'Câu khác'}
          </button>
        </div>
        {goiY !== null && <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">💡 {CAU_GOI_Y[goiY]}</p>}
        <textarea rows={4} maxLength={1000} value={g.nd.emNghi} onChange={e => g.datNd({ emNghi: e.target.value })}
          placeholder="Em thích / không thích điều gì? Em học được gì?…" aria-label="Em nghĩ gì" className={O_CHU} />
      </section>

      <label className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
        <input type="checkbox" checked={g.nd.cungBoMe} onChange={e => g.datNd({ cungBoMe: e.target.checked })} className="size-5" />
        <span>👨‍👩‍👧 Hôm nay em đọc cùng bố mẹ (hoặc người thân)</span>
      </label>

      <p className={`text-sm ${du ? 'text-emerald-700' : 'text-stone-500'}`} role="status">
        {du ? '✓ Đủ dài — lần ghi này được tính vào chuỗi tuần (mỗi ngày tính 1 lần).'
          : `Viết từ ${g.toiThieu} chữ trở lên ở một ô để được tính vào chuỗi tuần (em đang có ${soChu} chữ).`}
      </p>

      <button disabled={g.dangLuu} className="w-full rounded-xl bg-emerald-600 py-3 text-lg font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
        {g.dangLuu ? 'Đang lưu…' : 'Lưu nhật ký'}
      </button>

      {moc && <MocMoiModal ma={moc} onDong={() => dieuHuong('/nhat-ky')} />}
    </form>
  )
}
