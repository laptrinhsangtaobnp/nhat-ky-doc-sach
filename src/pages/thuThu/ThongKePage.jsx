// Thống kê sáng kiến (chỉ thủ thư / quản trị): số liệu máy chủ tính + so sánh trước – sau + xuất Excel minh chứng.
// Không có tên học sinh ở trang này và trong tệp Excel.
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useThongKe } from '../../hooks/useThongKe'
import { taiVeExcel } from '../../data/tepExcel'
import { bangSoSanh, cacTrangExcel, giaTriTuDong, loiThongKe, PHAM_VI } from '../../domain/thongKe'
import BoLocThongKe from '../../components/thongKe/BoLocThongKe'
import SoLieuApp from '../../components/thongKe/SoLieuApp'
import SoSanhTruocSau from '../../components/thongKe/SoSanhTruocSau'

export default function ThongKePage() {
  const t = useThongKe()
  const [the, setThe] = useState('so_lieu')
  const [dangXuat, setDangXuat] = useState(false)
  const bang = bangSoSanh(t.soLieu, t.tk ? giaTriTuDong(t.tk) : null)
  const tenPhamVi = PHAM_VI.find(p => p.ma === t.tk?.pham_vi)?.ten ?? ''

  async function xuat() {
    setDangXuat(true)
    try {
      await taiVeExcel(cacTrangExcel(t.tk, bang, tenPhamVi), `thong-ke-sang-kien_${t.tk.tu}_${t.tk.den}.xlsx`)
    } catch {
      toast.error('Chưa xuất được tệp Excel, thử lại nhé.')
    } finally { setDangXuat(false) }
  }

  const nut = (ma, ten) => (
    <button role="tab" aria-selected={the === ma} onClick={() => setThe(ma)}
      className={`rounded-lg px-4 py-2 font-semibold ${the === ma ? 'bg-white shadow-sm' : 'text-stone-600'}`}>{ten}</button>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">Thống kê sáng kiến</h1>
        <button onClick={xuat} disabled={!t.tk || dangXuat}
          className="rounded-lg border border-emerald-600 bg-white px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
          {dangXuat ? 'Đang xuất…' : '⬇ Xuất Excel'}</button>
      </div>
      <BoLocThongKe loc={t.loc} setLoc={t.setLoc} onXem={() => t.xem()} dangTai={t.tk === undefined && !t.loiTai} />
      {t.loiTai && <p className="rounded-xl bg-rose-50 p-3 text-rose-800">{typeof t.loiTai === 'string' ? t.loiTai : loiThongKe(t.loiTai)}</p>}
      {t.tk === undefined && !t.loiTai && <p className="text-stone-500" role="status">Đang tính…</p>}
      {t.tk && <>
        {t.tk.pham_vi === 'thi_diem' && t.tk.si_so === 0 &&
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">⚠ Chưa có lớp nào được đánh dấu thí điểm (hoặc lớp thí điểm chưa có học sinh). Vào trang Tài khoản, ở danh sách lớp bấm vào tên lớp để gắn ★ thí điểm.</p>}
        <p className="text-sm text-stone-600">{tenPhamVi} · {t.tk.si_so} học sinh · {t.tk.so_ngay} ngày. Học sinh tính theo lớp hiện tại của em.</p>
        <div className="flex gap-1 rounded-xl bg-stone-100 p-1" role="tablist">{nut('so_lieu', 'Số liệu')}{nut('so_sanh', 'So sánh trước – sau')}</div>
        {the === 'so_lieu' ? <SoLieuApp tk={t.tk} /> : <SoSanhTruocSau bang={bang} phamVi={t.tk.pham_vi} onLuu={t.luu} />}
      </>}
    </div>
  )
}
