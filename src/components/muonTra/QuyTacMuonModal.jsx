// Quy tắc mượn (nhân viên): số cuốn tối đa mỗi em giữ, số ngày mượn, số ngày giữ sách đã soạn.
// Máy chủ giới hạn khoảng giá trị (check) và chỉ cho nhân viên sửa (RLS).
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import HopThoai from '../ui/HopThoai'
import { layCaiDat, suaCaiDat } from '../../data/caiDat'

const O = [
  ['so_sach_toi_da', 'Mỗi em giữ tối đa (cuốn)', 'Tính cả sách đặt trước, đã soạn và đang mượn', 1, 10],
  ['so_ngay_muon', 'Số ngày mượn', 'Hạn trả = ngày cho mượn + số ngày này', 1, 60],
  ['so_ngay_giu', 'Giữ sách đã soạn (ngày)', 'Quá số ngày này mà em chưa đến nhận, thủ thư cất lại', 1, 14],
]

export default function QuyTacMuonModal({ onDong }) {
  const [gt, setGt] = useState(null)
  const [dangLuu, setDangLuu] = useState(false)

  useEffect(() => { layCaiDat().then(({ data }) => setGt(data)) }, [])

  async function luu(e) {
    e.preventDefault()
    setDangLuu(true)
    const { error } = await suaCaiDat(gt)
    setDangLuu(false)
    if (error) return toast.error('Không lưu được (giá trị ngoài khoảng cho phép?)')
    toast.success('Đã lưu quy tắc mượn — áp dụng cho các lượt từ bây giờ')
    onDong()
  }

  return (
    <HopThoai tieuDe="Quy tắc mượn" onDong={onDong} rong="max-w-md">
      {!gt ? <p role="status">Đang tải…</p> : (
        <form onSubmit={luu} className="space-y-3">
          {O.map(([k, nhan, ghiChu, min, max]) => (
            <label key={k} className="block">
              <span className="font-medium">{nhan}</span>
              <input type="number" required min={min} max={max} value={gt[k]} onChange={e => setGt({ ...gt, [k]: Number(e.target.value) })}
                className="mt-1 w-28 rounded-lg border border-stone-300 px-3 py-2 text-base" />
              <span className="block text-sm text-stone-500">{ghiChu} ({min}–{max})</span>
            </label>
          ))}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onDong} className="rounded-lg border border-stone-300 px-4 py-2">Huỷ</button>
            <button disabled={dangLuu} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50">Lưu</button>
          </div>
        </form>
      )}
    </HopThoai>
  )
}
