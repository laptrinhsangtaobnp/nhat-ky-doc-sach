// Hộ chiếu thể loại: mỗi chủ đề 1 con tem; tem do máy chủ tính (ho_chieu_cua_toi). Ở đây chỉ để hiển thị.

const MAU_TEM = [
  'border-emerald-500 bg-emerald-50 text-emerald-900', 'border-sky-500 bg-sky-50 text-sky-900',
  'border-amber-500 bg-amber-50 text-amber-900', 'border-rose-500 bg-rose-50 text-rose-900',
  'border-violet-500 bg-violet-50 text-violet-900', 'border-teal-500 bg-teal-50 text-teal-900',
  'border-orange-500 bg-orange-50 text-orange-900', 'border-indigo-500 bg-indigo-50 text-indigo-900',
]

/** Màu con tem theo thứ tự (đổi màu xoay vòng). */
export const mauTem = i => MAU_TEM[((i % MAU_TEM.length) + MAU_TEM.length) % MAU_TEM.length]

/** { co, tong, conLai } từ danh sách tem máy chủ trả. */
export function tienDoHoChieu(tem = []) {
  const co = tem.filter(t => t.ngay).length
  return { co, tong: tem.length, conLai: tem.length - co }
}

/** Câu khích lệ dưới tiêu đề hộ chiếu. */
export function loiHoChieu({ co, tong, conLai }) {
  if (!tong) return 'Thư viện chưa có thể loại nào. Em quay lại sau nhé!'
  if (!co) return 'Đọc xong 1 cuốn sách là em được đóng con tem đầu tiên!'
  if (!conLai) return 'Hộ chiếu của em đã đầy tem. Em là nhà du hành sách thật sự!'
  return `Em đã có ${co}/${tong} con tem. Còn ${conLai} thể loại đang chờ em khám phá!`
}
