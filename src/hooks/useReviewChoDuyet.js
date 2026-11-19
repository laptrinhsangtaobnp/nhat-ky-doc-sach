// Hàng chờ duyệt review (nhân viên): tải 1 lần khi mở trang Mượn – trả (≤ 50 bài + tổng số), duyệt / không duyệt cập nhật tại chỗ.
// Không tự hỏi lại định kỳ — dùng nút Làm mới của trang.
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { duyetReview, khongDuyetReview, layReviewChoDuyet } from '../data/review'
import { loiReview } from '../domain/review'

export function useReviewChoDuyet() {
  const [kq, setKq] = useState(null)            // { so, ds } | null = đang tải
  const [dangLam, setDangLam] = useState(null)

  const tai = useCallback(() => layReviewChoDuyet().then(setKq, loi => toast.error(loiReview(loi))), [])
  useEffect(() => { tai() }, [tai])

  async function xuLy(r, lyDo) {
    setDangLam(r.id)
    try {
      if (lyDo) await khongDuyetReview(r.id, lyDo)
      else await duyetReview(r.id, r.sua_luc)
      toast.success(lyDo ? 'Đã không duyệt — em sẽ thấy lý do' : 'Đã duyệt — các bạn đã thấy bài')
      setKq(k => ({ so: Math.max(0, k.so - 1), ds: k.ds.filter(x => x.id !== r.id) }))
      return true
    } catch (loi) {
      toast.error(loiReview(loi), { duration: 6000 })
      return false
    } finally {
      setDangLam(null)
    }
  }

  return { kq, dangLam, taiLai: tai, duyet: r => xuLy(r, null), khongDuyet: (r, lyDo) => xuLy(r, lyDo) }
}
