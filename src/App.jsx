import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import ChoVaiTro, { ManChoTai } from './components/ui/ChoVaiTro'
import KhungTrang from './components/ui/KhungTrang'
import DangNhap from './pages/DangNhap'
import TimSachPage from './pages/sach/TimSachPage'
import ChiTietSachPage from './pages/sach/ChiTietSachPage'
import TuSachPage from './pages/hocSinh/TuSachPage'
import GhiNhatKyPage from './pages/hocSinh/GhiNhatKyPage'
import NhatKyCuaEmPage from './pages/hocSinh/NhatKyCuaEmPage'
import NhinLaiPage from './pages/hocSinh/NhinLaiPage'
import { trangChu } from './domain/taiKhoan'
import { THIEU_CAU_HINH } from './data/cauHinh'

// Trang nhân viên tải riêng (kèm thư viện đọc Excel) → học sinh mở app nhẹ hơn
const TaiKhoanPage = lazy(() => import('./pages/quanTri/TaiKhoanPage'))
const MuonTraPage = lazy(() => import('./pages/thuThu/MuonTraPage'))
const LopCuaToiPage = lazy(() => import('./pages/giaoVien/LopCuaToiPage'))

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
            <Route path="/hoc-sinh" element={<ChoVaiTro vaiTro={['hoc_sinh']}><TuSachPage /></ChoVaiTro>} />
            <Route path="/giao-vien" element={<ChoVaiTro vaiTro={['giao_vien']}><Suspense fallback={<ManChoTai />}><LopCuaToiPage /></Suspense></ChoVaiTro>} />
            <Route path="/thu-vien/lop" element={<ChoVaiTro vaiTro={NHAN_VIEN}><Suspense fallback={<ManChoTai />}><LopCuaToiPage /></Suspense></ChoVaiTro>} />
            <Route path="/lop/hs/:hsId" element={<ChoVaiTro vaiTro={['giao_vien', ...NHAN_VIEN]}><NhinLaiPage /></ChoVaiTro>} />
            <Route path="/nhat-ky" element={<ChoVaiTro vaiTro={['hoc_sinh']}><NhatKyCuaEmPage /></ChoVaiTro>} />
            <Route path="/nhat-ky/ghi" element={<ChoVaiTro vaiTro={['hoc_sinh']}><GhiNhatKyPage /></ChoVaiTro>} />
            <Route path="/nhat-ky/:id/sua" element={<ChoVaiTro vaiTro={['hoc_sinh']}><GhiNhatKyPage /></ChoVaiTro>} />
            <Route path="/nhin-lai" element={<ChoVaiTro vaiTro={['hoc_sinh']}><NhinLaiPage /></ChoVaiTro>} />
            <Route path="/thu-vien" element={<ChoVaiTro vaiTro={NHAN_VIEN}><Suspense fallback={<ManChoTai />}><MuonTraPage /></Suspense></ChoVaiTro>} />
            <Route path="/sach" element={<TimSachPage />} />
            <Route path="/sach/:id" element={<ChiTietSachPage />} />
            <Route path="/thu-vien/tai-khoan" element={<ChoVaiTro vaiTro={NHAN_VIEN}><Suspense fallback={<ManChoTai />}><TaiKhoanPage /></Suspense></ChoVaiTro>} />
          </Route>
          <Route path="*" element={<VeTrangChu />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
