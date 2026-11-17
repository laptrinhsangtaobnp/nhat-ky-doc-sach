// Một cuốn trong lưới kết quả tìm sách (bấm vào xem chi tiết).
import { Link } from 'react-router-dom'
import BiaSach from './BiaSach'
import { chuKhoi } from '../../domain/danhMuc'

export default function TheSach({ sach }) {
  return (
    <Link to={`/sach/${sach.id}`} className="group block rounded-xl bg-white p-2 shadow-sm hover:shadow-md">
      <div className="relative">
        <BiaSach sach={sach} />
        {sach.an && <span className="absolute left-1 top-1 rounded bg-stone-800/80 px-1.5 py-0.5 text-xs text-white">Đang ẩn</span>}
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold group-hover:text-emerald-700">{sach.ten}</h3>
      {sach.tac_gia && <p className="line-clamp-1 text-xs text-stone-500">{sach.tac_gia}</p>}
      <p className="text-xs text-stone-400">{chuKhoi(sach.khoi_tu, sach.khoi_den)}</p>
    </Link>
  )
}
