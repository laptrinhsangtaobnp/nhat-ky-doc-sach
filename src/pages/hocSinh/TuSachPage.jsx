// Tủ sách của em (trang chủ học sinh, giai đoạn 2): sách đã đặt, đang mượn, đã mượn.
// Giai đoạn 3 thêm nút Ghi nhật ký ở từng cuốn đang đọc.
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTuSach } from '../../hooks/useTuSach'
import { moTaChoEm } from '../../domain/muonTra'
import { ngayVN } from '../../domain/ngay'
import BiaSach from '../../components/sach/BiaSach'
import HopTrangThai from '../../components/muonTra/HopTrangThai'

function TheLuot({ l, homNay, onHuy }) {
  return (
    <li className="flex gap-3 rounded-xl bg-white p-3 shadow-sm">
      <Link to={`/sach/${l.sach.id}`} className="w-16 shrink-0"><BiaSach sach={l.sach} /></Link>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <Link to={`/sach/${l.sach.id}`} className="font-semibold hover:text-emerald-700">{l.sach.ten}</Link>
          {l.sach.tac_gia && <p className="text-sm text-stone-500">{l.sach.tac_gia}</p>}
        </div>
        <HopTrangThai moTa={moTaChoEm(l, homNay)}>
          {l.trang_thai === 'dat_truoc' && onHuy && (
            <button onClick={() => confirm('Em muốn huỷ đặt trước cuốn này?') && onHuy(l.id)} className="mt-1 underline">Huỷ đặt trước</button>
          )}
        </HopTrangThai>
      </div>
    </li>
  )
}

function Phan({ tieuDe, ds, homNay, onHuy, trong }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{tieuDe} {ds.length > 0 && <span className="text-stone-400">({ds.length})</span>}</h2>
      {ds.length === 0
        ? <p className="text-sm text-stone-500">{trong}</p>
        : <ul className="grid gap-3 md:grid-cols-2">{ds.map(l => <TheLuot key={l.id} l={l} homNay={homNay} onHuy={onHuy} />)}</ul>}
    </section>
  )
}

export default function TuSachPage() {
  const { hoSo } = useAuth()
  const ts = useTuSach()
  const homNay = ngayVN()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">Tủ sách của em</h1>
          <p className="text-stone-600">Chào {hoSo?.ho_ten}! {ts.toiDa && `Em đang giữ ${ts.dangGiu}/${ts.toiDa} cuốn (đặt trước + đang mượn).`}</p>
        </div>
        <Link to="/sach" className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700">
          <Search size={18} aria-hidden /> Tìm sách để đọc
        </Link>
      </div>

      {ts.dangTai ? <p className="text-stone-500" role="status">Đang tải…</p> : <>
        <Phan tieuDe="Sách em đã đặt" ds={ts.datTruoc} homNay={homNay} onHuy={ts.huy}
          trong="Em chưa đặt cuốn nào. Bấm “Tìm sách để đọc”, chọn sách rồi bấm Đặt trước nhé." />
        <Phan tieuDe="Em đang mượn" ds={ts.dangMuon} homNay={homNay} trong="Em chưa mượn cuốn nào." />
        {ts.daMuon.length > 0 && <Phan tieuDe="Sách em đã mượn" ds={ts.daMuon} homNay={homNay} />}
      </>}
    </div>
  )
}
