// Hộ chiếu thể loại (HS): mỗi chủ đề 1 con tem — có màu khi em đã đọc xong 1 cuốn thuộc chủ đề đó (máy chủ tính).
// Tem chưa có: gợi ý ≤ 2 cuốn cùng thể loại (đúng khối, còn trên kệ trước) + nút đặt trước — kéo em đọc đa dạng hơn.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { layHoChieu } from '../../data/nhatKy'
import { datTruoc } from '../../data/muonTra'
import { loiMuonTra } from '../../domain/muonTra'
import { loiHoChieu, mauTem, tienDoHoChieu } from '../../domain/hoChieu'
import { chuNgay } from '../../domain/ngay'
import BiaSach from '../../components/sach/BiaSach'

export default function HoChieuPage() {
  const [tem, setTem] = useState(null)          // null = đang tải
  const [loi, setLoi] = useState(false)
  const [daDat, setDaDat] = useState([])

  useEffect(() => {
    let huy = false
    layHoChieu().then(d => { if (!huy) setTem(d.tem) }, () => { if (!huy) setLoi(true) })
    return () => { huy = true }
  }, [])

  async function dat(s) {
    try {
      await datTruoc(s.id, 'goi_y')
      setDaDat(d => [...d, s.id])
      toast.success(`Đã đặt trước "${s.ten}"`)
    } catch (e) {
      toast.error(loiMuonTra(e), { duration: 6000 })
    }
  }

  if (loi) return <p className="rounded-xl bg-white p-6 text-center">Chưa tải được hộ chiếu, em thử lại sau nhé.</p>
  if (!tem) return <p className="text-stone-500" role="status">Đang tải…</p>
  const td = tienDoHoChieu(tem)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-700 to-sky-600 p-5 text-white shadow">
        <h1 className="text-2xl font-bold">🎫 Hộ chiếu đọc sách</h1>
        <p className="mt-1">{loiHoChieu(td)}</p>
        {td.tong > 0 && (
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/30" role="progressbar" aria-valuenow={td.co} aria-valuemax={td.tong}>
            <div className="h-full bg-amber-300" style={{ width: `${(td.co / td.tong) * 100}%` }} />
          </div>
        )}
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {tem.map((t, i) => (
          <li key={t.id} className={`rounded-2xl border-2 p-4 ${t.ngay ? mauTem(i) : 'border-dashed border-stone-300 bg-white'}`}>
            <div className="flex items-center gap-3">
              <span className={`flex size-14 shrink-0 items-center justify-center rounded-full border-2 text-2xl ${t.ngay ? 'rotate-[-8deg] border-current bg-white' : 'border-stone-300 grayscale opacity-50'}`} aria-hidden>
                {t.ngay ? '✅' : '🔒'}
              </span>
              <div>
                <h2 className="text-lg font-bold">{t.ten}</h2>
                {t.ngay
                  ? <p className="text-sm">Đóng tem {chuNgay(t.ngay)} · <i>{t.sach}</i></p>
                  : <p className="text-sm text-stone-500">Chưa có tem — đọc xong 1 cuốn thể loại này nhé!</p>}
              </div>
            </div>
            {!t.ngay && t.goi_y?.length > 0 && (
              <ul className="mt-3 grid grid-cols-2 gap-3">
                {t.goi_y.map(s => (
                  <li key={s.id} className="space-y-1 text-sm">
                    <Link to={`/sach/${s.id}`} className="block w-20"><BiaSach sach={s} /></Link>
                    <p className="line-clamp-2 font-semibold">{s.ten}</p>
                    {daDat.includes(s.id)
                      ? <p className="text-emerald-700">✓ Đã đặt</p>
                      : <button onClick={() => dat(s)} className="rounded-lg border border-emerald-500 px-2 py-1 text-emerald-700 hover:bg-emerald-50">
                          {s.con_ban > 0 ? 'Đặt trước' : 'Xếp hàng chờ'}</button>}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
