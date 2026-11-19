// Ô "Giới thiệu sách cho bạn" (điều khiển từ ngoài): chữ ≤ 300 + đếm chữ + "Ẩn tên". Dùng ở hộp Đọc xong và trang sách.
import { REVIEW_TOI_DA } from '../../domain/review'

export default function OVietReview({ noiDung, setNoiDung, anTen, setAnTen, lop }) {
  return (
    <div className="space-y-2 rounded-xl bg-sky-50 p-3">
      <label className="block">
        <span className="font-medium">📣 Giới thiệu sách cho bạn (không bắt buộc)</span>
        <span className="block text-sm text-stone-600">Cô thư viện đọc và duyệt xong thì các bạn trong trường mới thấy. Đừng ghi tên, địa chỉ hay số điện thoại nhé.</span>
        <textarea rows={3} maxLength={REVIEW_TOI_DA} value={noiDung} onChange={e => setNoiDung(e.target.value)}
          placeholder="Vì sao bạn nên đọc cuốn này?" className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-base" />
        <span className="block text-right text-xs text-stone-500">{noiDung.trim().length}/{REVIEW_TOI_DA}</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={anTen} onChange={e => setAnTen(e.target.checked)} className="size-5" />
        <span>Ẩn tên em — chỉ hiện “Một bạn{lop ? ` lớp ${lop}` : ''}”</span>
      </label>
    </div>
  )
}
