// Thêm 1 tài khoản nhân viên (thủ thư / GVCN / quản trị) — chỉ quản trị thấy nút này; máy chủ kiểm lại.
import { useState } from 'react'
import HopThoai from '../ui/HopThoai'
import { taoTaiKhoan } from '../../data/taiKhoan'
import { TEN_DANG_NHAP_HOP_LE, TEN_VAI_TRO } from '../../domain/taiKhoan'

const LY_DO = { da_co: 'Tên đăng nhập đã có', ten_khong_hop_le: 'Tên đăng nhập chỉ gồm chữ không dấu, số, dấu chấm (3–30 ký tự)', mat_khau_ngan: 'Mật khẩu ít nhất 6 ký tự', forbidden: 'Không có quyền' }

export default function ThemNhanVienModal({ cacLop, onDong }) {
  const [f, setF] = useState({ ho_ten: '', ten_dang_nhap: '', mat_khau: '', vai_tro: 'thu_thu', lop_id: '' })
  const [dangGui, setDangGui] = useState(false)
  const dat = k => e => setF(x => ({ ...x, [k]: e.target.value }))

  async function gui(e) {
    e.preventDefault()
    const ten = f.ten_dang_nhap.trim().toLowerCase()
    if (!TEN_DANG_NHAP_HOP_LE.test(ten)) return alert(LY_DO.ten_khong_hop_le)
    if (f.mat_khau.length < 8) return alert('Mật khẩu nhân viên ít nhất 8 ký tự')
    setDangGui(true)
    try {
      const [kq] = await taoTaiKhoan([{ ...f, ten_dang_nhap: ten, lop_id: f.vai_tro === 'giao_vien' && f.lop_id ? Number(f.lop_id) : null }])
      if (!kq.ok) return alert(LY_DO[kq.loi] ?? 'Không tạo được')
      alert(`Đã tạo. Đăng nhập bằng: ${ten}`)
      onDong(true)
    } catch (err) {
      alert(err.message)
    } finally {
      setDangGui(false)
    }
  }

  const o = 'mt-1 w-full rounded-lg border border-stone-300 px-3 py-2'
  return (
    <HopThoai tieuDe="Thêm nhân viên" onDong={() => onDong(false)} rong="max-w-md">
      <form onSubmit={gui} className="space-y-3 text-sm">
        <label className="block">Họ và tên<input required value={f.ho_ten} onChange={dat('ho_ten')} className={o} /></label>
        <label className="block">Tên đăng nhập<input required value={f.ten_dang_nhap} onChange={dat('ten_dang_nhap')} autoCapitalize="none" className={`${o} font-mono`} /></label>
        <label className="block">Mật khẩu (ít nhất 8 ký tự)<input required type="text" value={f.mat_khau} onChange={dat('mat_khau')} className={o} /></label>
        <label className="block">Vai trò
          <select value={f.vai_tro} onChange={dat('vai_tro')} className={o}>
            {['thu_thu', 'giao_vien', 'quan_tri'].map(v => <option key={v} value={v}>{TEN_VAI_TRO[v]}</option>)}
          </select>
        </label>
        {f.vai_tro === 'giao_vien' && (
          <label className="block">Lớp chủ nhiệm
            <select value={f.lop_id} onChange={dat('lop_id')} className={o}>
              <option value="">—</option>
              {cacLop.map(l => <option key={l.id} value={l.id}>{l.ten}</option>)}
            </select>
          </label>
        )}
        <button disabled={dangGui} className="w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white disabled:opacity-50">{dangGui ? 'Đang tạo…' : 'Tạo tài khoản'}</button>
      </form>
    </HopThoai>
  )
}
