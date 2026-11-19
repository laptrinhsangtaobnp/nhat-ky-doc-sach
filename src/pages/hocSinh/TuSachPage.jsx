// Trang chủ học sinh — Tủ sách của em: Ghi nhật ký + cây đọc sách + đọc tiếp + thư đến hạn; sách đã đặt, đang mượn, đã mượn;
// cuối trang: Góc bố mẹ (tổng kết tuần).
// Sách đang mượn / đã mượn có nút Ghi nhật ký và Em đọc xong rồi.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTuSach } from '../../hooks/useTuSach'
import { moTaChoEm } from '../../domain/muonTra'
import { ngayVN } from '../../domain/ngay'
import BiaSach from '../../components/sach/BiaSach'
import HopTrangThai from '../../components/muonTra/HopTrangThai'
import KhungThoiQuen from '../../components/nhatKy/KhungThoiQuen'
import DocXongModal from '../../components/nhatKy/DocXongModal'
import GocBoMe from '../../components/nhatKy/GocBoMe'
import ThuModal from '../../components/nhatKy/ThuModal'
import TheThuThachEm from '../../components/thuThach/TheThuThachEm'

function TheLuot({ l, homNay, onHuy, children }) {
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
        {children}
      </div>
    </li>
  )
}

function Phan({ tieuDe, ds, trong, veThe }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{tieuDe} {ds.length > 0 && <span className="text-stone-400">({ds.length})</span>}</h2>
      {ds.length === 0 ? <p className="text-sm text-stone-500">{trong}</p> : <ul className="grid gap-3 md:grid-cols-2">{ds.map(veThe)}</ul>}
    </section>
  )
}

export default function TuSachPage() {
  const { hoSo } = useAuth()
  const ts = useTuSach()
  const [docXong, setDocXong] = useState(null)       // sách đang mở hộp "Em đọc xong rồi"
  const [thu, setThu] = useState(null)               // id sách của lá thư đang mở
  const homNay = ngayVN()

  const nutDoc = l => (
    <div className="flex flex-wrap gap-2 text-sm">
      <Link to={`/nhat-ky/ghi?sach=${l.sach.id}`} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700">✍️ Ghi nhật ký</Link>
      {ts.daDocXong(l.sach.id)
        ? <span className="px-1 py-1.5 text-emerald-700">✓ Em đã đọc xong</span>
        : <button onClick={() => setDocXong(l.sach)} className="rounded-lg border border-stone-300 px-3 py-1.5 hover:bg-stone-50">🎉 Em đọc xong rồi</button>}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">Chào {hoSo?.ho_ten}!</h1>
          <p className="text-stone-600">Hôm nay em đọc gì?</p>
        </div>
        <Link to="/sach" className="flex items-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 py-2.5 font-semibold text-emerald-700 hover:bg-emerald-50">
          <Search size={18} aria-hidden /> Tìm sách
        </Link>
      </div>

      {ts.tq && <KhungThoiQuen tq={ts.tq} homNay={homNay} onMoThu={setThu} />}
      <TheThuThachEm homNay={homNay} />

      {ts.dangTai ? <p className="text-stone-500" role="status">Đang tải…</p> : <>
        <Phan tieuDe="Em đang mượn" ds={ts.dangMuon} trong="Em chưa mượn cuốn nào."
          veThe={l => <TheLuot key={l.id} l={l} homNay={homNay}>{nutDoc(l)}</TheLuot>} />
        <Phan tieuDe="Sách em đã đặt" ds={ts.datTruoc}
          trong={`Em chưa đặt cuốn nào. Bấm “Tìm sách”, chọn sách rồi bấm Đặt trước nhé.${ts.toiDa ? ` (Em giữ được tối đa ${ts.toiDa} cuốn.)` : ''}`}
          veThe={l => <TheLuot key={l.id} l={l} homNay={homNay} onHuy={ts.huy} />} />
        {ts.daMuon.length > 0 && <Phan tieuDe="Sách em đã mượn" ds={ts.daMuon}
          veThe={l => <TheLuot key={l.id} l={l} homNay={homNay}>{nutDoc(l)}</TheLuot>} />}
      </>}

      {ts.tq && <GocBoMe tq={ts.tq} />}

      {thu && <ThuModal sachId={thu} onDong={() => { setThu(null); ts.taiTongQuan() }} />}
      {docXong && <DocXongModal sach={docXong} onDong={daXong => { setDocXong(null); if (daXong) ts.sauDocXong() }} />}
    </div>
  )
}
