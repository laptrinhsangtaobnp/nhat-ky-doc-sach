// Trang Tài khoản (thủ thư + quản trị): lớp, danh sách học sinh / nhân viên, nhập học sinh từ Excel.
import { useState } from 'react'
import { FileUp, UserPlus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTaiKhoan } from '../../hooks/useTaiKhoan'
import { layNguoiDung } from '../../data/hoSo'
import { TEN_VAI_TRO } from '../../domain/taiKhoan'
import QuanLyLop from '../../components/quanTri/QuanLyLop'
import BangNguoiDung from '../../components/quanTri/BangNguoiDung'
import NhapHocSinhModal from '../../components/quanTri/NhapHocSinhModal'
import ThemNhanVienModal from '../../components/quanTri/ThemNhanVienModal'

export default function TaiKhoanPage() {
  const { hoSo } = useAuth()
  const tk = useTaiKhoan()
  const [moNhap, setMoNhap] = useState(false)
  const [moThem, setMoThem] = useState(false)
  const laQuanTri = hoSo.vai_tro === 'quan_tri'
  const soTrang = Math.max(1, Math.ceil(tk.tong / layNguoiDung.MOI_TRANG))
  const datLoc = thayDoi => tk.setLoc(l => ({ ...l, trang: 0, ...thayDoi }))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-bold">Tài khoản <span className="text-base font-normal text-stone-500">· năm học {tk.namHoc}</span></h1>
        <button onClick={() => setMoNhap(true)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          <FileUp size={16} aria-hidden /> Nhập học sinh từ Excel
        </button>
        {laQuanTri && (
          <button onClick={() => setMoThem(true)} className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-50">
            <UserPlus size={16} aria-hidden /> Thêm nhân viên
          </button>
        )}
      </div>

      <QuanLyLop cacLop={tk.cacLop} onThem={tk.themLop} onThiDiem={tk.doiThiDiem} onXoa={tk.boLop} />

      <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <input placeholder="Tìm tên hoặc tên đăng nhập…" value={tk.loc.tuKhoa} onChange={e => datLoc({ tuKhoa: e.target.value })}
            className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm" aria-label="Tìm kiếm" />
          <select value={tk.loc.lopId ?? ''} onChange={e => datLoc({ lopId: e.target.value ? Number(e.target.value) : null })}
            className="rounded-lg border border-stone-300 px-2 py-2 text-sm" aria-label="Lọc theo lớp">
            <option value="">Mọi lớp</option>
            {tk.cacLop.map(l => <option key={l.id} value={l.id}>Lớp {l.ten}</option>)}
          </select>
          <select value={tk.loc.vaiTro ?? ''} onChange={e => datLoc({ vaiTro: e.target.value || null })}
            className="rounded-lg border border-stone-300 px-2 py-2 text-sm" aria-label="Lọc theo vai trò">
            <option value="">Mọi vai trò</option>
            {Object.entries(TEN_VAI_TRO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <BangNguoiDung ds={tk.ds} dangTai={tk.dangTai} cacLop={tk.cacLop} toi={hoSo}
          onSua={tk.sua} onDatLaiMk={tk.datLaiMk} onXoa={tk.xoa} />

        <div className="flex items-center justify-between text-sm text-stone-600">
          <span>{tk.tong} tài khoản</span>
          <div className="flex items-center gap-2">
            <button disabled={tk.loc.trang === 0} onClick={() => tk.setLoc(l => ({ ...l, trang: l.trang - 1 }))}
              className="rounded border px-2 py-1 disabled:opacity-40">‹ Trước</button>
            <span>Trang {tk.loc.trang + 1}/{soTrang}</span>
            <button disabled={tk.loc.trang + 1 >= soTrang} onClick={() => tk.setLoc(l => ({ ...l, trang: l.trang + 1 }))}
              className="rounded border px-2 py-1 disabled:opacity-40">Sau ›</button>
          </div>
        </div>
      </section>

      {moNhap && <NhapHocSinhModal namHoc={tk.namHoc} onDong={daTao => { setMoNhap(false); if (daTao) tk.taiLai() }} />}
      {moThem && <ThemNhanVienModal cacLop={tk.cacLop} onDong={daTao => { setMoThem(false); if (daTao) tk.taiLai() }} />}
    </div>
  )
}
