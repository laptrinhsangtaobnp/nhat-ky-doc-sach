// Bảng tài khoản: đổi lớp, khoá / mở, đặt lại mật khẩu, xoá (quản trị). Thủ thư chỉ thao tác trên học sinh.
import { KeyRound, Lock, Trash2, Unlock } from 'lucide-react'
import { TEN_VAI_TRO } from '../../domain/taiKhoan'

export default function BangNguoiDung({ ds, dangTai, cacLop, toi, onSua, onDatLaiMk, onXoa }) {
  const laQuanTri = toi.vai_tro === 'quan_tri'
  const duocSua = n => n.id !== toi.id && (laQuanTri || n.vai_tro === 'hoc_sinh')

  async function datLai(n) {
    if (!confirm(`Đặt lại mật khẩu cho ${n.ho_ten}?`)) return
    const mk = await onDatLaiMk(n)
    if (mk) alert(`Mật khẩu mới của ${n.ho_ten} (${n.ten_dang_nhap}): ${mk}`)
  }

  if (dangTai && ds.length === 0) return <p className="py-6 text-center text-stone-500">Đang tải…</p>
  if (ds.length === 0) return <p className="py-6 text-center text-stone-500">Chưa có tài khoản nào khớp.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-stone-500">
          <tr><th className="py-2 pr-2">Họ tên</th><th className="pr-2">Tên đăng nhập</th><th className="pr-2">Vai trò</th><th className="pr-2">Lớp</th><th className="text-right">Thao tác</th></tr>
        </thead>
        <tbody>
          {ds.map(n => (
            <tr key={n.id} className={`border-t border-stone-100 ${n.hoat_dong ? '' : 'text-stone-400'}`}>
              <td className="py-2 pr-2 font-medium">{n.ho_ten}{!n.hoat_dong && ' (đã khoá)'}</td>
              <td className="pr-2 font-mono">{n.ten_dang_nhap}</td>
              <td className="pr-2">{TEN_VAI_TRO[n.vai_tro]}</td>
              <td className="pr-2">
                {duocSua(n) && (n.vai_tro === 'hoc_sinh' || n.vai_tro === 'giao_vien') ? (
                  <select value={n.lop_id ?? ''} onChange={e => onSua(n, { lop_id: e.target.value ? Number(e.target.value) : null })}
                    className="rounded border border-stone-200 px-1 py-0.5" aria-label={`Lớp của ${n.ho_ten}`}>
                    <option value="">—</option>
                    {cacLop.map(l => <option key={l.id} value={l.id}>{l.ten}</option>)}
                  </select>
                ) : (cacLop.find(l => l.id === n.lop_id)?.ten ?? '—')}
              </td>
              <td className="whitespace-nowrap text-right">
                {duocSua(n) && <>
                  <button onClick={() => datLai(n)} className="p-1.5 text-stone-500 hover:text-emerald-700" title="Đặt lại mật khẩu"><KeyRound size={16} /></button>
                  <button onClick={() => onSua(n, { hoat_dong: !n.hoat_dong })} className="p-1.5 text-stone-500 hover:text-amber-600"
                    title={n.hoat_dong ? 'Khoá tài khoản' : 'Mở khoá'}>{n.hoat_dong ? <Lock size={16} /> : <Unlock size={16} />}</button>
                  {laQuanTri && (
                    <button onClick={() => confirm(`Xoá hẳn ${n.ho_ten}? Mọi nhật ký, lượt mượn của người này cũng mất. Nên dùng "Khoá" nếu chỉ tạm ngừng.`) && onXoa(n)}
                      className="p-1.5 text-stone-500 hover:text-red-600" title="Xoá hẳn"><Trash2 size={16} /></button>
                  )}
                </>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
