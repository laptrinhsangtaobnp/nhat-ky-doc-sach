// Kéo chọn trang em đọc đến (điện thoại: kéo bằng ngón tay; có nút −/+ để chỉnh từng trang). giaTri '' = chưa chọn.
import { trangToiDa } from '../../domain/nhatKy'

export default function ThanhTrang({ giaTri, soTrang, trangCuoi, onDoi }) {
  const max = trangToiDa(soTrang, Math.max(Number(giaTri) || 0, trangCuoi ?? 0))
  const so = Number(giaTri) || 0
  const doi = v => onDoi(Math.min(max, Math.max(1, v)))
  return (
    <div className="space-y-2 rounded-xl bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => doi(so - 1)} aria-label="Bớt 1 trang" className="size-11 rounded-full bg-stone-100 text-2xl font-bold">−</button>
        <p className="flex-1 text-center text-lg">
          {so ? <>Trang <b className="text-3xl text-emerald-700">{so}</b>{soTrang && <span className="text-stone-500"> / {soTrang}</span>}</> : <span className="text-stone-500">Kéo để chọn trang</span>}
        </p>
        <button type="button" onClick={() => doi(so + 1)} aria-label="Thêm 1 trang" className="size-11 rounded-full bg-stone-100 text-2xl font-bold">+</button>
      </div>
      <input type="range" min={1} max={max} value={so || 1} onChange={e => onDoi(Number(e.target.value))} aria-label="Em đọc đến trang"
        className="h-8 w-full accent-emerald-600" />
      {trangCuoi && <p className="text-center text-sm text-stone-500">Lần trước em đọc đến trang {trangCuoi}</p>}
    </div>
  )
}
