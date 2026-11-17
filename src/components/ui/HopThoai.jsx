// Khung hộp thoại dùng chung (nền mờ, tiêu đề, nút đóng). Trên điện thoại chiếm gần hết màn hình.
import { X } from 'lucide-react'

export default function HopThoai({ tieuDe, onDong, children, rong = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/40 p-2 sm:p-6" role="dialog" aria-modal="true" aria-label={tieuDe}>
      <div className={`w-full ${rong} rounded-2xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
          <h2 className="text-lg font-semibold">{tieuDe}</h2>
          <button onClick={onDong} className="rounded-lg p-1 text-stone-500 hover:bg-stone-100" aria-label="Đóng"><X size={20} /></button>
        </div>
        <div className="space-y-4 p-5">{children}</div>
      </div>
    </div>
  )
}
