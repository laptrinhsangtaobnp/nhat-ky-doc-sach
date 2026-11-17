import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import ChoVaiTro, { ManChoTai } from './components/ui/ChoVaiTro'
import KhungTrang from './components/ui/KhungTrang'
import DangNhap from './pages/DangNhap'
import TrangSapCo from './pages/TrangSapCo'
import { trangChu } from './domain/taiKhoan'
import { THIEU_CAU_HINH } from './data/cauHinh'

// Trang nhân viên tải riêng (kèm thư viện đọc Excel) → học sinh mở app nhẹ hơn
const TaiKhoanPage = lazy(() => import('./pages/quanTri/TaiKhoanPage'))

const NHAN_VIEN = ['quan_tri', 'thu_thu']

function VeTrangChu() {
  const { hoSo, dangTai } = useAuth()
  if (dangTai) return <ManChoTai />
  return <Navigate to={hoSo ? trangChu(hoSo.vai_tro) : '/dang-nhap'} replace />
}

export default function App() {
  if (THIEU_CAU_HINH) {
    return <p className="p-6">Chưa cấu hình kết nối (tệp .env hoặc biến môi trường trên Vercel). Xem HUONG-DAN-CAI-DAT.md.</p>
  }
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/dang-nhap" element={<DangNhap />} />
          <Route element={<ChoVaiTro><KhungTrang /></ChoVaiTro>}>
            <Route path="/hoc-sinh" element={<ChoVaiTro vaiTro={['hoc_sinh']}>
              <TrangSapCo tieuDe="Trang của em" viec={['Tìm sách trong thư viện', 'Đặt mượn sách', 'Viết nhật ký đọc sách', 'Giới thiệu sách cho bạn']} />
            </ChoVaiTro>} />
            <Route path="/giao-vien" element={<ChoVaiTro vaiTro={['giao_vien']}>
              <TrangSapCo tieuDe="Lớp của tôi" viec={['Xem nhật ký đọc của học sinh lớp mình', 'Thống kê đọc sách của lớp']} />
            </ChoVaiTro>} />
            <Route path="/thu-vien" element={<ChoVaiTro vaiTro={NHAN_VIEN}>
              <TrangSapCo tieuDe="Thư viện" viec={['Danh mục sách (nhập Excel, ảnh bìa)', 'Duyệt mượn – ghi trả', 'Duyệt review', 'Thống kê trước – sau']} />
            </ChoVaiTro>} />
            <Route path="/thu-vien/tai-khoan" element={<ChoVaiTro vaiTro={NHAN_VIEN}><Suspense fallback={<ManChoTai />}><TaiKhoanPage /></Suspense></ChoVaiTro>} />
          </Route>
          <Route path="*" element={<VeTrangChu />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
