// Ô màu báo tình trạng 1 lượt mượn cho học sinh (chữ lấy từ moTaChoEm ở domain).
const MAU = {
  xanh: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  cam: 'border-amber-200 bg-amber-50 text-amber-900',
  do: 'border-rose-200 bg-rose-50 text-rose-900',
  xam: 'border-stone-200 bg-stone-50 text-stone-600',
}

export default function HopTrangThai({ moTa, children }) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${MAU[moTa.mau] ?? MAU.xam}`}>
      <p className="font-semibold">{moTa.tieuDe}</p>
      {moTa.chiTiet && <p>{moTa.chiTiet}</p>}
      {children}
    </div>
  )
}
