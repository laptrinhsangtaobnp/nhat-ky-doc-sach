// Mượn – trả: chữ hiển thị theo trạng thái, hạn, lỗi máy chủ. Quy tắc thật (tối đa, còn bản, ai được làm gì) ở máy chủ.
import { chuNgay, soNgayDen } from './ngay'

export const DANG_DUNG = ['dat_truoc', 'da_soan', 'dang_muon']

export const TEN_TRANG_THAI = {
  dat_truoc: 'Đặt trước', da_soan: 'Đã soạn', dang_muon: 'Đang mượn', da_tra: 'Đã trả', mat: 'Báo mất', huy: 'Đã huỷ',
}

/** Đặt trước này đã có bản trên kệ cho em chưa (đứng trong hàng chờ ≤ số bản còn). */
export const coBanChoEm = l => l.trang_thai === 'dat_truoc' && l.thu_tu_cho <= l.con_ban

/** Hạn (trả / giữ) → { chu, mau } cho nhân viên: "Quá hạn 3 ngày" (đỏ) · "Hôm nay" (cam) · "Còn 2 ngày". */
export function nhanHan(han, homNay) {
  if (!han) return { chu: '', mau: '' }
  const n = soNgayDen(han, homNay)
  if (n < 0) return { chu: `Quá hạn ${-n} ngày`, mau: 'do' }
  if (n === 0) return { chu: 'Hạn hôm nay', mau: 'cam' }
  return { chu: `Còn ${n} ngày (${chuNgay(han, homNay)})`, mau: '' }
}

/** Câu báo cho học sinh về 1 lượt: { tieuDe, chiTiet, mau } — mau: 'xanh' | 'cam' | 'do' | 'xam'. */
export function moTaChoEm(l, homNay) {
  switch (l.trang_thai) {
    case 'dat_truoc':
      return coBanChoEm(l)
        ? { tieuDe: 'Em đã đặt trước', chiTiet: 'Cô thư viện sẽ soạn sách cho em. Soạn xong, app sẽ báo em lên nhận.', mau: 'xanh' }
        : { tieuDe: `Em đang chờ (thứ ${l.thu_tu_cho})`, chiTiet: 'Các bạn đang mượn hết sách này. Khi có bạn trả, cô sẽ soạn cho em.', mau: 'cam' }
    case 'da_soan': {
      const n = soNgayDen(l.han_giu, homNay)
      return n < 0
        ? { tieuDe: 'Sách đang chờ em!', chiTiet: `Đã qua hạn nhận (${chuNgay(l.han_giu, homNay)}). Em lên thư viện sớm nhé, nếu không cô sẽ cất sách lại.`, mau: 'do' }
        : { tieuDe: 'Sách đã soạn xong!', chiTiet: `Em lên thư viện nhận sách ${n === 0 ? 'trong hôm nay' : `trước hết ngày ${chuNgay(l.han_giu, homNay)}`}.`, mau: 'xanh' }
    }
    case 'dang_muon': {
      const n = soNgayDen(l.han_tra, homNay)
      if (n < 0) return { tieuDe: 'Em đang mượn — đã quá hạn', chiTiet: `Quá hạn ${-n} ngày. Em mang sách trả thư viện nhé.`, mau: 'do' }
      if (n === 0) return { tieuDe: 'Em đang mượn', chiTiet: 'Hôm nay là hạn trả.', mau: 'cam' }
      return { tieuDe: 'Em đang mượn', chiTiet: `Hạn trả: ${chuNgay(l.han_tra, homNay)} (còn ${n} ngày).`, mau: n <= 1 ? 'cam' : 'xanh' }
    }
    case 'da_tra': return { tieuDe: 'Đã trả', chiTiet: chuNgay(l.ngay_xong, homNay), mau: 'xam' }
    case 'mat': return { tieuDe: 'Báo mất', chiTiet: chuNgay(l.ngay_xong, homNay), mau: 'xam' }
    case 'huy': return { tieuDe: l.ly_do_huy === 'hoc_sinh_huy' ? 'Em đã huỷ' : 'Cô đã huỷ', chiTiet: chuNgay(l.ngay_xong, homNay), mau: 'xam' }
    default: return { tieuDe: '', chiTiet: '', mau: 'xam' }
  }
}

const LOI = {
  forbidden: 'Bạn không có quyền làm việc này.',
  khong_co: 'Không tìm thấy lượt mượn này (có thể đã được xử lý). Bấm Làm mới.',
  khong_co_sach: 'Không tìm thấy sách này.',
  het_sach: 'Thư viện hiện không có bản nào của sách này.',
  da_dat: 'Em đã đặt hoặc đang mượn cuốn này rồi.',
  qua_toi_da: 'Đã giữ đủ số sách tối đa. Trả bớt hoặc huỷ một cuốn đặt trước rồi đặt tiếp nhé.',
  het_ban: 'Không còn bản nào trên kệ (các bản đã soạn hoặc đang được mượn).',
  da_soan_roi: 'Cô đã soạn sách cho em rồi nên không huỷ được. Em lên thư viện nói với cô nhé.',
  sai_trang_thai: 'Lượt này đã đổi trạng thái. Bấm Làm mới để xem lại.',
  khong_phai_hoc_sinh: 'Chỉ cho học sinh (tài khoản đang hoạt động) mượn được.',
}

/** Lỗi từ hàm máy chủ → câu dễ hiểu. */
export function loiMuonTra(loi) {
  const m = String(loi?.message ?? '')
  const ma = Object.keys(LOI).find(k => m === k || m.startsWith(k + ':') || m.includes(`"${k}"`))
  if (ma) return LOI[ma]
  if (loi?.code === '23505') return LOI.da_dat
  if (!loi?.code && /fetch|network/i.test(m)) return 'Mất kết nối mạng, thử lại nhé.'
  return 'Không làm được, thử lại sau.'
}

/**
 * Bỏ 1 lượt đặt trước khỏi danh sách "Cần soạn" và sửa tại chỗ các lượt cùng sách phía sau:
 * thứ tự chờ lùi lên 1; nếu lượt đó đã lấy 1 bản trên kệ (soạn / cho mượn) thì số bản còn giảm 1.
 */
export function boLuotKhoiHang(ds, luot, layBan) {
  return ds.filter(l => l.id !== luot.id).map(l => {
    if (l.sach.id !== luot.sach.id || l.trang_thai !== 'dat_truoc') return l
    return {
      ...l,
      thu_tu_cho: l.thu_tu_cho > luot.thu_tu_cho ? l.thu_tu_cho - 1 : l.thu_tu_cho,
      con_ban: layBan ? Math.max(l.con_ban - 1, 0) : l.con_ban,
    }
  })
}
