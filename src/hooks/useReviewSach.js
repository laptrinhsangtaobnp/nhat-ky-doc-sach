// Mục "Các bạn nói gì" của 1 cuốn: tải 1 lần (con số + 30 bài đã duyệt + bài của em), thao tác cập nhật tại chỗ.
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { khongDuyetReview, layReviewSach, vietReview, xoaReview } from '../data/review'
import { loiReview } from '../domain/review'

export function useReviewSach(sachId) {
  const [kq, setKq] = useState(null)          // null = đang tải
  const [ban, setBan] = useState(false)

  useEffect(() => {
    let huy = false
    layReviewSach(sachId).then(d => { if (!huy) setKq(d) }, () => { if (!huy) setKq({ review: [], loi: true }) })
    return () => { huy = true }
  }, [sachId])

  const lam = useCallback(async (viec, loiBao, capNhat) => {
    setBan(true)
    try {
      await viec()
      setKq(capNhat)
      toast.success(loiBao)
      return true
    } catch (loi) {
      toast.error(loiReview(loi), { duration: 6000 })
      return false
    } finally {
      setBan(false)
    }
  }, [])

  const boCuaEm = ds => ds.filter(r => !r.la_cua_em)
  return {
    kq, ban,
    viet: (noiDung, anTen) => lam(() => vietReview(sachId, noiDung, anTen), 'Đã gửi cô thư viện duyệt',
      k => ({ ...k, review: boCuaEm(k.review), cua_em: { noi_dung: noiDung.trim(), an_ten: anTen, trang_thai: 'cho_duyet', ly_do: null } })),
    xoa: () => lam(() => xoaReview(sachId), 'Đã xoá bài giới thiệu', k => ({ ...k, review: boCuaEm(k.review), cua_em: null })),
    go: (id, lyDo) => lam(() => khongDuyetReview(id, lyDo), 'Đã gỡ bài', k => ({ ...k, review: k.review.filter(r => r.id !== id) })),
  }
}
