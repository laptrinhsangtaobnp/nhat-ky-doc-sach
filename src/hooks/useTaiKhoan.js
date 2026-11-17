// Tải + thao tác trang Tài khoản: lớp của năm học, danh sách người dùng (lọc, phân trang), sửa tại chỗ.
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { layNguoiDung, suaHoSo } from '../data/hoSo'
import { datThiDiem, layCacLop, taoLop, xoaLop } from '../data/lop'
import { datLaiMatKhau, xoaTaiKhoan } from '../data/taiKhoan'
import { namHocHienTai } from '../domain/namHoc'
import { taoMatKhau } from '../domain/taiKhoan'

const baoLoi = (e, macDinh) => toast.error(e?.message?.includes('forbidden') ? 'Bạn không có quyền làm việc này' : macDinh)

export function useTaiKhoan() {
  const [namHoc] = useState(namHocHienTai())
  const [cacLop, setCacLop] = useState([])
  const [loc, setLoc] = useState({ lopId: null, vaiTro: null, tuKhoa: '', trang: 0 })
  const [ds, setDs] = useState([])
  const [tong, setTong] = useState(0)
  const [dangTai, setDangTai] = useState(true)

  const taiLop = useCallback(() => layCacLop(namHoc).then(({ data, error }) => {
    if (error) return baoLoi(error, 'Không tải được danh sách lớp')
    setCacLop(data)
  }), [namHoc])

  const taiNguoi = useCallback(async () => {
    setDangTai(true)
    const { data, count, error } = await layNguoiDung(loc)
    setDangTai(false)
    if (error) return baoLoi(error, 'Không tải được danh sách tài khoản')
    setDs(data)
    setTong(count ?? 0)
  }, [loc])

  useEffect(() => { taiLop() }, [taiLop])
  useEffect(() => {
    const t = setTimeout(taiNguoi, 250)       // chờ gõ xong ô tìm kiếm
    return () => clearTimeout(t)
  }, [taiNguoi])

  async function sua(nguoi, thayDoi) {
    const moi = { ...nguoi, ...thayDoi }
    const { error } = await suaHoSo(moi)
    if (error) return baoLoi(error, 'Không lưu được')
    setDs(d => d.map(n => (n.id === nguoi.id ? moi : n)))
  }

  /** Đặt lại mật khẩu mới ngẫu nhiên, trả mật khẩu mới để hiện cho thủ thư (hoặc null nếu lỗi). */
  async function datLaiMk(nguoi) {
    const mk = taoMatKhau()
    try { await datLaiMatKhau(nguoi.id, mk); return mk } catch (e) { baoLoi(e, e.message); return null }
  }

  async function xoa(nguoi) {
    try {
      await xoaTaiKhoan(nguoi.id)
      setDs(d => d.filter(n => n.id !== nguoi.id))
      setTong(t => t - 1)
      toast.success('Đã xoá')
    } catch (e) { baoLoi(e, e.message) }
  }

  async function themLop(ten) {
    const { data, error } = await taoLop({ ten, nam_hoc: namHoc })
    if (error) return baoLoi(error, error.code === '23505' ? 'Lớp đã có' : 'Không thêm được lớp')
    setCacLop(l => [...l, data].sort((a, b) => a.ten.localeCompare(b.ten)))
  }

  async function doiThiDiem(lop) {
    const { data, error } = await datThiDiem(lop.id, !lop.thi_diem)
    if (error) return baoLoi(error, 'Không lưu được')
    setCacLop(l => l.map(x => (x.id === lop.id ? data : x)))
  }

  async function boLop(lop) {
    const { error } = await xoaLop(lop.id)
    if (error) return baoLoi(error, 'Không xoá được lớp')
    setCacLop(l => l.filter(x => x.id !== lop.id))
    setDs(d => d.map(n => (n.lop_id === lop.id ? { ...n, lop_id: null } : n)))
  }

  return {
    namHoc, cacLop, loc, setLoc, ds, tong, dangTai,
    taiLai: () => { taiLop(); taiNguoi() },
    sua, datLaiMk, xoa, themLop, doiThiDiem, boLop,
  }
}
