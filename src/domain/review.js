// Review của bạn bè ("Giới thiệu sách cho bạn"): giới hạn chữ, lý do không duyệt, cách hiện tên, dòng "X bạn đã đọc", lời báo lỗi.
// Máy chủ (sql/2026-11-19_review.sql) mới là nơi quyết: đã đọc xong chưa, ai duyệt, ẩn tên — ở đây chỉ để hiển thị / báo sớm.

export const REVIEW_TOI_THIEU = 10
export const REVIEW_TOI_DA = 300

export const LY_DO_KHONG_DUYET = {
  chua_phu_hop: 'Chưa phù hợp',
  qua_ngan: 'Quá ngắn, em viết thêm nhé',
  lo_thong_tin: 'Có thông tin cá nhân (tên, địa chỉ, số điện thoại…)',
}

export const TRANG_THAI_REVIEW = {
  cho_duyet: { chu: 'Đang chờ cô thư viện duyệt', mau: 'bg-amber-50 text-amber-900' },
  da_duyet: { chu: 'Đã hiện cho các bạn xem', mau: 'bg-emerald-50 text-emerald-900' },
  khong_duyet: { chu: 'Cô chưa duyệt', mau: 'bg-rose-50 text-rose-900' },
}

/** Kiểm trước khi gửi (cùng ngưỡng với máy chủ). Hợp lệ → null, không thì lời nhắc. */
export function kiemReview(noiDung) {
  const n = String(noiDung ?? '').trim().length
  if (n < REVIEW_TOI_THIEU) return `Em viết ít nhất ${REVIEW_TOI_THIEU} chữ cái nhé.`
  if (n > REVIEW_TOI_DA) return `Bài giới thiệu dài quá, em rút gọn dưới ${REVIEW_TOI_DA} chữ cái nhé.`
  return null
}

/** Người viết: "Lan N.T. – lớp 3A"; ẩn tên (máy chủ trả ten = null) → "Một bạn lớp 3A". */
export function tenNguoiViet({ ten, lop }) {
  if (ten) return lop ? `${ten} – lớp ${lop}` : ten
  return lop ? `Một bạn lớp ${lop}` : 'Một bạn'
}

/** "12 bạn đã đọc · 5 bạn lớp 3A" (chỉ con số). Chưa ai đọc → ''. */
export function chuDaDoc({ da_doc: daDoc = 0, cung_lop: cungLop = 0, lop } = {}) {
  if (!daDoc) return ''
  const phan = [`${daDoc} bạn đã đọc`]
  if (lop && cungLop) phan.push(`${cungLop} bạn lớp ${lop}`)
  return phan.join(' · ')
}

export function loiReview(loi) {
  const m = String(loi?.message ?? '')
  if (m.includes('chua_doc_xong')) return 'Em bấm "Em đọc xong rồi" cho cuốn này trước, rồi mới giới thiệu cho bạn nhé.'
  if (m.includes('qua_nhieu_review')) return 'Hôm nay em đã viết 5 bài giới thiệu rồi, mai viết tiếp nhé!'
  if (m.includes('da_thay_doi')) return 'Bài này vừa được sửa hoặc đã xử lý. Bấm Làm mới để xem bản mới nhất.'
  if (m.includes('thieu_ly_do')) return 'Chọn lý do không duyệt.'
  if (m.includes('khong_co_sach')) return 'Không tìm thấy sách này.'
  if (m.includes('forbidden')) return 'Bạn không có quyền làm việc này.'
  if (loi?.code === '23514') return `Bài giới thiệu cần dài từ ${REVIEW_TOI_THIEU} đến ${REVIEW_TOI_DA} chữ cái.`
  if (!loi?.code && /fetch|network/i.test(m)) return 'Mất kết nối mạng, thử lại nhé. Chữ em viết vẫn còn trên màn hình.'
  return 'Chưa lưu được, thử lại nhé.'
}
