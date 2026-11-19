// Danh sách các lần ghi nhật ký của 1 em, lọc cảm xúc / tìm chữ. choSua = em tự xem (sửa / xoá trong 7 ngày).
// Dùng ở: Nhật ký của em, Nhìn lại (bấm 1 cuốn), GVCN / nhân viên xem nhật ký học sinh.
import { Link } from 'react-router-dom'
import { useDsNhatKy } from '../../hooks/useDsNhatKy'
import { CAM_XUC, camXuc, conSuaDuoc } from '../../domain/nhatKy'
import { chuNgay, ngayVN } from '../../domain/ngay'

function TheNhatKy({ x, homNay, choSua, anSach, onXoa }) {
  const c = camXuc(x.cam_xuc)
  return (
    <li className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500">
        <span className="text-2xl" aria-hidden>{c.hinh}</span>
        <span className="font-semibold text-stone-800">{c.ten}</span>
        <span>{chuNgay(x.ngay, homNay)}{x.trang && ` · trang ${x.trang}`}</span>
        {!anSach && <Link to={`/sach/${x.sach.id}`} className="font-medium text-emerald-700 hover:underline">{x.sach.ten}</Link>}
        {x.cung_bo_me && <span className="rounded bg-sky-50 px-1.5 text-sky-800">👨‍👩‍👧 cùng bố mẹ</span>}
        {x.tinh_chuoi && <span className="rounded bg-emerald-50 px-1.5 text-emerald-800">✓ tính chuỗi</span>}
      </div>
      {x.doan_nho && <blockquote className="whitespace-pre-line border-l-4 border-amber-300 pl-3 italic text-stone-800">{x.doan_nho}</blockquote>}
      {x.em_nghi && <p className="whitespace-pre-line text-stone-800">{x.em_nghi}</p>}
      {choSua && conSuaDuoc(x.ngay, homNay) && (
        <div className="flex gap-3 text-sm">
          <Link to={`/nhat-ky/${x.id}/sua`} className="underline">Sửa</Link>
          <button onClick={() => confirm('Xoá lần ghi này?') && onXoa(x.id)} className="text-rose-700 underline">Xoá</button>
        </div>
      )}
    </li>
  )
}

export default function DsNhatKy({ hsId, sachId = null, choSua = false, coLoc = true, trong = 'Chưa có lần ghi nào.' }) {
  const d = useDsNhatKy({ hsId, sachId })
  const homNay = ngayVN()
  return (
    <div className="space-y-3">
      {coLoc && (
        <div className="space-y-2">
          <input type="search" value={d.loc.tuKhoa} onChange={e => d.datLoc({ tuKhoa: e.target.value })} placeholder="Tìm trong nhật ký…"
            aria-label="Tìm trong nhật ký" className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base" />
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button onClick={() => d.datLoc({ camXuc: null })} className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${!d.loc.camXuc ? 'bg-emerald-600 text-white' : 'bg-stone-100'}`}>Tất cả</button>
            {CAM_XUC.map(c => (
              <button key={c.ma} onClick={() => d.datLoc({ camXuc: d.loc.camXuc === c.ma ? null : c.ma })}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${d.loc.camXuc === c.ma ? 'bg-emerald-600 text-white' : 'bg-stone-100'}`}>{c.hinh} {c.ten}</button>
            ))}
          </div>
        </div>
      )}
      {d.dangTai && d.ds.length === 0 && <p className="text-stone-500" role="status">Đang tải…</p>}
      {!d.dangTai && d.ds.length === 0 && <p className="rounded-xl bg-white p-5 text-center text-stone-500">{trong}</p>}
      <ul className="space-y-3">
        {d.ds.map(x => <TheNhatKy key={x.id} x={x} homNay={homNay} choSua={choSua} anSach={Boolean(sachId)} onXoa={d.xoa} />)}
      </ul>
      {d.conNua && <div className="text-center"><button onClick={d.xemThem} disabled={d.dangTai} className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm">Xem thêm</button></div>}
    </div>
  )
}
