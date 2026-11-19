// Trang 1 cuốn sách: "X bạn đã đọc · Y bạn lớp em" (chỉ số) + bài giới thiệu ĐÃ DUYỆT của các bạn + bài của em (HS đã đọc xong).
// Nhân viên gỡ được bài (chọn lý do). Mọi quyền do máy chủ kiểm (review_cua_sach / viet_review / duyet_review).
import { useState } from 'react'
import { useReviewSach } from '../../hooks/useReviewSach'
import { chuDaDoc, tenNguoiViet } from '../../domain/review'
import { chuNgay } from '../../domain/ngay'
import BaiCuaEm from './BaiCuaEm'
import ChonLyDo from './ChonLyDo'

export default function CacBanNoiGi({ sachId, laHocSinh, laNhanVien }) {
  const { kq, ban, viet, xoa, go } = useReviewSach(sachId)
  const [dangGo, setDangGo] = useState(null)
  if (!kq) return null
  if (kq.loi) return <p className="text-sm text-stone-500">Chưa tải được bài giới thiệu của các bạn.</p>

  const daDoc = chuDaDoc(kq)
  const ds = kq.review.filter(r => !(laHocSinh && r.la_cua_em))     // bài của em đã hiện ở khung riêng
  return (
    <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="text-lg font-bold">💬 Các bạn nói gì</h2>
        {daDoc && <p className="text-sm text-stone-600">{daDoc}</p>}
      </div>

      {laHocSinh && (kq.em_doc_xong
        ? <BaiCuaEm key={kq.cua_em?.noi_dung ?? ''} cuaEm={kq.cua_em} lop={kq.lop} ban={ban} onViet={viet} onXoa={xoa} />
        : <p className="text-sm text-stone-500">Đọc xong cuốn này, em có thể viết vài câu giới thiệu cho các bạn.</p>)}

      {ds.length === 0
        ? <p className="text-stone-500">Chưa có bài giới thiệu nào.</p>
        : (
          <ul className="space-y-2">
            {ds.map(r => (
              <li key={r.id} className="rounded-lg border border-stone-200 p-3">
                <p className="whitespace-pre-line">{r.noi_dung}</p>
                <p className="mt-1 text-sm text-stone-500">— {tenNguoiViet(r)} · {chuNgay(r.ngay)}
                  {laNhanVien && dangGo !== r.id && <button onClick={() => setDangGo(r.id)} className="ml-3 text-rose-700 underline">Gỡ</button>}
                </p>
                {dangGo === r.id && <div className="mt-2"><ChonLyDo ban={ban} onHuy={() => setDangGo(null)}
                  onChon={async lyDo => { if (await go(r.id, lyDo)) setDangGo(null) }} /></div>}
              </li>
            ))}
          </ul>
        )}
    </section>
  )
}
