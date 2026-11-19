// Thẻ "Review chờ duyệt" trên trang Mượn – trả: mỗi bài hiện tên đầy đủ + lớp (thủ thư cần biết ai viết), sách, chữ em viết,
// tên sẽ hiện cho các bạn. Duyệt / Không duyệt (chọn lý do). Quyền do máy chủ kiểm (review_cho_duyet, duyet_review).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { tenNguoiViet } from '../../domain/review'
import { chuNgay } from '../../domain/ngay'
import ChonLyDo from './ChonLyDo'

export default function ReviewChoDuyet({ rv }) {
  const [dangChon, setDangChon] = useState(null)
  if (!rv.kq) return <p className="text-stone-500" role="status">Đang tải…</p>
  if (rv.kq.ds.length === 0) return <p className="rounded-xl bg-white p-6 text-center text-stone-500">Không có bài giới thiệu nào chờ duyệt.</p>

  return (
    <ul className="space-y-2">
      {rv.kq.ds.map(r => {
        const ban = rv.dangLam === r.id
        return (
          <li key={r.id} className="space-y-2 rounded-xl border border-stone-200 bg-white p-3">
            <p className="text-sm text-stone-600">
              <b className="text-stone-900">{r.ho_ten}</b>{r.lop && ` · lớp ${r.lop}`} · {chuNgay(r.sua_luc)} ·{' '}
              <Link to={`/sach/${r.sach_id}`} className="text-emerald-700 underline">{r.ten_sach}</Link>
            </p>
            <p className="whitespace-pre-line rounded-lg bg-stone-50 p-2">{r.noi_dung}</p>
            <p className="text-xs text-stone-500">Các bạn sẽ thấy tên: {tenNguoiViet({ ten: r.an_ten ? null : r.ten_hien, lop: r.lop })}</p>
            {dangChon === r.id
              ? <ChonLyDo ban={ban} onHuy={() => setDangChon(null)} onChon={async lyDo => { if (await rv.khongDuyet(r, lyDo)) setDangChon(null) }} />
              : (
                <div className="flex gap-2">
                  <button disabled={ban} onClick={() => rv.duyet(r)}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
                    <Check size={16} aria-hidden /> Duyệt</button>
                  <button disabled={ban} onClick={() => setDangChon(r.id)}
                    className="flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-1.5 text-sm text-rose-800 hover:bg-rose-50 disabled:opacity-50">
                    <X size={16} aria-hidden /> Không duyệt</button>
                </div>
              )}
          </li>
        )
      })}
      {rv.kq.so > rv.kq.ds.length && <p className="text-center text-sm text-stone-500">Còn {rv.kq.so - rv.kq.ds.length} bài nữa — duyệt xong bấm Làm mới.</p>}
    </ul>
  )
}
