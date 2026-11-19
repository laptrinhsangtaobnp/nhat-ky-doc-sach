// Mở lá "thư gửi chính mình" đã đến ngày (máy chủ kiểm ngày, ghi đã mở). Thư đã mở xem lại ở Nhìn lại.
import { useEffect, useState } from 'react'
import HopThoai from '../ui/HopThoai'
import { moThu } from '../../data/nhatKy'
import { loiNhatKy } from '../../domain/nhatKy'
import { chuNgay } from '../../domain/ngay'

export default function ThuModal({ sachId, onDong }) {
  const [thu, setThu] = useState(null)
  const [loi, setLoi] = useState(null)
  useEffect(() => { moThu(sachId).then(setThu, e => setLoi(loiNhatKy(e))) }, [sachId])
  return (
    <HopThoai tieuDe="💌 Thư từ chính em" onDong={onDong} rong="max-w-md">
      {loi && <p>{loi}</p>}
      {!thu && !loi && <p className="text-stone-500" role="status">Đang mở thư…</p>}
      {thu && <>
        <p className="text-sm text-stone-600">Em viết ngày {chuNgay(thu.viet_ngay)}, khi đọc xong <b>{thu.ten}</b>:</p>
        <p className="whitespace-pre-line rounded-xl bg-rose-50 p-4 font-medium leading-relaxed text-rose-950">{thu.noi_dung}</p>
        <p className="text-sm text-stone-600">Em bây giờ nghĩ sao? Em có thể đọc lại thư này ở trang Nhìn lại.</p>
      </>}
      <button onClick={onDong} className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white">Đóng</button>
    </HopThoai>
  )
}
