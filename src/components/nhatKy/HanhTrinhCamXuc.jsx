// Hành trình cảm xúc 1 cuốn: dải cảm xúc đặt theo trang (từ đầu đến cuối sách). Chỉ cảm xúc + số trang, không có chữ em viết.
import { camXuc, viTriHanhTrinh } from '../../domain/nhatKy'

export default function HanhTrinhCamXuc({ ds, soTrang }) {
  const diem = viTriHanhTrinh(ds, soTrang)
  if (diem.length === 0) return null
  return (
    <div className="space-y-1" aria-label={`Hành trình cảm xúc: ${diem.map(d => camXuc(d.cam_xuc).ten).join(', ')}`}>
      <div className="relative mx-4 h-12">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-400" />
        {diem.map((d, i) => (
          <span key={i} title={`${camXuc(d.cam_xuc).ten}${d.trang ? ` — trang ${d.trang}` : ''}`}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl drop-shadow" style={{ left: `${d.viTri}%` }}>
            {camXuc(d.cam_xuc).hinh}
          </span>
        ))}
      </div>
      <div className="flex justify-between text-xs text-stone-500"><span>Đầu sách</span><span>{soTrang ? `Trang ${soTrang}` : 'Cuối sách'}</span></div>
    </div>
  )
}
