// Thử thách lớp theo số ngày ghi. Máy chủ đếm ngày và quyết định (tao_thu_thach kiểm lại mọi điều kiện).
// Ở đây: kiểm trước để báo sớm trên form, tính chữ hiển thị. Hàm thuần.
import { soNgayDen } from './ngay'

export const TT_TOI_DA_NGAY = 62
export const TT_LUI_TOI_DA = 31          // bắt đầu sớm nhất: 31 ngày trước hôm nay

/** "YYYY-MM-DD" + n ngày. */
export function congNgay(ngay, n) {
  const d = new Date(`${ngay}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Số ngày của khoảng [tu, den] (tính cả 2 đầu). */
export const doDai = (tu, den) => soNgayDen(den, tu) + 1

/** Form mặc định: 4 tuần từ hôm nay, mỗi em 12 ngày. */
export const thuThachMau = homNay => ({ ten: 'Thử thách 4 tuần: cây đọc sách cả lớp', tu: homNay, den: congNgay(homNay, 27), soNgay: 12 })

/** Kiểm form như máy chủ → câu lỗi hoặc null. */
export function kiemThuThach({ ten, tu, den, soNgay }, homNay) {
  const t = String(ten ?? '').trim()
  if (t.length < 3 || t.length > 80) return 'Tên thử thách từ 3 đến 80 ký tự.'
  if (!tu || !den) return 'Chọn ngày bắt đầu và ngày kết thúc.'
  if (den < tu) return 'Ngày kết thúc phải sau ngày bắt đầu.'
  if (doDai(tu, den) > TT_TOI_DA_NGAY) return `Thử thách dài tối đa ${TT_TOI_DA_NGAY} ngày.`
  if (den < homNay) return 'Ngày kết thúc đã qua.'
  if (soNgayDen(tu, homNay) < -TT_LUI_TOI_DA) return `Ngày bắt đầu không quá ${TT_LUI_TOI_DA} ngày trước.`
  const n = Number(soNgay)
  if (!Number.isInteger(n) || n < 1 || n > doDai(tu, den)) return `Số ngày cần ghi từ 1 đến ${doDai(tu, den)}.`
  return null
}

/** Trạng thái + chữ cho 1 thử thách (máy chủ trả) theo hôm nay. */
export function tinhTrangThuThach(tt, homNay) {
  const trangThai = tt.tu > homNay ? 'sap' : tt.den < homNay ? 'xong' : 'dang'
  const conNgay = soNgayDen(tt.den, homNay)
  const chu = trangThai === 'sap' ? `Bắt đầu sau ${soNgayDen(tt.tu, homNay)} ngày nữa`
    : trangThai === 'xong' ? 'Đã kết thúc'
    : conNgay === 0 ? 'Hôm nay là ngày cuối' : `Còn ${conNgay} ngày`
  return { trangThai, conNgay, chu }
}

/** Phần trăm (0–100) của em: số ngày đã ghi / số ngày cần. */
export const phanTramEm = (coNgay, canNgay) => Math.min(100, Math.round((coNgay / Math.max(1, canNgay)) * 100))

/** Câu khích lệ cho em. */
export function loiEm(coNgay, canNgay, trangThai) {
  if (coNgay >= canNgay) return 'Em đã hoàn thành thử thách! 🏅'
  if (trangThai === 'xong') return `Em đã ghi ${coNgay} ngày. Lần sau cố lên nhé!`
  if (trangThai === 'sap') return 'Thử thách sắp bắt đầu, em chuẩn bị sách nhé!'
  return `Còn ${canNgay - coNgay} ngày ghi nữa là em đạt!`
}

/** Mã lỗi máy chủ → câu dễ hiểu. */
export function loiThuThach(loi) {
  const m = String(loi?.message ?? '')
  if (m.includes('dang_co_thu_thach')) return 'Lớp đang có thử thách (hoặc trùng thời gian với thử thách trước). Kết thúc thử thách đó trước nhé.'
  if (m.includes('sai_ten')) return 'Tên thử thách từ 3 đến 80 ký tự.'
  if (m.includes('sai_ngay')) return 'Ngày chưa hợp lệ (tối đa 62 ngày, ngày kết thúc chưa qua).'
  if (m.includes('sai_so_ngay')) return 'Số ngày cần ghi không được dài hơn thử thách.'
  if (m.includes('da_ket_thuc')) return 'Thử thách này đã kết thúc rồi.'
  if (m.includes('chua_co_lop')) return 'Chưa chọn lớp (hoặc thầy cô chưa được gắn lớp chủ nhiệm).'
  if (m.includes('forbidden')) return 'Bạn không có quyền làm việc này.'
  return 'Chưa lưu được, thử lại nhé.'
}
