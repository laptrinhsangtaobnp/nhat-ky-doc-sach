// Đăng nhập học sinh bằng mã lớp + PIN: chuẩn hoá mã, câu báo lỗi, danh sách "các con trên máy này". Hàm thuần.
// Kiểm PIN, đếm sai, khoá: máy chủ làm (Neon kiem_pin qua Edge Function dang-nhap-pin).
import { chuNgay } from './ngay'

export const MA_LOP_HOP_LE = /^[A-Z2-9]{6}$/
export const TOI_DA_CON = 6                       // số bạn nhớ trên 1 máy (anh chị em dùng chung điện thoại)

/** "ab c-12x" → "ABC12X" (bỏ khoảng trắng / gạch, viết hoa; O→0 không đổi vì mã không có 0 / O). */
export const chuanMaLop = s => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)

/** Kết quả máy chủ khi PIN chưa đúng → câu cho em. */
export function loiPin(kq, homNay) {
  if (kq?.loi === 'sai') return kq.con ? `PIN chưa đúng. Em thử lại nhé (còn ${kq.con} lần trước khi phải chờ).` : 'PIN chưa đúng. Em thử lại nhé.'
  if (kq?.loi === 'khoa') {
    const den = new Date(kq.den)
    const gio = den.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })
    const ngay = den.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
    return `Em nhập sai nhiều lần nên phải chờ đến ${gio}${ngay !== homNay ? ` ${chuNgay(ngay, homNay)}` : ''}. Nếu quên PIN, em hỏi cô giáo nhé.`
  }
  if (kq?.loi === 'lop_khoa') return 'Lớp em tạm khoá đăng nhập hôm nay vì có nhiều lần nhập sai. Em báo cô giáo nhé.'
  if (kq?.loi === 'ma_sai') return 'Không tìm thấy lớp với mã này. Em xem lại mã lớp trên phiếu nhé.'
  return 'Chưa vào được. Em thử lại nhé.'
}

/** Thêm / đưa lên đầu 1 bạn trong danh sách nhớ trên máy (không trùng, tối đa TOI_DA_CON). */
export function themCon(ds, con) {
  return [con, ...(ds ?? []).filter(c => c.id !== con.id)].slice(0, TOI_DA_CON)
}

/** Bỏ 1 bạn khỏi danh sách nhớ. */
export const boCon = (ds, id) => (ds ?? []).filter(c => c.id !== id)
