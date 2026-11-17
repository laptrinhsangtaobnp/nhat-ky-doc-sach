// Quy tắc tài khoản: vai trò, tên đăng nhập, mật khẩu. Hàm thuần — không gọi mạng.
// Quyền thật sự do máy chủ kiểm (RLS + hàm Neon + Edge Function); ở đây chỉ để giao diện hiển thị đúng.

export const VAI_TRO = ['quan_tri', 'thu_thu', 'giao_vien', 'hoc_sinh']
export const TEN_VAI_TRO = { quan_tri: 'Quản trị', thu_thu: 'Thủ thư', giao_vien: 'Giáo viên', hoc_sinh: 'Học sinh' }
export const DUOI_EMAIL = '@school.local'
export const TEN_DANG_NHAP_HOP_LE = /^[a-z0-9._]{3,30}$/

/** Thủ thư hoặc quản trị (người quản lý thư viện). */
export const laNhanVien = vaiTro => vaiTro === 'quan_tri' || vaiTro === 'thu_thu'

/** Đường dẫn trang chủ theo vai trò. */
export function trangChu(vaiTro) {
  if (vaiTro === 'hoc_sinh') return '/hoc-sinh'
  if (vaiTro === 'giao_vien') return '/giao-vien'
  if (laNhanVien(vaiTro)) return '/thu-vien'
  return '/dang-nhap'
}

/** Đổi chữ người dùng gõ ở ô đăng nhập thành email Supabase (gõ "annv" → "annv@school.local"). */
export function emailDangNhap(nhap) {
  const s = String(nhap ?? '').trim().toLowerCase()
  return s.includes('@') ? s : s + DUOI_EMAIL
}

/** Lỗi đăng nhập Supabase → câu dễ hiểu (không gộp mọi lỗi thành "sai mật khẩu" để còn biết nguyên nhân thật). */
export function loiDangNhap(loi) {
  const ma = loi?.code, tt = loi?.status
  if (ma === 'invalid_credentials') return 'Sai tên đăng nhập hoặc mật khẩu. Kiểm tra phím Caps Lock và tắt bộ gõ tiếng Việt khi gõ mật khẩu.'
  if (ma === 'over_request_rate_limit' || tt === 429) return 'Thử sai nhiều lần quá, chờ vài phút rồi thử lại.'
  if (ma === 'email_not_confirmed') return 'Tài khoản chưa được xác nhận. Hãy hỏi thầy cô thư viện.'
  if (ma === 'user_banned') return 'Tài khoản đã bị khoá. Hãy hỏi thầy cô thư viện.'
  if (!tt || tt >= 500) return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'
  return `Không đăng nhập được (${ma || tt}).`
}

/** Bỏ dấu tiếng Việt, chữ thường ("Nguyễn Đức" → "nguyen duc"). */
export function boDau(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
}

/** Gợi ý tên đăng nhập từ họ tên: tên + chữ đầu họ đệm ("Nguyễn Văn An" → "annv"); trùng thì thêm số (annv2). Ghi tên đã dùng vào daDung. */
export function goiYTenDangNhap(hoTen, daDung) {
  const tu = boDau(hoTen).replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean)
  if (tu.length === 0) return null
  let goc = tu[tu.length - 1] + tu.slice(0, -1).map(t => t[0]).join('')
  if (goc.length < 3) goc = goc.padEnd(3, 'x')
  goc = goc.slice(0, 26)
  let ten = goc
  for (let i = 2; daDung.has(ten); i++) ten = goc + i
  daDung.add(ten)
  return ten
}

/** Mật khẩu 6 chữ số cho học sinh nhỏ dễ gõ; mỗi em một mật khẩu khác nhau. rand tuỳ chọn để kiểm tra. */
export function taoMatKhau(rand = Math.random) {
  let s = ''
  for (let i = 0; i < 6; i++) s += Math.floor(rand() * 10)
  return s
}
