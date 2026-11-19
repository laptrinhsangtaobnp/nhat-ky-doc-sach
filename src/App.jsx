import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import ChoVaiTro, { ManChoTai } from './components/ui/ChoVaiTro'
import KhungTrang from './components/ui/KhungTrang'
import DangNhap from './pages/DangNhap'
import { trangChu } from './domain/taiKhoan'
import { THIEU_CAU_HINH } from './data/cauHinh'

// Mỗi trang tải riêng khi mở tới (trang đăng nhập + khung có sẵn) → mở app nhanh trên điện thoại; trang nhân viên kèm thư viện Excel
const TimSachPage = lazy(() => import('./pages/sach/TimSachPage'))
const ChiTietSachPage = lazy(() => import('./pages/sach/ChiTietSachPage'))
const TuSachPage = lazy(() => import('./pages/hocSinh/TuSachPage'))
const GhiNhatKyPage = lazy(() => import('./pages/hocSinh/GhiNhatKyPage'))
const NhatKyCuaEmPage = lazy(() => import('./pages/hocSinh/NhatKyCuaEmPage'))
const NhinLaiPage = lazy(() => import('./pages/hocSinh/NhinLaiPage'))
const HoChieuPage = lazy(() => import('./pages/hocSinh/HoChieuPage'))
const TaiKhoanPage = lazy(() => import('./pages/quanTri/TaiKhoanPage'))
const MuonTraPage = lazy(() => import('./pages/thuThu/MuonTraPage'))
const ThongKePage = lazy(() => import('./pages/thuThu/ThongKePage'))
const LopCuaToiPage = lazy(() => import('./pages/giaoVien/LopCuaToiPage'))
const MaLopPinPage = lazy(() => import('./pages/giaoVien/MaLopPinPage'))

const NHAN_VIEN = ['quan_tri', 'thu_thu']
const HS = ['hoc_sinh']
const GV_NV = ['giao_vien', ...NHAN_VIEN]

/** Trang có kiểm vai trò (vaiTro null = mọi người đã đăng nhập) + màn chờ khi đang tải phần mã của trang. */
function Trang({ vaiTro, children }) {
  const t = <Suspense fallback={<ManChoTai />}>{children}</Suspense>
  return vaiTro ? <ChoVaiTro vaiTro={vaiTro}>{t}</ChoVaiTro> : t
}

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
            <Route path="/hoc-sinh" element={<Trang vaiTro={HS}><TuSachPage /></Trang>} />
            <Route path="/nhat-ky" element={<Trang vaiTro={HS}><NhatKyCuaEmPage /></Trang>} />
            <Route path="/nhat-ky/ghi" element={<Trang vaiTro={HS}><GhiNhatKyPage /></Trang>} />
            <Route path="/nhat-ky/:id/sua" element={<Trang vaiTro={HS}><GhiNhatKyPage /></Trang>} />
            <Route path="/nhin-lai" element={<Trang vaiTro={HS}><NhinLaiPage /></Trang>} />
            <Route path="/ho-chieu" element={<Trang vaiTro={HS}><HoChieuPage /></Trang>} />
            <Route path="/giao-vien" element={<Trang vaiTro={['giao_vien']}><LopCuaToiPage /></Trang>} />
            <Route path="/lop/ma-pin" element={<Trang vaiTro={GV_NV}><MaLopPinPage /></Trang>} />
            <Route path="/lop/hs/:hsId" element={<Trang vaiTro={GV_NV}><NhinLaiPage /></Trang>} />
            <Route path="/thu-vien" element={<Trang vaiTro={NHAN_VIEN}><MuonTraPage /></Trang>} />
            <Route path="/thu-vien/lop" element={<Trang vaiTro={NHAN_VIEN}><LopCuaToiPage /></Trang>} />
            <Route path="/thu-vien/thong-ke" element={<Trang vaiTro={NHAN_VIEN}><ThongKePage /></Trang>} />
            <Route path="/thu-vien/tai-khoan" element={<Trang vaiTro={NHAN_VIEN}><TaiKhoanPage /></Trang>} />
            <Route path="/sach" element={<Trang><TimSachPage /></Trang>} />
            <Route path="/sach/:id" element={<Trang><ChiTietSachPage /></Trang>} />
          </Route>
          <Route path="*" element={<VeTrangChu />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
