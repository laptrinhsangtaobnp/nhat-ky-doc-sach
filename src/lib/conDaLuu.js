// Các bạn đã đăng nhập bằng PIN trên máy này (anh chị em dùng chung điện thoại bố mẹ): chỉ lưu { id, ten, lop, ma }
// để hiện nút chọn nhanh — KHÔNG lưu PIN, không lưu dữ liệu đọc sách (mọi dữ liệu ở máy chủ). Lỗi bộ nhớ → coi như trống.
const KHOA = 'nkds_con'

export function docConDaLuu() {
  try {
    const ds = JSON.parse(localStorage.getItem(KHOA) ?? '[]')
    return Array.isArray(ds) ? ds.filter(c => c && typeof c.id === 'string') : []
  } catch {
    return []
  }
}

export function ghiConDaLuu(ds) {
  try { localStorage.setItem(KHOA, JSON.stringify(ds)) } catch { /* trình duyệt chặn bộ nhớ → bỏ qua */ }
}
