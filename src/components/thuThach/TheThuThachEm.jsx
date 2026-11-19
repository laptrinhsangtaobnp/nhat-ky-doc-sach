// Trang chủ HS: thẻ thử thách lớp (nếu lớp có). Số ngày của em + "X/Y bạn đã đạt" — không có tên bạn nào, không xếp hạng.
import { useEffect, useState } from 'react'
import { layThuThachCuaToi } from '../../data/thuThach'
import { loiEm, phanTramEm, tinhTrangThuThach } from '../../domain/thuThach'

export default function TheThuThachEm({ homNay }) {
  const [tt, setTt] = useState(null)

  useEffect(() => {
    let huy = false
    layThuThachCuaToi().then(d => { if (!huy) setTt(d) }, () => { if (!huy) setTt(null) })   // lỗi → ẩn thẻ, không chặn trang
    return () => { huy = true }
  }, [])

  if (!tt) return null
  const tr = tinhTrangThuThach(tt, homNay)
  const dat = tt.cua_em >= tt.so_ngay

  return (
    <section className={`space-y-2 rounded-xl p-4 shadow-sm ${dat ? 'bg-amber-50' : 'bg-violet-50'}`} aria-label="Thử thách lớp">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 className="text-lg font-bold">🏁 {tt.ten}</h2>
        <span className="text-sm text-stone-600">{tr.chu}</span>
      </div>
      <p>Em: <b>{tt.cua_em}/{tt.so_ngay} ngày</b> ghi nhật ký</p>
      <div className="h-2.5 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={tt.cua_em} aria-valuemin={0} aria-valuemax={tt.so_ngay}>
        <div className={`h-full rounded-full ${dat ? 'bg-amber-400' : 'bg-violet-500'}`} style={{ width: `${phanTramEm(tt.cua_em, tt.so_ngay)}%` }} />
      </div>
      <p className="text-sm">{loiEm(tt.cua_em, tt.so_ngay, tr.trangThai)}</p>
      <p className="text-sm text-stone-700">Cả lớp: <b>{tt.so_dat}/{tt.si_so} bạn</b> đã đạt{tt.so_dat > 0 ? ' 🎉' : ''}</p>
    </section>
  )
}
