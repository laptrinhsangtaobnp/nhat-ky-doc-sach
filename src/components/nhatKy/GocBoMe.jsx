// Góc bố mẹ (cuối trang chủ học sinh): tổng kết tuần này — số ngày đọc, số lần ghi, cảm xúc nổi bật, lần có bố mẹ.
// Chưa có tài khoản phụ huynh: bố mẹ xem ngay trong tài khoản của con. Số liệu máy chủ tính (tong_quan_cua_toi).
import { camXucNhieuNhat, giaiDoanCay } from '../../domain/nhatKy'

export default function GocBoMe({ tq }) {
  const cx = camXucNhieuNhat(tq.tuan?.cam_xuc)
  const gd = giaiDoanCay(tq.cay.so_ngay)
  return (
    <section className="space-y-2 rounded-xl bg-sky-50 p-4 text-sky-950">
      <h2 className="text-lg font-semibold">👨‍👩‍👧 Góc bố mẹ — tuần này</h2>
      <ul className="space-y-1">
        <li>📅 Con ghi nhật ký <b>{tq.cay.tuan_nay}</b> ngày ({tq.tuan?.so_lan ?? 0} lần ghi).</li>
        {cx && <li>{cx.hinh} Cảm xúc nhiều nhất: <b>{cx.ten.toLowerCase()}</b>.</li>}
        <li>👨‍👩‍👧 Đọc cùng bố mẹ: <b>{tq.tuan?.bo_me ?? 0}</b> lần.</li>
        {tq.dang_doc?.[0] && <li>📖 Đang đọc: <b>{tq.dang_doc[0].ten}</b>{tq.dang_doc[0].trang_cuoi && ` (trang ${tq.dang_doc[0].trang_cuoi})`}.</li>}
        <li>{gd.hinh} Cây đọc sách của con đã lớn <b>{tq.cay.so_ngay}</b> ngày.</li>
      </ul>
      <p className="text-sm text-sky-800">Bố mẹ có thể mở “5 phút trò chuyện” khi con ghi nhật ký để hỏi con vài câu và viết thêm 1 dòng.</p>
    </section>
  )
}
