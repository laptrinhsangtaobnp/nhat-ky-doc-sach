// Nhân viên chọn lý do không duyệt / gỡ bài (1 chạm). Dùng ở hàng chờ duyệt và ở trang sách.
import { LY_DO_KHONG_DUYET } from '../../domain/review'

export default function ChonLyDo({ onChon, onHuy, ban }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-rose-50 p-2 text-sm">
      <span className="font-medium text-rose-900">Lý do:</span>
      {Object.entries(LY_DO_KHONG_DUYET).map(([ma, chu]) => (
        <button key={ma} disabled={ban} onClick={() => onChon(ma)}
          className="rounded-lg border border-rose-300 bg-white px-2 py-1 hover:bg-rose-100 disabled:opacity-50">{chu}</button>
      ))}
      <button onClick={onHuy} className="px-2 py-1 text-stone-600 underline">Thôi</button>
    </div>
  )
}
