// Khung chung: thanh trên (tên app, menu theo vai trò, tên người dùng, đăng xuất). Gọn trên điện thoại.
import { NavLink, Outlet } from 'react-router-dom'
import { BookOpen, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { laNhanVien, TEN_VAI_TRO } from '../../domain/taiKhoan'

function menuTheoVaiTro(vaiTro) {
  if (vaiTro === 'hoc_sinh') return [{ to: '/hoc-sinh', ten: 'Trang của em' }]
  if (vaiTro === 'giao_vien') return [{ to: '/giao-vien', ten: 'Lớp của tôi' }]
  if (laNhanVien(vaiTro)) return [{ to: '/thu-vien', ten: 'Thư viện' }, { to: '/thu-vien/tai-khoan', ten: 'Tài khoản' }]
  return []
}

export default function KhungTrang() {
  const { hoSo, dangXuat } = useAuth()
  const menu = menuTheoVaiTro(hoSo?.vai_tro)
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <div className="flex items-center gap-2 font-bold text-emerald-700">
            <BookOpen size={22} aria-hidden /> Nhật ký đọc sách
          </div>
          <nav className="flex gap-1 overflow-x-auto">
            {menu.map(m => (
              <NavLink key={m.to} to={m.to} end
                className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-emerald-50 font-semibold text-emerald-800' : 'text-stone-600 hover:bg-stone-100'}`}>
                {m.ten}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden text-stone-600 sm:inline">{hoSo?.ho_ten} · {TEN_VAI_TRO[hoSo?.vai_tro]}</span>
            <button onClick={dangXuat} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-stone-600 hover:bg-stone-100" title="Đăng xuất">
              <LogOut size={18} aria-hidden /> <span className="sr-only sm:not-sr-only">Thoát</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">
        <Outlet />
      </main>
    </div>
  )
}
