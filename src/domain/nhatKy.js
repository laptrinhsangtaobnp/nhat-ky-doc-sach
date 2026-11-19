// Nhật ký đọc sách: cảm xúc, câu hỏi gợi ý, mốc, chữ hiển thị. Chuỗi / mốc / "tính chuỗi" thật do máy chủ tính —
// các hàm ở đây chỉ để hiển thị và nhắc em trước khi lưu.
import { soNgayDen } from './ngay'

export const CAM_XUC = [
  { ma: 'vui', hinh: '😄', ten: 'Vui' },
  { ma: 'buon', hinh: '😢', ten: 'Buồn' },
  { ma: 'bat_ngo', hinh: '😲', ten: 'Bất ngờ' },
  { ma: 'hoi_hop', hinh: '😰', ten: 'Hồi hộp' },
  { ma: 'xuc_dong', hinh: '🥺', ten: 'Xúc động' },
  { ma: 'suy_nghi', hinh: '🤔', ten: 'Suy nghĩ' },
  { ma: 'buon_cuoi', hinh: '😂', ten: 'Buồn cười' },
]
export const camXuc = ma => CAM_XUC.find(c => c.ma === ma) ?? { ma, hinh: '📖', ten: ma }

export const MUC_THICH = [
  { so: 1, hinh: '😞', ten: 'Không thích' }, { so: 2, hinh: '😐', ten: 'Bình thường' }, { so: 3, hinh: '🙂', ten: 'Khá hay' },
  { so: 4, hinh: '😊', ten: 'Hay' }, { so: 5, hinh: '🤩', ten: 'Rất hay' },
]

export const CAU_GOI_Y = [
  'Nhân vật em thích nhất là ai? Vì sao?',
  'Nếu em là nhân vật chính, em sẽ làm gì?',
  'Đoạn nào làm em nhớ nhất? Em cảm thấy thế nào?',
  'Em học được điều gì từ câu chuyện?',
  'Em đoán tiếp theo câu chuyện sẽ ra sao?',
  'Câu chuyện làm em nhớ đến ai hoặc chuyện gì của em?',
  'Em muốn hỏi tác giả hoặc nhân vật câu gì?',
  'Em có muốn giới thiệu cuốn này cho bạn không? Vì sao?',
]

export const MOC = {
  cuon_1: { hinh: '🌱', ten: 'Cuốn sách đầu tiên', moTa: 'Em đã đọc xong cuốn sách đầu tiên!' },
  cuon_5: { hinh: '📚', ten: '5 cuốn sách', moTa: 'Em đã đọc xong 5 cuốn sách!' },
  cuon_10: { hinh: '🌟', ten: '10 cuốn sách', moTa: 'Em đã đọc xong 10 cuốn sách!' },
  cuon_20: { hinh: '🏆', ten: '20 cuốn sách', moTa: 'Em đã đọc xong 20 cuốn sách. Tuyệt vời!' },
  chuoi_4: { hinh: '🔥', ten: 'Chuỗi 4 tuần', moTa: 'Em ghi nhật ký đều đặn 4 tuần liền!' },
  chuoi_8: { hinh: '💎', ten: 'Chuỗi 8 tuần', moTa: 'Em ghi nhật ký đều đặn 8 tuần liền!' },
}

/** Đếm chữ (từ) như máy chủ (so_chu) — chỉ để nhắc em "còn thiếu mấy chữ". */
export function demChu(t) {
  const s = String(t ?? '').trim()
  return s ? s.split(/\s+/).length : 0
}

/** Lần ghi này có đủ dài để tính chuỗi không (máy chủ mới là nơi quyết định). */
export const duDaiTinhChuoi = (doanNho, emNghi, toiThieu) => Math.max(demChu(doanNho), demChu(emNghi)) >= toiThieu

/** Em còn sửa / xoá được lần ghi này không (trong 7 ngày — máy chủ cũng chặn). */
export const conSuaDuoc = (ngay, homNay) => soNgayDen(ngay, homNay) >= -7

/** Dòng nhắc trên trang chủ: null nếu em mới ghi gần đây. */
export function loiNhac(lanGhiCuoi, homNay) {
  if (!lanGhiCuoi) return 'Em chưa ghi nhật ký lần nào. Đọc xong vài trang, em ghi lại đoạn em nhớ nhé!'
  const n = -soNgayDen(lanGhiCuoi, homNay)
  return n >= 3 ? `Đã ${n} ngày em chưa ghi nhật ký. Hôm nay em đọc gì?` : null
}

/** Chữ về chuỗi tuần cho học sinh. */
export function chuChuoi({ tuan_nay: nay, can, chuoi }) {
  const conLai = Math.max(can - nay, 0)
  const tuan = conLai === 0 ? 'Tuần này em đã đủ — giữ được chuỗi!' : `Tuần này em ghi ${nay}/${can} lần, còn ${conLai} lần nữa.`
  return { tuan, chuoi: chuoi > 0 ? `Chuỗi ${chuoi} tuần 🔥` : 'Bắt đầu chuỗi tuần đầu tiên nào!' }
}

/** Cảm xúc xuất hiện nhiều nhất trong { vui: 3, buon: 1 } → mục CAM_XUC (null nếu chưa có). */
export function camXucNhieuNhat(dem) {
  const [ma] = Object.entries(dem ?? {}).sort((a, b) => b[1] - a[1])[0] ?? []
  return ma ? camXuc(ma) : null
}

/** "2026-11" → "T11". */
export const chuThang = thang => `T${Number(thang.slice(5, 7))}`

/** Mã lỗi máy chủ (nhật ký) → câu dễ hiểu. */
export function loiNhatKy(loi) {
  const m = String(loi?.message ?? '')
  if (m.includes('chua_ghi_nhat_ky')) return 'Em ghi ít nhất 1 lần nhật ký về cuốn này rồi mới đánh dấu đọc xong nhé.'
  if (m.includes('het_han_sua')) return 'Nhật ký đã quá 7 ngày nên không sửa / xoá được nữa.'
  if (m.includes('qua_nhieu_lan')) return 'Hôm nay em đã ghi rất nhiều rồi, mai ghi tiếp nhé!'
  if (m.includes('khong_co_sach')) return 'Không tìm thấy sách này.'
  if (m.includes('forbidden')) return 'Bạn không có quyền làm việc này.'
  if (loi?.code === '23514') return 'Có ô chưa hợp lệ (quá dài hoặc chưa chọn cảm xúc).'
  if (!loi?.code && /fetch|network/i.test(m)) return 'Mất kết nối mạng, thử lại nhé. Chữ em viết vẫn còn trên màn hình.'
  return 'Chưa lưu được, thử lại nhé.'
}
