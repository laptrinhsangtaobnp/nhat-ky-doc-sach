// Đọc danh sách học sinh từ bảng Excel (mảng các dòng, mỗi dòng mảng ô) — hàm thuần, không đọc tệp, không gọi mạng.
// Bảng cần cột "Họ và tên" (hoặc 2 cột "Họ" + "Tên") và "Lớp"; tuỳ chọn "Tên đăng nhập", "Mật khẩu".
import { boDau, goiYTenDangNhap, taoMatKhau, TEN_DANG_NHAP_HOP_LE } from './taiKhoan.js'

const chu = o => boDau(o).replace(/[^a-z0-9]+/g, ' ').trim()

/** Chuẩn hoá tên lớp: " 4 a " → "4A", "lớp 3b" → "3B". Không hợp lệ → null. */
export function chuanHoaLop(s) {
  const t = String(s ?? '').toUpperCase().replace(/^\s*L[ỚO]P\s*/i, '').replace(/\s+/g, '')
  return /^[1-5][A-Z0-9]{0,4}$/.test(t) ? t : null
}

/** Khối của lớp ("4A" → 4). */
export const khoiCuaLop = lop => Number(String(lop)[0])

function timCot(dong) {
  const ten = dong.map(chu)
  const vt = re => ten.findIndex(t => re.test(t))
  return {
    hoTen: vt(/^(ho va ten|ho ten|ho ten hoc sinh|ho va ten hoc sinh)$/),
    ho: vt(/^(ho|ho dem|ho va ten dem|ho va dem)$/),
    ten: vt(/^ten$/),
    lop: vt(/^lop$/),
    tenDangNhap: vt(/^(ten dang nhap|username|tai khoan)$/),
    matKhau: vt(/^(mat khau|password)$/),
  }
}

/** Đọc bảng: tìm dòng tiêu đề trong 10 dòng đầu, trả { hocSinh: [{dong, ho_ten, lop, khoi, ten_dang_nhap, mat_khau}], loi: [{dong, ly_do}] }. */
export function docBangHocSinh(dongs) {
  let dau = -1, cot = null
  for (let i = 0; i < Math.min(10, dongs.length); i++) {
    const c = timCot(dongs[i] ?? [])
    if ((c.hoTen >= 0 || (c.ho >= 0 && c.ten >= 0)) && c.lop >= 0) { dau = i; cot = c; break }
  }
  if (dau < 0) return { hocSinh: [], loi: [{ dong: 0, ly_do: 'Không thấy dòng tiêu đề có cột "Họ và tên" và "Lớp"' }] }

  const hocSinh = [], loi = []
  for (let i = dau + 1; i < dongs.length; i++) {
    const d = dongs[i] ?? []
    const o = k => (cot[k] >= 0 ? String(d[cot[k]] ?? '').trim() : '')
    const hoTen = (cot.hoTen >= 0 ? o('hoTen') : `${o('ho')} ${o('ten')}`).replace(/\s+/g, ' ').trim()
    const lopGoc = o('lop')
    if (!hoTen && !lopGoc) continue                                   // dòng trống
    const soDong = i + 1                                               // số dòng như Excel hiển thị
    const lop = chuanHoaLop(lopGoc)
    const tenDN = o('tenDangNhap').toLowerCase()
    if (!hoTen) { loi.push({ dong: soDong, ly_do: 'Thiếu họ tên' }); continue }
    if (hoTen.length > 100) { loi.push({ dong: soDong, ly_do: 'Họ tên quá dài' }); continue }
    if (!lop) { loi.push({ dong: soDong, ly_do: `Lớp "${lopGoc}" không hợp lệ (ví dụ đúng: 4A)` }); continue }
    if (tenDN && !TEN_DANG_NHAP_HOP_LE.test(tenDN)) { loi.push({ dong: soDong, ly_do: 'Tên đăng nhập chỉ gồm chữ không dấu, số, dấu chấm, 3–30 ký tự' }); continue }
    const mk = o('matKhau')
    if (mk && mk.length < 6) { loi.push({ dong: soDong, ly_do: 'Mật khẩu ít nhất 6 ký tự' }); continue }
    hocSinh.push({ dong: soDong, ho_ten: hoTen, lop, khoi: khoiCuaLop(lop), ten_dang_nhap: tenDN, mat_khau: mk })
  }
  return { hocSinh, loi }
}

/** Điền tên đăng nhập / mật khẩu còn trống; báo dòng trùng tên đăng nhập (trong tệp hoặc với tài khoản đã có). */
export function ganTenDangNhap(hocSinh, daCo = new Set(), rand = Math.random) {
  const daDung = new Set(daCo), loi = [], ketQua = []
  for (const h of hocSinh.filter(h => h.ten_dang_nhap)) {             // tên tự đặt trong tệp: giữ nguyên, kiểm trùng
    if (daDung.has(h.ten_dang_nhap)) loi.push({ dong: h.dong, ly_do: `Tên đăng nhập "${h.ten_dang_nhap}" bị trùng` })
    else daDung.add(h.ten_dang_nhap)
  }
  const dongLoi = new Set(loi.map(l => l.dong))
  for (const h of hocSinh) {
    if (dongLoi.has(h.dong)) continue
    ketQua.push({
      ...h,
      ten_dang_nhap: h.ten_dang_nhap || goiYTenDangNhap(h.ho_ten, daDung),
      mat_khau: h.mat_khau || taoMatKhau(rand),
    })
  }
  return { hocSinh: ketQua, loi }
}

/** Tệp CSV (mở bằng Excel, có BOM để hiện đúng tiếng Việt) danh sách tài khoản để in phát cho học sinh. */
export function csvTaiKhoan(ds) {
  const o = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const dong = [['Lớp', 'Họ và tên', 'Tên đăng nhập', 'Mật khẩu'], ...ds.map(h => [h.lop, h.ho_ten, h.ten_dang_nhap, h.mat_khau])]
  return '﻿' + dong.map(d => d.map(o).join(',')).join('\r\n')
}
