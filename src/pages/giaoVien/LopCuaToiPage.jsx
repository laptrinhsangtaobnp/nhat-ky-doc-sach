// Lớp của tôi: GVCN xem lớp mình; nhân viên chọn lớp. CHỈ CON SỐ: cây (số ngày ghi), tuần này mấy ngày, lần ghi gần nhất
// (tô màu em ≥ 7 ngày chưa ghi để nhắc), số cuốn đọc xong năm học, số lần em cho cô xem. Bấm tên → Nhìn lại của em
// (con số + cảm xúc) + những lần em cho cô xem.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { layLopTongQuan } from '../../data/nhatKy'
import { layCacLop } from '../../data/lop'
import { laNhanVien } from '../../domain/taiKhoan'
import { namHocHienTai } from '../../domain/namHoc'
import { chuNgay, ngayVN, soNgayDen } from '../../domain/ngay'
import { giaiDoanCay } from '../../domain/nhatKy'

export default function LopCuaToiPage() {
  const { hoSo } = useAuth()
  const nv = laNhanVien(hoSo?.vai_tro)
  const [cacLop, setCacLop] = useState([])
  const [lopId, setLopId] = useState(null)
  const [kq, setKq] = useState(undefined)
  const homNay = ngayVN()

  useEffect(() => { if (nv) layCacLop(namHocHienTai()).then(({ data }) => setCacLop(data ?? [])) }, [nv])
  useEffect(() => {
    if (nv && !lopId) return
    let huy = false
    layLopTongQuan(nv ? lopId : null).then(d => { if (!huy) setKq(d) }, () => { if (!huy) setKq(null) })
    return () => { huy = true }
  }, [nv, lopId])

  const chuaGhi = h => !h.lan_ghi_cuoi || -soNgayDen(h.lan_ghi_cuoi, homNay) >= 7
  const ds = kq?.hoc_sinh ?? []
  const soChuaGhi = ds.filter(chuaGhi).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">{nv ? 'Lớp học' : 'Lớp của tôi'}{kq?.lop && ` — ${kq.lop}`}</h1>
        {nv && (
          <select value={lopId ?? ''} onChange={e => { setKq(undefined); setLopId(Number(e.target.value) || null) }} aria-label="Chọn lớp"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2">
            <option value="">— Chọn lớp —</option>
            {cacLop.map(l => <option key={l.id} value={l.id}>{l.ten}{l.thi_diem ? ' (thí điểm)' : ''}</option>)}
          </select>
        )}
      </div>

      {nv && !lopId && <p className="text-stone-500">Chọn một lớp để xem.</p>}
      {(!nv || lopId) && kq === undefined && <p className="text-stone-500" role="status">Đang tải…</p>}
      {kq === null && <p className="rounded-xl bg-white p-6 text-center">Không tải được. {nv ? '' : 'Thầy cô chưa được gắn lớp chủ nhiệm? Hỏi thầy cô thư viện.'}</p>}

      {kq && <>
        <Link to={`/lop/ma-pin?lop=${lopId ?? ''}&ten=${encodeURIComponent(kq.lop ?? '')}`}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-50">
          🔑 Mã lớp & PIN đăng nhập của học sinh
        </Link>
        <p className="text-stone-600">{ds.length} học sinh · {soChuaGhi > 0
          ? <span className="font-semibold text-rose-700">{soChuaGhi} em đã 7 ngày trở lên chưa ghi nhật ký</span> : 'em nào cũng ghi đều 👏'}</p>
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-600">
              <tr><th className="p-3">Học sinh</th><th className="p-3">Cây (số ngày ghi)</th><th className="p-3">Tuần này</th><th className="p-3">Lần ghi gần nhất</th><th className="p-3">Đọc xong (năm học)</th><th className="p-3">Em cho cô xem</th></tr>
            </thead>
            <tbody>
              {ds.map(h => (
                <tr key={h.id} className={`border-t border-stone-100 ${chuaGhi(h) ? 'bg-rose-50' : ''}`}>
                  <td className="p-3"><Link to={`/lop/hs/${h.id}`} className="font-semibold text-emerald-700 hover:underline">{h.ho_ten}</Link></td>
                  <td className="p-3">{giaiDoanCay(h.cay.so_ngay).hinh} {h.cay.so_ngay}</td>
                  <td className="p-3">{h.cay.tuan_nay} ngày</td>
                  <td className="p-3">{h.lan_ghi_cuoi ? `${chuNgay(h.lan_ghi_cuoi, homNay)} (${soNgayDen(h.lan_ghi_cuoi, homNay) === 0 ? 'hôm nay' : `${-soNgayDen(h.lan_ghi_cuoi, homNay)} ngày trước`})` : <span className="text-rose-700">chưa ghi</span>}</td>
                  <td className="p-3">{h.so_cuon_nam}</td>
                  <td className="p-3">{h.so_chia_se > 0 ? `${h.so_chia_se} lần` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}
    </div>
  )
}
