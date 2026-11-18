// 1 dòng trong trang Mượn – trả (nhân viên): sách, học sinh, hạn, nút thao tác theo trạng thái.
import { Link } from 'react-router-dom'
import { chuNgay } from '../../domain/ngay'
import { coBanChoEm, nhanHan, TEN_TRANG_THAI } from '../../domain/muonTra'

const MAU_HAN = { do: 'text-rose-700 font-semibold', cam: 'text-amber-700 font-semibold' }

function Nut({ children, onClick, chinh, nguyHiem, ...p }) {
  const kieu = chinh ? 'bg-emerald-600 text-white hover:bg-emerald-700'
    : nguyHiem ? 'border border-rose-200 text-rose-700 hover:bg-rose-50' : 'border border-stone-300 hover:bg-stone-50'
  return <button onClick={onClick} className={`rounded-lg px-3 py-1.5 text-sm disabled:opacity-50 ${kieu}`} {...p}>{children}</button>
}

export default function DongMuon({ l, homNay, ban, onLam }) {
  const lam = viec => onLam(viec, l)
  let thongTin, nut = null
  if (l.trang_thai === 'dat_truoc') {
    const co = coBanChoEm(l)
    thongTin = <>Đặt {chuNgay(l.ngay_dat, homNay)} · {co
      ? <span className="font-semibold text-emerald-700">Có sách trên kệ</span>
      : <span className="text-amber-700">Chờ bạn trả (thứ {l.thu_tu_cho}, còn {l.con_ban} bản)</span>}</>
    nut = <>
      <Nut chinh disabled={ban || !co} onClick={() => lam('soan')}>Đã soạn</Nut>
      <Nut disabled={ban || !co} onClick={() => lam('cho_muon')} title="Em đang ở thư viện">Cho mượn luôn</Nut>
      <Nut nguyHiem disabled={ban} onClick={() => confirm('Huỷ lượt đặt trước này?') && lam('huy')}>Huỷ</Nut>
    </>
  } else if (l.trang_thai === 'da_soan') {
    const h = nhanHan(l.han_giu, homNay)
    thongTin = <>Soạn {chuNgay(l.ngay_soan, homNay)} · Giữ: <span className={MAU_HAN[h.mau]}>{h.chu}</span></>
    nut = <>
      <Nut chinh disabled={ban} onClick={() => lam('cho_muon')}>Cho mượn</Nut>
      <Nut nguyHiem disabled={ban} onClick={() => confirm('Cất sách lại lên kệ và huỷ lượt này?') && lam('huy')}>Cất lại</Nut>
    </>
  } else if (l.trang_thai === 'dang_muon') {
    const h = nhanHan(l.han_tra, homNay)
    thongTin = <>Mượn {chuNgay(l.ngay_muon, homNay)} · Trả: <span className={MAU_HAN[h.mau]}>{h.chu}</span></>
    nut = <>
      <Nut chinh disabled={ban} onClick={() => lam('tra')}>Ghi trả</Nut>
      <Nut nguyHiem disabled={ban} onClick={() => confirm(`Báo mất "${l.sach.ten}"? Số bản của sách sẽ giảm 1.`) && lam('mat')}>Báo mất</Nut>
    </>
  } else {
    thongTin = <>{TEN_TRANG_THAI[l.trang_thai]}{l.trang_thai === 'huy' && (l.ly_do_huy === 'hoc_sinh_huy' ? ' (HS huỷ)' : ' (thủ thư huỷ)')} · {chuNgay(l.ngay_xong, homNay)}</>
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-white p-3 shadow-sm">
      <div className="min-w-0 flex-1 basis-60">
        <p className="font-semibold">
          <Link to={`/sach/${l.sach.id}`} className="hover:text-emerald-700">{l.sach.ten}</Link>
          <span className="ml-2 font-mono text-xs font-normal text-stone-500">{l.sach.ma_sach}{l.sach.vi_tri && ` · ${l.sach.vi_tri}`}</span>
        </p>
        <p className="text-sm">{l.hoc_sinh.ho_ten} <span className="text-stone-500">· {l.hoc_sinh.lop ?? 'chưa có lớp'}</span>
          {l.nguon === 'goi_y' && <span className="ml-2 rounded bg-violet-50 px-1.5 text-xs text-violet-700">từ gợi ý</span>}</p>
        <p className="text-sm text-stone-600">{thongTin}</p>
      </div>
      {nut && <div className="flex flex-wrap gap-2">{nut}</div>}
    </li>
  )
}
