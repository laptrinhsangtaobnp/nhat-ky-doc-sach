// Đăng nhập. Mặc định "Học sinh": mã lớp → chọn tên → PIN (DangNhapHocSinh). "Thầy cô": tên đăng nhập + mật khẩu.
// Link / QR trên phiếu lớp: /dang-nhap?lop=MALOP → điền sẵn mã lớp.
import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { loiDangNhap, trangChu } from '../domain/taiKhoan'
import { ManChoTai } from '../components/ui/ChoVaiTro'
import DangNhapHocSinh from '../components/dangNhap/DangNhapHocSinh'

function DangNhapThayCo() {
  const { dangNhap } = useAuth()
  const [ten, setTen] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const [dangGui, setDangGui] = useState(false)

  async function gui(e) {
    e.preventDefault()
    setDangGui(true)
    try {
      await dangNhap(ten, matKhau)
    } catch (loi) {
      console.warn('Đăng nhập lỗi:', loi?.code, loi?.status, loi?.message)
      toast.error(loiDangNhap(loi), { duration: 6000 })
    } finally {
      setDangGui(false)
    }
  }

  return (
    <form onSubmit={gui} className="space-y-4">
      <label className="block text-sm font-medium">
        Tên đăng nhập
        <input value={ten} onChange={e => setTen(e.target.value)} autoComplete="username" autoCapitalize="none" required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base" />
      </label>
      <label className="block text-sm font-medium">
        Mật khẩu
        <input type="password" value={matKhau} onChange={e => setMatKhau(e.target.value)} autoComplete="current-password" required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base" />
      </label>
      <button disabled={dangGui} className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
        {dangGui ? 'Đang vào…' : 'Đăng nhập'}
      </button>
      <p className="text-center text-xs text-stone-500">Quên mật khẩu? Hỏi thầy cô thư viện để đặt lại.</p>
    </form>
  )
}

export default function DangNhap() {
  const { hoSo, dangTai } = useAuth()
  const [tim] = useSearchParams()
  const [loai, setLoai] = useState('hoc_sinh')

  if (dangTai) return <ManChoTai />
  if (hoSo) return <Navigate to={trangChu(hoSo.vai_tro)} replace />

  const the = (ma, chu) => (
    <button type="button" role="tab" aria-selected={loai === ma} onClick={() => setLoai(ma)}
      className={`flex-1 rounded-lg py-2 font-semibold ${loai === ma ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500'}`}>{chu}</button>
  )

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-emerald-700">
          <BookOpen size={40} aria-hidden />
          <h1 className="text-xl font-bold">Nhật ký đọc sách</h1>
        </div>
        <div className="flex gap-1 rounded-xl bg-stone-100 p-1" role="tablist">{the('hoc_sinh', '🧒 Học sinh')}{the('thay_co', 'Thầy cô')}</div>
        {loai === 'hoc_sinh' ? <DangNhapHocSinh maTuQr={tim.get('lop')} /> : <DangNhapThayCo />}
      </div>
    </div>
  )
}
