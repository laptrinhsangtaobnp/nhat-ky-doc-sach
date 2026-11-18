// Ngày theo giờ Việt Nam (máy chủ cũng tính "hôm nay" theo Asia/Ho_Chi_Minh). Hàm thuần.

const MUI_GIO = 'Asia/Ho_Chi_Minh'

/** "YYYY-MM-DD" của hôm nay (hoặc của 1 thời điểm) theo giờ Việt Nam. */
export function ngayVN(luc = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: MUI_GIO, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(luc))
}

/** Số ngày từ hôm nay đến hạn (âm = đã quá). Cả hai dạng "YYYY-MM-DD". */
export function soNgayDen(han, homNay = ngayVN()) {
  return Math.round((Date.parse(han) - Date.parse(homNay)) / 86400000)
}

/** "2026-11-25" hoặc thời điểm ISO → "25/11" (thêm năm nếu khác năm hiện tại). */
export function chuNgay(ngay, homNay = ngayVN()) {
  if (!ngay) return ''
  const d = /^\d{4}-\d{2}-\d{2}$/.test(ngay) ? ngay : ngayVN(ngay)
  const [n, t, ng] = d.split('-')
  return n === homNay.slice(0, 4) ? `${ng}/${t}` : `${ng}/${t}/${n}`
}
