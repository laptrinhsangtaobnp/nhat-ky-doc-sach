// Đọc danh mục sách từ bảng Excel (mảng dòng, mỗi dòng mảng ô) — hàm thuần, không đọc tệp, không gọi mạng.
// Cột cần: "Mã sách", "Tên sách". Tuỳ chọn: Tác giả, NXB (hoặc "NXB - năm" gộp), Năm, Chủ đề (≤ 2, cách nhau ; hoặc ,),
// Khối ("3", "3-4", "3, 4"), Số bản, Vị trí, Giới thiệu. Máy chủ (nhap_danh_muc) kiểm lại lần nữa.
import { boDau } from './taiKhoan.js'

export const MA_SACH_HOP_LE = /^[A-Z0-9._-]{1,30}$/
export const TOI_DA_CHU_DE = 2

const chu = o => boDau(o).replace(/[^a-z0-9]+/g, ' ').trim()

/** " tn 001 " → "TN001"; không hợp lệ → null. */
export function chuanHoaMaSach(s) {
  const t = String(s ?? '').toUpperCase().replace(/\s+/g, '')
  return MA_SACH_HOP_LE.test(t) ? t : null
}

/** "Kim Đồng, 2020" / "NXB Giáo dục - 2019" / "2021" → { nxb, nam }. Năm ngoài 1900–2100 bỏ qua. */
export function tachNxbNam(s) {
  let t = String(s ?? '').trim()
  let nam = null
  const m = t.match(/(?:^|[\s,;.\-–/()])((?:19|20)\d{2})\)?\s*$/)
  if (m) { nam = Number(m[1]); t = t.slice(0, m.index).trim() }
  t = t.replace(/[\s,;.\-–/(]+$/, '').replace(/^(nxb|nhà xuất bản)\s*/i, '').trim()
  return { nxb: t || null, nam }
}

/** "3" → {3,3}; "3-4", "3–5", "3, 4", "Khối 3 và 4" → khoảng; trống → {1,5}; sai → null. */
export function docKhoi(s) {
  const so = String(s ?? '').match(/[1-5]/g)
  if (String(s ?? '').trim() === '') return { khoi_tu: 1, khoi_den: 5 }
  if (!so || /[06-9]/.test(String(s).replace(/[^0-9]/g, ''))) return null
  const ds = so.map(Number)
  return { khoi_tu: Math.min(...ds), khoi_den: Math.max(...ds) }
}

/** "Cổ tích; Khoa học" → ["Cổ tích", "Khoa học"] (bỏ trùng, giữ chữ hoa như đã gõ). */
export function tachChuDe(s) {
  const ds = String(s ?? '').split(/[;,/|\n]+/).map(x => x.trim().replace(/\s+/g, ' ')).filter(Boolean)
  const da = new Set()
  return ds.filter(x => (da.has(x.toLowerCase()) ? false : da.add(x.toLowerCase())))
}

function timCot(dong) {
  const ten = dong.map(chu)
  const vt = re => ten.findIndex(t => re.test(t))
  return {
    ma: vt(/^(ma sach|ma|ma so|so dang ky|sdk|ma vach)$/),
    ten: vt(/^(ten sach|ten|nhan de|ten tai lieu)$/),
    tacGia: vt(/^(tac gia|tg)$/),
    nxbNam: vt(/^(nxb nam|nha xuat ban nam|nxb va nam)$/),
    nxb: vt(/^(nxb|nha xuat ban)$/),
    nam: vt(/^(nam|nam xb|nam xuat ban)$/),
    chuDe: vt(/^(chu de|the loai)$/),
    khoi: vt(/^(khoi|khoi lop|danh cho khoi|lop)$/),
    soBan: vt(/^(so ban|so luong|sl)$/),
    viTri: vt(/^(vi tri|ke|vi tri ke)$/),
    gioiThieu: vt(/^(gioi thieu|tom tat|gioi thieu ngan|noi dung)$/),
  }
}

/** Đọc bảng → { sach: [...], loi: [{dong, ly_do}], chuDeMoi: [tên chưa có trong chuDeCo] }. */
export function docBangSach(dongs, chuDeCo = []) {
  let dau = -1, cot = null
  for (let i = 0; i < Math.min(10, dongs.length); i++) {
    const c = timCot(dongs[i] ?? [])
    if (c.ma >= 0 && c.ten >= 0) { dau = i; cot = c; break }
  }
  if (dau < 0) return { sach: [], loi: [{ dong: 0, ly_do: 'Không thấy dòng tiêu đề có cột "Mã sách" và "Tên sách"' }], chuDeMoi: [] }

  const coSan = new Set(chuDeCo.map(t => t.toLowerCase()))
  const chuDeMoi = new Map()
  const sach = [], loi = [], daMa = new Map()
  for (let i = dau + 1; i < dongs.length; i++) {
    const d = dongs[i] ?? []
    const o = k => (cot[k] >= 0 ? String(d[cot[k]] ?? '').trim() : '')
    const soDong = i + 1
    if (!o('ma') && !o('ten')) continue
    const bao = ly_do => loi.push({ dong: soDong, ly_do })

    const ma = chuanHoaMaSach(o('ma'))
    if (!ma) { bao(`Mã sách "${o('ma')}" không hợp lệ (chỉ chữ không dấu, số, dấu . _ -, tối đa 30 ký tự)`); continue }
    if (daMa.has(ma)) { bao(`Mã ${ma} trùng với dòng ${daMa.get(ma)}`); continue }
    const ten = o('ten').replace(/\s+/g, ' ')
    if (!ten) { bao('Thiếu tên sách'); continue }
    if (ten.length > 200) { bao('Tên sách quá dài (> 200 ký tự)'); continue }
    const khoi = docKhoi(o('khoi'))
    if (!khoi) { bao(`Khối "${o('khoi')}" không hợp lệ (ví dụ đúng: 3 hoặc 3-4)`); continue }
    let soBan = 1
    if (o('soBan')) {
      soBan = Number(o('soBan'))
      if (!Number.isInteger(soBan) || soBan < 0 || soBan > 999) { bao(`Số bản "${o('soBan')}" không hợp lệ`); continue }
    }
    const tach = tachNxbNam(o('nxbNam'))
    const nxb = o('nxb') || tach.nxb
    let nam = tach.nam
    if (o('nam')) {
      nam = Number(o('nam'))
      if (!Number.isInteger(nam) || nam < 1900 || nam > 2100) { bao(`Năm "${o('nam')}" không hợp lệ`); continue }
    }
    const chuDe = tachChuDe(o('chuDe'))
    if (chuDe.length > TOI_DA_CHU_DE) { bao(`Tối đa ${TOI_DA_CHU_DE} chủ đề mỗi sách`); continue }
    if (chuDe.some(c => c.length > 50)) { bao('Tên chủ đề quá dài (> 50 ký tự)'); continue }
    const tacGia = o('tacGia'), viTri = o('viTri'), gioiThieu = o('gioiThieu')
    if (tacGia.length > 150 || (nxb ?? '').length > 100 || viTri.length > 50) { bao('Tác giả / NXB / vị trí quá dài'); continue }
    if (gioiThieu.length > 600) { bao('Giới thiệu quá dài (> 600 ký tự)'); continue }

    for (const c of chuDe) if (!coSan.has(c.toLowerCase())) chuDeMoi.set(c.toLowerCase(), c)
    daMa.set(ma, soDong)
    sach.push({
      dong: soDong, ma_sach: ma, ten, tac_gia: tacGia, nxb: nxb ?? '', nam, ...khoi,
      so_ban: soBan, vi_tri: viTri, gioi_thieu: gioiThieu, chu_de: chuDe,
    })
  }
  return { sach, loi, chuDeMoi: [...chuDeMoi.values()] }
}

/** "Khối 3–4" / "Khối 3" / "Mọi khối" để hiển thị. */
export function chuKhoi(khoiTu, khoiDen) {
  if (khoiTu <= 1 && khoiDen >= 5) return 'Mọi khối'
  return khoiTu === khoiDen ? `Khối ${khoiTu}` : `Khối ${khoiTu}–${khoiDen}`
}

/** Chữ người dùng gõ ô tìm → mẫu tìm trên cột `tim` (đã bỏ dấu). Bỏ ký tự đặc biệt của bộ lọc. */
export function mauTim(s) {
  return boDau(s).replace(/[%,()*\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
}
