// Biểu đồ cột đơn giản cho trang Nhìn lại: số lần ghi nhật ký mỗi tháng; cảm xúc của cả năm.
import { CAM_XUC, chuThang } from '../../domain/nhatKy'

export function BieuDoThang({ theoThang }) {
  const lonNhat = Math.max(1, ...theoThang.map(t => t.so_lan))
  return (
    <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Số lần ghi nhật ký theo tháng">
      {theoThang.map(t => (
        <div key={t.thang} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-xs text-stone-600">{t.so_lan || ''}</span>
          <div className="w-full rounded-t bg-emerald-500" style={{ height: `${(t.so_lan / lonNhat) * 100}px`, minHeight: t.so_lan ? 4 : 0 }} />
          <span className="text-xs text-stone-500">{chuThang(t.thang)}</span>
        </div>
      ))}
    </div>
  )
}

export function BieuDoCamXuc({ dem }) {
  const tong = Object.values(dem).reduce((a, b) => a + b, 0)
  if (!tong) return <p className="text-sm text-stone-500">Chưa có.</p>
  return (
    <ul className="space-y-1.5">
      {CAM_XUC.filter(c => dem[c.ma]).sort((a, b) => dem[b.ma] - dem[a.ma]).map(c => (
        <li key={c.ma} className="flex items-center gap-2 text-sm">
          <span className="w-24 shrink-0">{c.hinh} {c.ten}</span>
          <span className="h-3 rounded-full bg-amber-400" style={{ width: `${(dem[c.ma] / tong) * 70}%` }} />
          <span className="text-stone-500">{dem[c.ma]}</span>
        </li>
      ))}
    </ul>
  )
}
