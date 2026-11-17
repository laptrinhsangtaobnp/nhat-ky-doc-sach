// Tìm sách — mọi vai trò. Nhân viên có thêm: nhập danh mục Excel, quản lý chủ đề, thấy sách đang ẩn.
// Nút nhân viên chỉ để hiển thị; quyền ghi thật do máy chủ kiểm (RLS + hàm nhap_danh_muc).
import { lazy, Suspense, useState } from 'react'
import { FileUp, Search, Tags } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTimSach } from '../../hooks/useTimSach'
import { laNhanVien } from '../../domain/taiKhoan'
import TheSach from '../../components/sach/TheSach'

// Kèm thư viện đọc Excel → chỉ tải khi nhân viên mở
const NhapSachModal = lazy(() => import('../../components/sach/NhapSachModal'))
const ChuDeModal = lazy(() => import('../../components/sach/ChuDeModal'))

const KHOI = [1, 2, 3, 4, 5]

export default function TimSachPage() {
  const { hoSo } = useAuth()
  const nv = laNhanVien(hoSo?.vai_tro)
  const ts = useTimSach()
  const [mo, setMo] = useState(null)          // 'nhap' | 'chu_de' | null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-bold">{nv ? 'Danh mục sách' : 'Tìm sách'}</h1>
        {nv && <>
          <button onClick={() => setMo('nhap')} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            <FileUp size={16} aria-hidden /> Nhập danh mục Excel
          </button>
          <button onClick={() => setMo('chu_de')} className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-50">
            <Tags size={16} aria-hidden /> Chủ đề
          </button>
        </>}
      </div>

      <div className="space-y-2 rounded-xl bg-white p-3 shadow-sm">
        <label className="relative block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden />
          <input type="search" value={ts.loc.tuKhoa} onChange={e => ts.datLoc({ tuKhoa: e.target.value })}
            placeholder="Gõ tên sách hoặc tác giả (không cần dấu)…" aria-label="Tìm sách"
            className="w-full rounded-lg border border-stone-300 py-2.5 pl-10 pr-3 text-base" />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Chip chon={!ts.loc.chuDeId} onClick={() => ts.datLoc({ chuDeId: null })}>Mọi chủ đề</Chip>
          {ts.chuDe.map(c => (
            <Chip key={c.id} chon={ts.loc.chuDeId === c.id} onClick={() => ts.datLoc({ chuDeId: ts.loc.chuDeId === c.id ? null : c.id })}>{c.ten}</Chip>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-stone-500">Khối:</span>
          <Chip chon={!ts.loc.khoi} onClick={() => ts.datLoc({ khoi: null })}>Tất cả</Chip>
          {KHOI.map(k => <Chip key={k} chon={ts.loc.khoi === k} onClick={() => ts.datLoc({ khoi: ts.loc.khoi === k ? null : k })}>{k}</Chip>)}
        </div>
      </div>

      <p className="text-sm text-stone-500" role="status">{ts.dangTai && ts.ds.length === 0 ? 'Đang tìm…' : `${ts.tong} cuốn`}</p>

      {!ts.dangTai && ts.ds.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-stone-500">
          {nv && ts.tong === 0 && !ts.loc.tuKhoa ? 'Chưa có sách nào. Bấm "Nhập danh mục Excel" để thêm.' : 'Không tìm thấy sách nào. Thử gõ ít chữ hơn.'}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {ts.ds.map(s => <TheSach key={s.id} sach={s} />)}
      </div>

      {ts.conNua && (
        <div className="text-center">
          <button disabled={ts.dangTai} onClick={ts.xemThem} className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm hover:bg-stone-50 disabled:opacity-50">
            {ts.dangTai ? 'Đang tải…' : `Xem thêm (${ts.tong - ts.ds.length} cuốn nữa)`}
          </button>
        </div>
      )}

      <Suspense fallback={null}>
        {mo === 'nhap' && <NhapSachModal chuDe={ts.chuDe} onDong={daNhap => { setMo(null); if (daNhap) ts.taiLai() }} />}
        {mo === 'chu_de' && <ChuDeModal chuDe={ts.chuDe} onDong={() => { setMo(null); ts.taiLai() }} />}
      </Suspense>
    </div>
  )
}

function Chip({ chon, onClick, children }) {
  return (
    <button onClick={onClick} aria-pressed={chon}
      className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${chon ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
      {children}
    </button>
  )
}
