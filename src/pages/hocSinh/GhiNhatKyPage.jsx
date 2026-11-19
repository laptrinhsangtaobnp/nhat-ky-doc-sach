// Ghi nhật ký nhanh (< 30 giây): chọn sách → kéo chọn trang → chạm cảm xúc → 1 câu → Lưu.
// Gập sẵn: "Viết thêm" (em nghĩ gì), "5 phút trò chuyện cùng bố mẹ". Ô "Cho cô xem" (mặc định riêng tư).
// /nhat-ky/ghi?sach=ID (ghi mới) · /nhat-ky/:id/sua (sửa trong 7 ngày). Máy chủ quyết định tính cây / mốc.
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Lightbulb } from 'lucide-react'
import { useGhiNhatKy } from '../../hooks/useGhiNhatKy'
import { cauHoiHomNay, duDaiTinhChuoi } from '../../domain/nhatKy'
import { ngayVN } from '../../domain/ngay'
import ChonSachNhatKy from '../../components/nhatKy/ChonSachNhatKy'
import ChonCamXuc from '../../components/nhatKy/ChonCamXuc'
import ThanhTrang from '../../components/nhatKy/ThanhTrang'
import KhungBoMe from '../../components/nhatKy/KhungBoMe'
import MocMoiModal from '../../components/nhatKy/MocMoiModal'

const O_CHU = 'w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base leading-relaxed'

export default function GhiNhatKyPage() {
  const { id } = useParams()
  const [tim] = useSearchParams()
  const dieuHuong = useNavigate()
  const g = useGhiNhatKy({ id, sachId: Number(tim.get('sach')) || null })
  const [buocGoiY, setBuocGoiY] = useState(null)        // null = chưa mở gợi ý; số = lệch bao nhiêu câu so với câu hôm nay
  const [moc, setMoc] = useState(null)
  const homNay = ngayVN()

  if (g.dangTai) return <p className="text-stone-500" role="status">Đang tải…</p>

  const du = duDaiTinhChuoi(g.nd.doanNho, g.nd.emNghi, g.toiThieu)

  async function luu(e) {
    e.preventDefault()
    const kq = await g.luu()
    if (!kq) return
    if (kq.moc_moi?.length) setMoc(kq.moc_moi)
    else dieuHuong(id ? '/nhat-ky' : '/hoc-sinh')
  }

  return (
    <form onSubmit={luu} className="mx-auto max-w-2xl space-y-4">
      <button type="button" onClick={() => dieuHuong(-1)} className="flex items-center gap-1 text-sm text-stone-600 hover:text-emerald-700">
        <ArrowLeft size={16} aria-hidden /> Quay lại
      </button>
      <h1 className="text-2xl font-bold">{id ? 'Sửa nhật ký' : '✍️ Ghi nhật ký'}</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">1. Em đọc cuốn nào?</h2>
        <ChonSachNhatKy sach={g.sach} dangMuon={g.dangMuon} onChon={id ? null : g.chonSach} />
      </section>

      {g.sach && <section className="space-y-2">
        <h2 className="font-semibold">2. Em đọc đến trang nào?</h2>
        <ThanhTrang giaTri={g.nd.trang} soTrang={g.sach.so_trang} trangCuoi={id ? null : g.trangCuoi} onDoi={trang => g.datNd({ trang })} />
      </section>}

      <section className="space-y-2">
        <h2 className="font-semibold">3. Em thấy thế nào?</h2>
        <ChonCamXuc giaTri={g.nd.camXuc} onChon={camXuc => g.datNd({ camXuc })} />
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="mr-auto font-semibold">4. Viết 1 câu</h2>
          <button type="button" onClick={() => setBuocGoiY(b => (b === null ? 0 : b + 1))}
            className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-900">
            <Lightbulb size={16} aria-hidden /> {buocGoiY === null ? 'Bí ý?' : 'Câu khác'}
          </button>
        </div>
        {buocGoiY !== null && <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">💡 {cauHoiHomNay(homNay, buocGoiY)}</p>}
        <textarea rows={2} maxLength={1000} value={g.nd.doanNho} onChange={e => g.datNd({ doanNho: e.target.value })}
          placeholder="Đoạn em nhớ, hay điều em nghĩ…" aria-label="Viết 1 câu" className={O_CHU} />
        <details open={Boolean(g.nd.emNghi)}>
          <summary className="cursor-pointer text-sm text-stone-600">＋ Em muốn viết thêm</summary>
          <textarea rows={3} maxLength={1000} value={g.nd.emNghi} onChange={e => g.datNd({ emNghi: e.target.value })}
            placeholder="Em thích / không thích điều gì? Em học được gì?…" aria-label="Em nghĩ gì" className={`mt-2 ${O_CHU}`} />
        </details>
      </section>

      <KhungBoMe homNay={homNay} cauHoiSach={g.sach?.cau_hoi} nd={g.nd} datNd={g.datNd} />

      <label className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
        <input type="checkbox" checked={g.nd.choCoXem} onChange={e => g.datNd({ choCoXem: e.target.checked })} className="size-5" />
        <span>👀 Cho cô xem lần ghi này <span className="text-sm text-stone-500">(không chọn thì chỉ em xem được)</span></span>
      </label>

      <p className={`text-sm ${du ? 'text-emerald-700' : 'text-stone-500'}`} role="status">
        {du ? '🌱 Lưu xong, cây của em sẽ lớn thêm (mỗi ngày tính 1 lần).' : `Viết từ ${g.toiThieu} chữ trở lên để cây của em lớn thêm nhé.`}
      </p>

      <button disabled={g.dangLuu} className="w-full rounded-xl bg-emerald-600 py-3.5 text-lg font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
        {g.dangLuu ? 'Đang lưu…' : 'Lưu nhật ký'}
      </button>

      {moc && <MocMoiModal ma={moc} onDong={() => dieuHuong(id ? '/nhat-ky' : '/hoc-sinh')} />}
    </form>
  )
}
