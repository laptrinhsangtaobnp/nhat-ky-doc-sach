// Đầu trang chủ học sinh: nút Ghi nhật ký, dòng nhắc, thư gửi chính mình đến hạn, cây đọc sách, đọc tiếp.
// Số liệu do máy chủ tính (tong_quan_cua_toi). Cây lớn theo số ngày có ghi; bỏ lỡ thì ngừng lớn, không héo.
import { Link } from 'react-router-dom'
import { PenLine } from 'lucide-react'
import { chuCay, giaiDoanCay, loiNhac } from '../../domain/nhatKy'
import { chuNgay } from '../../domain/ngay'
import BiaSach from '../sach/BiaSach'

function CayDocSach({ cay }) {
  const gd = giaiDoanCay(cay.so_ngay)
  const c = chuCay(cay)
  return (
    <div className="flex items-center gap-4 rounded-xl bg-gradient-to-b from-sky-50 to-emerald-50 p-4 shadow-sm">
      <div className="text-6xl leading-none" aria-hidden>{gd.hinh}</div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-lg font-bold">Cây của em: {gd.ten}</p>
        <p className="text-sm text-stone-700">Đã lớn <b>{cay.so_ngay}</b> ngày · {c.tuan}</p>
        {gd.sau && <>
          <div className="h-2.5 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={gd.phanTram} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${gd.phanTram}%` }} />
          </div>
          <p className="text-xs text-stone-600">Còn {gd.conLai} ngày nữa thành {gd.sau.hinh} {gd.sau.ten}</p>
        </>}
        <p className={`text-sm ${cay.hom_nay ? 'text-emerald-700' : 'text-amber-800'}`}>{c.homNay}</p>
      </div>
    </div>
  )
}

export default function KhungThoiQuen({ tq, homNay, onMoThu }) {
  const nhac = loiNhac(tq.lan_ghi_cuoi, homNay)
  return (
    <section className="space-y-3">
      <Link to="/nhat-ky/ghi" className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-xl font-bold text-white shadow hover:bg-emerald-700">
        <PenLine size={24} aria-hidden /> Ghi nhật ký
      </Link>
      {nhac && <p className="rounded-xl bg-amber-50 px-4 py-2 text-amber-900">⏰ {nhac}</p>}
      {tq.thu_den_han?.map(t => (
        <button key={t.sach_id} onClick={() => onMoThu(t.sach_id)} className="w-full rounded-xl bg-rose-50 px-4 py-3 text-left text-rose-900 shadow-sm hover:bg-rose-100">
          💌 Em có thư từ chính mình! Em viết ngày {chuNgay(t.viet_ngay, homNay)} khi đọc xong <b>{t.ten}</b>. Bấm để mở.
        </button>
      ))}
      <CayDocSach cay={tq.cay} />
      {tq.dang_doc?.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">📖 Đọc tiếp</h2>
          <ul className="space-y-2">
            {tq.dang_doc.map(s => (
              <li key={s.id}>
                <Link to={`/nhat-ky/ghi?sach=${s.id}`} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm hover:bg-emerald-50">
                  <div className="w-10 shrink-0"><BiaSach sach={s} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{s.ten}</p>
                    <p className="text-sm text-stone-600">{s.trang_cuoi ? `Em đọc đến trang ${s.trang_cuoi}${s.so_trang ? ` / ${s.so_trang}` : ''}` : 'Em đang đọc'}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white">Ghi tiếp</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
