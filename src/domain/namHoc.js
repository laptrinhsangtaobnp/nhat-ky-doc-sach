// Năm học: từ tháng 8 tính sang năm học mới ("2026-2027").

/** Năm học của một ngày (mặc định hôm nay). */
export function namHocHienTai(ngay = new Date()) {
  const y = ngay.getFullYear()
  return ngay.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}
