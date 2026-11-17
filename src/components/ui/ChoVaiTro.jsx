// Chặn trang theo vai trò (chỉ để điều hướng; dữ liệu đã được máy chủ chặn bằng RLS).
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { trangChu } from '../../domain/taiKhoan'

export function ManChoTai() {
  return (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Đang tải">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
    </div>
  )
}

export default function ChoVaiTro({ vaiTro, children }) {
  const { hoSo, dangTai } = useAuth()
  if (dangTai) return <ManChoTai />
  if (!hoSo) return <Navigate to="/dang-nhap" replace />
  if (vaiTro && !vaiTro.includes(hoSo.vai_tro)) return <Navigate to={trangChu(hoSo.vai_tro)} replace />
  return children
}
