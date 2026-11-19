// Form đặt thử thách lớp (GVCN / nhân viên). Kiểm trước bằng kiemThuThach; máy chủ kiểm lại.
import { useState } from 'react'
import toast from 'react-hot-toast'
import { taoThuThach } from '../../data/thuThach'
import { doDai, kiemThuThach, loiThuThach, thuThachMau } from '../../domain/thuThach'

const O = 'w-full rounded-lg border border-stone-300 px-3 py-2'

export default function FormThuThach({ lopId, homNay, onXong, onHuy }) {
  const [f, setF] = useState(() => thuThachMau(homNay))
  const [dangGui, setDangGui] = useState(false)
  const doi = k => e => setF(x => ({ ...x, [k]: e.target.value }))
  const loi = kiemThuThach(f, homNay)

  async function gui(e) {
    e.preventDefault()
    if (loi) return
    setDangGui(true)
    try {
      await taoThuThach(lopId, f)
      toast.success('Đã đặt thử thách cho lớp')
      onXong()
    } catch (err) {
      toast.error(loiThuThach(err), { duration: 6000 })
    } finally {
      setDangGui(false)
    }
  }

  return (
    <form onSubmit={gui} className="space-y-3">
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Tên thử thách</span>
        <input value={f.ten} onChange={doi('ten')} maxLength={80} className={O} />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block space-y-1"><span className="text-sm font-semibold">Từ ngày</span>
          <input type="date" value={f.tu} onChange={doi('tu')} className={O} /></label>
        <label className="block space-y-1"><span className="text-sm font-semibold">Đến ngày</span>
          <input type="date" value={f.den} onChange={doi('den')} className={O} /></label>
        <label className="block space-y-1"><span className="text-sm font-semibold">Mỗi em cần ghi (ngày)</span>
          <input type="number" min={1} value={f.soNgay} onChange={doi('soNgay')} className={O} /></label>
      </div>
      <p className={`text-sm ${loi ? 'text-rose-700' : 'text-stone-600'}`}>
        {loi ?? `Thử thách ${doDai(f.tu, f.den)} ngày. Em nào ghi nhật ký được tính ${f.soNgay} ngày trở lên là đạt (mỗi ngày tính 1 lần).`}
      </p>
      <div className="flex gap-2">
        <button disabled={!!loi || dangGui} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          {dangGui ? 'Đang lưu…' : 'Đặt thử thách'}</button>
        <button type="button" onClick={onHuy} className="rounded-lg border border-stone-300 px-4 py-2 hover:bg-stone-50">Huỷ</button>
      </div>
    </form>
  )
}
