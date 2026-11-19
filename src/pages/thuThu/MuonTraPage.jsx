// Mượn – trả (trang chủ thủ thư / quản trị): Cần soạn → Chờ em đến nhận → Đang mượn → Lịch sử → Review chờ duyệt;
// cho mượn tại chỗ; quy tắc mượn.
// Nút chỉ để hiển thị — mọi thay đổi trạng thái qua hàm máy chủ có kiểm vai trò.
import { lazy, Suspense, useState } from 'react'
import { BookUp, RefreshCw, Search, Settings2 } from 'lucide-react'
import { useMuonTra } from '../../hooks/useMuonTra'
import { ngayVN } from '../../domain/ngay'
import DongMuon from '../../components/muonTra/DongMuon'
import ReviewChoDuyet from '../../components/review/ReviewChoDuyet'
import { useReviewChoDuyet } from '../../hooks/useReviewChoDuyet'

const ChoMuonTaiChoModal = lazy(() => import('../../components/muonTra/ChoMuonTaiChoModal'))
const QuyTacMuonModal = lazy(() => import('../../components/muonTra/QuyTacMuonModal'))

const THE = [
  { loai: 'can_soan', ten: 'Cần soạn', so: d => d.can_soan },
  { loai: 'da_soan', ten: 'Chờ em đến nhận', so: d => d.da_soan, canhBao: d => (d.qua_han_giu > 0 ? `${d.qua_han_giu} quá hạn giữ` : null) },
  { loai: 'dang_muon', ten: 'Đang mượn', so: d => d.dang_muon, canhBao: d => (d.qua_han > 0 ? `${d.qua_han} quá hạn` : null) },
  { loai: 'lich_su', ten: 'Lịch sử' },
]

const TRONG = {
  can_soan: 'Không có lượt đặt trước nào cần soạn.',
  da_soan: 'Không có sách nào đang chờ em đến nhận.',
  dang_muon: 'Không có sách nào đang được mượn.',
  lich_su: 'Chưa có lượt nào đã xong.',
}

export default function MuonTraPage() {
  const mt = useMuonTra()
  const rv = useReviewChoDuyet()
  const [xemReview, setXemReview] = useState(false)
  const [mo, setMo] = useState(null)            // 'tai_cho' | 'quy_tac' | null
  const homNay = ngayVN()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-bold">Mượn – trả</h1>
        <button onClick={() => setMo('tai_cho')} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          <BookUp size={16} aria-hidden /> Cho mượn tại chỗ
        </button>
        <button onClick={() => setMo('quy_tac')} className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-50">
          <Settings2 size={16} aria-hidden /> Quy tắc mượn
        </button>
        <button onClick={() => { mt.taiLai(); rv.taiLai() }} className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-50">
          <RefreshCw size={16} aria-hidden /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="tablist">
        {THE.map(t => {
          const chon = !xemReview && mt.loai === t.loai
          const cb = mt.dem && t.canhBao?.(mt.dem)
          return (
            <button key={t.loai} role="tab" aria-selected={chon} onClick={() => { setXemReview(false); mt.datLoai(t.loai) }}
              className={`rounded-xl border p-3 text-left ${chon ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}>
              <span className="block text-sm text-stone-600">{t.ten}</span>
              {t.so ? <span className="text-2xl font-bold">{mt.dem ? t.so(mt.dem) : '…'}</span> : <span className="text-sm text-stone-500">Lượt đã trả / huỷ</span>}
              {cb && <span className="block text-xs font-semibold text-rose-700">{cb}</span>}
            </button>
          )
        })}
        <button role="tab" aria-selected={xemReview} onClick={() => setXemReview(true)}
          className={`rounded-xl border p-3 text-left ${xemReview ? 'border-sky-500 bg-sky-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}>
          <span className="block text-sm text-stone-600">Review chờ duyệt</span>
          <span className="text-2xl font-bold">{rv.kq ? rv.kq.so : '…'}</span>
        </button>
      </div>

      {xemReview ? <ReviewChoDuyet rv={rv} /> : <>

      <label className="relative block">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden />
        <input type="search" value={mt.tuKhoa} onChange={e => mt.setTuKhoa(e.target.value)} aria-label="Tìm lượt mượn"
          placeholder="Tìm theo tên sách, mã sách, tên học sinh hoặc lớp (vd 4A)…"
          className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-10 pr-3 text-base" />
      </label>

      {mt.dangTai && mt.ds.length === 0 && <p className="text-stone-500" role="status">Đang tải…</p>}
      {!mt.dangTai && mt.ds.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-stone-500">{mt.tuKhoa ? 'Không tìm thấy lượt nào.' : TRONG[mt.loai]}</p>}

      <ul className="space-y-2">
        {mt.ds.map(l => <DongMuon key={l.id} l={l} homNay={homNay} ban={mt.dangLam === l.id} onLam={mt.lam} />)}
      </ul>

      {mt.conNua && (
        <div className="text-center">
          <button disabled={mt.dangTai} onClick={mt.xemThem} className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm hover:bg-stone-50 disabled:opacity-50">
            {mt.dangTai ? 'Đang tải…' : 'Xem thêm'}
          </button>
        </div>
      )}
      </>}

      <Suspense fallback={null}>
        {mo === 'tai_cho' && <ChoMuonTaiChoModal onDong={daMuon => { setMo(null); if (daMuon) mt.taiLai() }} />}
        {mo === 'quy_tac' && <QuyTacMuonModal onDong={() => setMo(null)} />}
      </Suspense>
    </div>
  )
}
