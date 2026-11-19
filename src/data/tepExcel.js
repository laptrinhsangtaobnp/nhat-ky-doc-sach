// Đọc tệp Excel người dùng chọn (trang tính đầu tiên) thành mảng các dòng. Đọc ngay trong trình duyệt, không gửi đi đâu.
import { readSheet } from 'read-excel-file/browser'

/** Đọc tệp .xlsx → mảng dòng (mỗi dòng là mảng ô). */
export async function docTepExcel(tep) {
  if (!/\.xlsx$/i.test(tep.name)) throw new Error('Chỉ nhận tệp Excel .xlsx (Excel → Lưu thành → .xlsx)')
  if (tep.size > 5 * 1024 * 1024) throw new Error('Tệp quá lớn (tối đa 5 MB)')
  return readSheet(tep)
}

/** Ghi tệp .xlsx nhiều trang ([{ sheet, data, columns }]) và tải về. Thư viện chỉ tải khi bấm (không làm nặng trang). */
export async function taiVeExcel(cacTrang, tenTep) {
  const { default: ghi } = await import('write-excel-file/browser')
  await ghi(cacTrang).toFile(tenTep)
}

/** Cho người dùng tải về một tệp chữ (CSV…). */
export function taiVeTep(noiDung, tenTep, kieu = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([noiDung], { type: kieu }))
  const a = document.createElement('a')
  a.href = url
  a.download = tenTep
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
