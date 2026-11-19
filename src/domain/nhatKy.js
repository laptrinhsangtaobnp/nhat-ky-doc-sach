// Nhật ký đọc sách: cảm xúc, câu hỏi gợi ý / trò chuyện, cây, mốc, hành trình cảm xúc, chữ hiển thị.
// Số ngày cây lớn / mốc / "tính chuỗi" (lần ghi được tính cho cây) thật do máy chủ tính — ở đây chỉ để hiển thị và nhắc em.
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

// Câu bố mẹ hỏi con ("5 phút trò chuyện") — dùng kèm câu riêng theo sách do thủ thư nhập (sach.cau_hoi).
export const CAU_TRO_CHUYEN = [
  'Hôm nay con đọc đến đoạn nào rồi? Kể bố mẹ nghe với!',
  'Trong đoạn hôm nay, nhân vật nào làm con chú ý nhất?',
  'Có chỗ nào làm con bật cười hoặc thấy buồn không?',
  'Nếu con được đặt tên khác cho cuốn sách, con đặt là gì?',
  'Con đoán đoạn sau sẽ có chuyện gì?',
  'Có từ nào trong sách con chưa hiểu không? Mình cùng tìm hiểu nhé.',
  'Nhân vật trong sách có giống ai mà con biết không?',
]

// Mốc: theo số ngày cây lớn + Gia đình đọc sách (19/11). Các mã cũ (cuon_*, chuoi_*) giữ để hiện mốc đã đạt trước đó.
export const MOC = {
  ngay_7: { hinh: '🌿', ten: '7 ngày ghi nhật ký', moTa: 'Cây của em đã lớn 7 ngày rồi!' },
  ngay_30: { hinh: '🌳', ten: '30 ngày ghi nhật ký', moTa: 'Cây của em đã lớn 30 ngày. Giỏi quá!' },
  ngay_100: { hinh: '🍎', ten: '100 ngày ghi nhật ký', moTa: 'Cây của em đã ra quả sau 100 ngày. Tuyệt vời!' },
  gia_dinh: { hinh: '👨‍👩‍👧', ten: 'Gia đình đọc sách', moTa: 'Em và bố mẹ đã cùng đọc, cùng ghi 5 lần!' },
  tham_hiem: { hinh: '🧭', ten: 'Nhà thám hiểm', moTa: 'Hộ chiếu của em đã có 5 con tem thể loại khác nhau!' },
  ho_chieu_day: { hinh: '🌏', ten: 'Hộ chiếu đầy', moTa: 'Em đã đọc đủ mọi thể loại của thư viện. Tuyệt vời!' },
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

// Cây đọc sách: lớn theo SỐ NGÀY có ghi (máy chủ đếm, cay_cua). Bỏ lỡ thì ngừng lớn, không bao giờ héo.
export const GIAI_DOAN_CAY = [
  { tu: 0, hinh: '🌰', ten: 'Hạt mầm' },
  { tu: 1, hinh: '🌱', ten: 'Mầm non' },
  { tu: 3, hinh: '🌿', ten: 'Cây con' },
  { tu: 7, hinh: '🌲', ten: 'Cây nhỏ' },
  { tu: 15, hinh: '🌳', ten: 'Cây lớn' },
  { tu: 30, hinh: '🌸', ten: 'Cây ra hoa' },
  { tu: 60, hinh: '🍎', ten: 'Cây ra quả' },
  { tu: 100, hinh: '🏞️', ten: 'Khu vườn đọc sách' },
]

/** Giai đoạn cây theo số ngày: { hinh, ten, tu, sau (giai đoạn kế, null nếu cuối), conLai (số ngày tới giai đoạn kế), phanTram }. */
export function giaiDoanCay(soNgay) {
  const n = Math.max(0, Number(soNgay) || 0)
  const i = GIAI_DOAN_CAY.reduce((k, g, j) => (n >= g.tu ? j : k), 0)   // không dùng findLastIndex (iPhone cũ)
  const gd = GIAI_DOAN_CAY[i], sau = GIAI_DOAN_CAY[i + 1] ?? null
  return {
    ...gd, sau,
    conLai: sau ? sau.tu - n : 0,
    phanTram: sau ? Math.round(((n - gd.tu) / (sau.tu - gd.tu)) * 100) : 100,
  }
}

/** Câu cho học sinh về cây hôm nay. */
export function chuCay({ hom_nay: daGhi, tuan_nay: tuanNay }) {
  return {
    homNay: daGhi ? 'Hôm nay em đã tưới cây rồi 💧' : 'Ghi nhật ký hôm nay để cây lớn thêm nhé!',
    tuan: `Tuần này em ghi ${tuanNay} ngày.`,
  }
}

/** Số thứ tự ngày (để đổi câu gợi ý mỗi ngày, ai cũng thấy cùng câu trong 1 ngày). */
const soNgayTuyetDoi = ngay => Math.floor(Date.parse(`${ngay}T00:00:00Z`) / 86400000)

/** Câu hỏi gợi ý của ngày, lệch thêm `buoc` câu khi em bấm "Câu khác". */
export const cauHoiHomNay = (ngay, buoc = 0) => CAU_GOI_Y[(soNgayTuyetDoi(ngay) + buoc) % CAU_GOI_Y.length]

/** Tách câu hỏi theo sách (mỗi dòng 1 câu) do thủ thư nhập. */
export const tachCauHoi = cauHoi => String(cauHoi ?? '').split('\n').map(c => c.trim()).filter(Boolean)

/** 3 câu "5 phút trò chuyện": câu riêng của sách trước (đổi theo ngày), thêm câu chung cho đủ. */
export function cauTroChuyen(ngay, cauHoiSach, so = 3) {
  const n = soNgayTuyetDoi(ngay)
  const xoay = ds => ds.map((_, i) => ds[(n + i) % ds.length])
  const rieng = tachCauHoi(cauHoiSach)
  return [...(rieng.length ? xoay(rieng).slice(0, 2) : []), ...xoay(CAU_TRO_CHUYEN)].slice(0, so)
}

/**
 * Hành trình cảm xúc 1 cuốn: [{ trang, cam_xuc, ngay }] (theo thứ tự ghi) → [{ cam_xuc, trang, viTri (0–100) }].
 * Có số trang thì đặt theo trang / tổng trang; lần ghi không có trang thì đặt theo thứ tự ghi.
 */
export function viTriHanhTrinh(ds, soTrang) {
  const ds2 = ds ?? []
  const tong = soTrang || Math.max(0, ...ds2.map(x => x.trang ?? 0))
  return ds2.map((x, i) => ({
    cam_xuc: x.cam_xuc, trang: x.trang ?? null,
    viTri: x.trang && tong ? Math.min(100, Math.round((x.trang / tong) * 100))
      : ds2.length === 1 ? 50 : Math.round((i / (ds2.length - 1)) * 100),
  }))
}

/** Giá trị lớn nhất cho thanh kéo trang: số trang của sách, nếu chưa có thì đủ rộng hơn trang em đã ghi. */
export const trangToiDa = (soTrang, trangCuoi) => soTrang || Math.max(200, Math.ceil(((trangCuoi ?? 0) + 50) / 50) * 50)

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
  if (m.includes('chua_den_ngay')) return 'Lá thư này chưa đến ngày mở đâu, em chờ thêm nhé!'
  if (m.includes('forbidden')) return 'Bạn không có quyền làm việc này.'
  if (loi?.code === '23514') return 'Có ô chưa hợp lệ (quá dài hoặc chưa chọn cảm xúc).'
  if (!loi?.code && /fetch|network/i.test(m)) return 'Mất kết nối mạng, thử lại nhé. Chữ em viết vẫn còn trên màn hình.'
  return 'Chưa lưu được, thử lại nhé.'
}
