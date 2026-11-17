// Nhập học sinh từ Excel: chọn tệp → xem trước (báo dòng lỗi) → tạo tài khoản → tải danh sách mật khẩu để in.
import { useState } from 'react'
import { Download } from 'lucide-react'
import HopThoai from '../ui/HopThoai'
import { docTepExcel, taiVeTep } from '../../data/tepExcel'
import { layTenDangNhapDaCo } from '../../data/hoSo'
import { damBaoCoLop } from '../../data/lop'
import { taoTaiKhoan } from '../../data/taiKhoan'
import { csvTaiKhoan, docBangHocSinh, ganTenDangNhap } from '../../domain/nhapHocSinh'

const LY_DO = { da_co: 'tên đăng nhập đã có', forbidden: 'không có quyền', ten_khong_hop_le: 'tên đăng nhập sai', mat_khau_ngan: 'mật khẩu ngắn' }

export default function NhapHocSinhModal({ namHoc, onDong }) {
  const [buoc, setBuoc] = useState('chon')          // chon → xem → dang_tao → xong
  const [hocSinh, setHocSinh] = useState([])
  const [loi, setLoi] = useState([])
  const [tienDo, setTienDo] = useState(0)
  const [ketQua, setKetQua] = useState([])

  async function chonTep(e) {
    const tep = e.target.files?.[0]
    if (!tep) return
    try {
      const doc = docBangHocSinh(await docTepExcel(tep))
      // 2 lượt: lượt đầu gợi ý tên, hỏi máy chủ tên nào đã có, lượt sau tránh các tên đó
      let gan = ganTenDangNhap(doc.hocSinh)
      const daCo = await layTenDangNhapDaCo(gan.hocSinh.map(h => h.ten_dang_nhap))
      if (daCo.size) gan = ganTenDangNhap(doc.hocSinh, daCo)
      setHocSinh(gan.hocSinh)
      setLoi([...doc.loi, ...gan.loi].sort((a, b) => a.dong - b.dong))
      setBuoc('xem')
    } catch (err) {
      alert(err.message || 'Không đọc được tệp')
    }
  }

  async function tao() {
    setBuoc('dang_tao')
    try {
      const cacLop = await damBaoCoLop(hocSinh.map(h => h.lop), namHoc)
      const idLop = Object.fromEntries(cacLop.map(l => [l.ten, l.id]))
      const kq = await taoTaiKhoan(hocSinh.map(h => ({ ho_ten: h.ho_ten, ten_dang_nhap: h.ten_dang_nhap, mat_khau: h.mat_khau, lop_id: idLop[h.lop] })), setTienDo)
      const theoTen = Object.fromEntries(kq.map(k => [k.ten_dang_nhap, k]))
      setKetQua(hocSinh.map(h => ({ ...h, ...theoTen[h.ten_dang_nhap] })))
      setBuoc('xong')
    } catch (err) {
      alert('Lỗi: ' + (err.message || 'không tạo được'))
      setBuoc('xem')
    }
  }

  const thanhCong = ketQua.filter(k => k.ok)
  const thatBai = ketQua.filter(k => !k.ok)

  return (
    <HopThoai tieuDe="Nhập học sinh từ Excel" onDong={() => onDong(buoc === 'xong')} rong="max-w-3xl">
      {buoc === 'chon' && <>
        <p className="text-sm text-stone-600">
          Tệp <b>.xlsx</b> có dòng tiêu đề gồm cột <b>Họ và tên</b> (hoặc 2 cột <b>Họ đệm</b> + <b>Tên</b>) và <b>Lớp</b> (ví dụ 4A).
          Có thể thêm cột <b>Tên đăng nhập</b>, <b>Mật khẩu</b>; để trống thì app tự tạo (mật khẩu 6 chữ số, mỗi em một mật khẩu).
          Lớp chưa có sẽ được tạo cho năm học {namHoc}.
        </p>
        <input type="file" accept=".xlsx" onChange={chonTep} className="block w-full text-sm" aria-label="Chọn tệp Excel" />
      </>}

      {buoc === 'xem' && <>
        <p><b className="text-emerald-700">{hocSinh.length}</b> học sinh hợp lệ{loi.length > 0 && <>, <b className="text-red-600">{loi.length}</b> dòng lỗi (sẽ bỏ qua)</>}.</p>
        {loi.length > 0 && (
          <ul className="max-h-32 overflow-y-auto rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {loi.map(l => <li key={`${l.dong}-${l.ly_do}`}>Dòng {l.dong}: {l.ly_do}</li>)}
          </ul>
        )}
        <div className="max-h-72 overflow-auto rounded-lg border border-stone-200">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-stone-50 text-left"><tr><th className="p-2">Dòng</th><th>Họ tên</th><th>Lớp</th><th>Tên đăng nhập</th></tr></thead>
            <tbody>{hocSinh.slice(0, 300).map(h => (
              <tr key={h.dong} className="border-t border-stone-100"><td className="p-2 text-stone-400">{h.dong}</td><td>{h.ho_ten}</td><td>{h.lop}</td><td className="font-mono">{h.ten_dang_nhap}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setBuoc('chon')} className="rounded-lg border px-3 py-2 text-sm">Chọn tệp khác</button>
          <button disabled={hocSinh.length === 0} onClick={tao} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            Tạo {hocSinh.length} tài khoản
          </button>
        </div>
      </>}

      {buoc === 'dang_tao' && <p role="status">Đang tạo tài khoản… {tienDo}/{hocSinh.length}. Đừng đóng trang.</p>}

      {buoc === 'xong' && <>
        <p>Đã tạo <b className="text-emerald-700">{thanhCong.length}</b> tài khoản{thatBai.length > 0 && <>, <b className="text-red-600">{thatBai.length}</b> không tạo được</>}.</p>
        {thatBai.length > 0 && (
          <ul className="max-h-32 overflow-y-auto rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {thatBai.map(k => <li key={k.dong}>Dòng {k.dong} – {k.ho_ten}: {LY_DO[k.loi] ?? k.loi ?? 'lỗi'}</li>)}
          </ul>
        )}
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Mật khẩu chỉ hiện <b>một lần</b>. Tải danh sách về, in phát cho học sinh, rồi cất tệp ở nơi riêng tư (không gửi lên nhóm chung).
        </div>
        <button onClick={() => taiVeTep(csvTaiKhoan(thanhCong), `tai-khoan-hoc-sinh-${namHoc}.csv`)} disabled={thanhCong.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          <Download size={16} aria-hidden /> Tải danh sách tài khoản (mở bằng Excel)
        </button>
      </>}
    </HopThoai>
  )
}
