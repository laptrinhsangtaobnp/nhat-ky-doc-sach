// Lớp của tôi: khung thử thách lớp — tiến độ chung, đặt mới, kết thúc sớm, các thử thách trước.
// Số ngày từng em đưa lên trang cha (onSoNgayEm) để hiện thành cột trong bảng. Chỉ con số.
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ketThucThuThach, layThuThachLop } from '../../data/thuThach'
import { loiThuThach, tinhTrangThuThach } from '../../domain/thuThach'
import { chuNgay } from '../../domain/ngay'
import FormThuThach from './FormThuThach'

export default function ThuThachLop({ lopId, homNay, onSoNgayEm }) {
  const [kq, setKq] = useState(undefined)
  const [moForm, setMoForm] = useState(false)
  const [lan, setLan] = useState(0)

  useEffect(() => {
    let huy = false
    layThuThachLop(lopId).then(d => {
      if (huy) return
      setKq(d)
      onSoNgayEm(d.hien_tai ? { so_ngay: d.hien_tai.so_ngay, em: Object.fromEntries(d.hien_tai.hs.map(h => [h.id, h.so_ngay])) } : null)
    }, () => { if (!huy) setKq(null) })
    return () => { huy = true }
  }, [lopId, lan, onSoNgayEm])

  async function ketThuc(tt) {
    if (!confirm(`Kết thúc thử thách "${tt.ten}" ngay bây giờ?`)) return
    try {
      await ketThucThuThach(tt.id)
      toast.success('Đã kết thúc thử thách')
      setLan(n => n + 1)
    } catch (e) {
      toast.error(loiThuThach(e), { duration: 6000 })
    }
  }

  if (kq === undefined) return null
  if (kq === null) return <p className="text-sm text-stone-500">Chưa tải được thử thách lớp.</p>
  const ht = kq.hien_tai

  return (
    <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold">🏁 Thử thách lớp</h2>
      {ht ? <>
        <div className="flex flex-wrap items-baseline gap-x-3">
          <p className="font-semibold">{ht.ten}</p>
          <p className="text-sm text-stone-600">{chuNgay(ht.tu, homNay)} – {chuNgay(ht.den, homNay)} · {tinhTrangThuThach(ht, homNay).chu}</p>
        </div>
        <p>Mỗi em ghi <b>{ht.so_ngay} ngày</b> · <b>{ht.so_dat}/{ht.si_so} em</b> đã đạt. Số ngày từng em ở cột "Thử thách" bên dưới.</p>
        <button onClick={() => ketThuc(ht)} className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50">Kết thúc sớm</button>
      </> : moForm
        ? <FormThuThach lopId={lopId} homNay={homNay} onHuy={() => setMoForm(false)} onXong={() => { setMoForm(false); setLan(n => n + 1) }} />
        : <div className="space-y-2">
            <p className="text-stone-600">Lớp chưa có thử thách. Ví dụ: "4 tuần, mỗi em ghi nhật ký 12 ngày". Học sinh thấy số ngày của mình và số bạn đã đạt, không thấy tên bạn.</p>
            <button onClick={() => setMoForm(true)} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">+ Đặt thử thách</button>
          </div>}
      {kq.truoc.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-stone-600">Thử thách đã xong ({kq.truoc.length})</summary>
          <ul className="mt-2 space-y-1">
            {kq.truoc.map(t => <li key={t.id}>{t.ten} · {chuNgay(t.tu, homNay)} – {chuNgay(t.den, homNay)} · {t.so_dat}/{t.si_so} em đạt</li>)}
          </ul>
        </details>
      )}
    </section>
  )
}
