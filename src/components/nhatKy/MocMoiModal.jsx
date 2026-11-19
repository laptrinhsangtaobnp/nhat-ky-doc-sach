// Chúc mừng khi em đạt mốc mới (máy chủ trả danh sách mã mốc vừa đạt).
import HopThoai from '../ui/HopThoai'
import { MOC } from '../../domain/nhatKy'

export default function MocMoiModal({ ma, onDong }) {
  return (
    <HopThoai tieuDe="Em đạt mốc mới!" onDong={onDong} rong="max-w-sm">
      {ma.map(m => (
        <div key={m} className="text-center">
          <div className="text-6xl" aria-hidden>{MOC[m]?.hinh}</div>
          <p className="mt-1 text-lg font-bold">{MOC[m]?.ten}</p>
          <p className="text-stone-600">{MOC[m]?.moTa}</p>
        </div>
      ))}
      <button onClick={onDong} className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white">Tuyệt quá!</button>
    </HopThoai>
  )
}
