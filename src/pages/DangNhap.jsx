import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { trangChu } from '../domain/taiKhoan'
import { ManChoTai } from '../components/ui/ChoVaiTro'

export default function DangNhap() {
  const { hoSo, dangTai, dangNhap } = useAuth()
  const [ten, setTen] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const [dangGui, setDangGui] = useState(false)

  if (dangTai && !dangGui) return <ManChoTai />
  if (hoSo) return <Navigate to={trangChu(hoSo.vai_tro)} replace />

  async function gui(e) {
    e.preventDefault()
    setDangGui(true)
    try {
      await dangNhap(ten, matKhau)
    } catch {
      toast.error('Sai tên đăng nhập hoặc mật khẩu')
    } finally {
      setDangGui(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={gui} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-emerald-700">
          <BookOpen size={40} aria-hidden />
          <h1 className="text-xl font-bold">Nhật ký đọc sách</h1>
        </div>
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
    </div>
  )
}
