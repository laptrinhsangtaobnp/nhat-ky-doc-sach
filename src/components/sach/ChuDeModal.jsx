// Quản lý chủ đề (nhân viên): thêm, đổi tên, đổi thứ tự hiển thị, xoá. RLS chỉ cho nhân viên ghi.
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import HopThoai from '../ui/HopThoai'
import { suaChuDe, themChuDe, xoaChuDe } from '../../data/chuDe'

const loi = (e, macDinh) => toast.error(e?.code === '23505' ? 'Chủ đề này đã có' : macDinh)

export default function ChuDeModal({ chuDe, onDong }) {
  const [ds, setDs] = useState(chuDe)
  const [moi, setMoi] = useState('')

  async function them(e) {
    e.preventDefault()
    if (!moi.trim()) return
    const { data, error } = await themChuDe(moi, ds.length + 1)
    if (error) return loi(error, 'Không thêm được')
    setDs(d => [...d, data])
    setMoi('')
  }

  async function luu(cd, thayDoi) {
    const ban = { ...cd, ...thayDoi }
    if (!ban.ten.trim() || (ban.ten === cd.ten && ban.thu_tu === cd.thu_tu)) return
    const { data, error } = await suaChuDe(cd.id, ban)
    if (error) return loi(error, 'Không lưu được')
    setDs(d => d.map(x => (x.id === cd.id ? data : x)))
  }

  async function xoa(cd) {
    if (!confirm(`Xoá chủ đề "${cd.ten}"? Sách vẫn còn, chỉ mất nhãn chủ đề này.`)) return
    const { error } = await xoaChuDe(cd.id)
    if (error) return loi(error, 'Không xoá được')
    setDs(d => d.filter(x => x.id !== cd.id))
  }

  return (
    <HopThoai tieuDe="Chủ đề sách" onDong={onDong} rong="max-w-lg">
      <p className="text-sm text-stone-600">Nên có 8–12 chủ đề. Số nhỏ hiện trước. Sửa xong bấm ra ngoài ô là tự lưu.</p>
      <ul className="space-y-2">
        {ds.map(cd => (
          <li key={cd.id} className="flex items-center gap-2">
            <input type="number" defaultValue={cd.thu_tu} min={0} max={99} aria-label={`Thứ tự ${cd.ten}`}
              onBlur={e => luu(cd, { thu_tu: Number(e.target.value) || 0 })} className="w-16 rounded-lg border border-stone-300 px-2 py-1.5 text-sm" />
            <input defaultValue={cd.ten} maxLength={50} aria-label="Tên chủ đề"
              onBlur={e => luu(cd, { ten: e.target.value })} className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-sm" />
            <button onClick={() => xoa(cd)} className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600" aria-label={`Xoá ${cd.ten}`}>
              <Trash2 size={16} />
            </button>
          </li>
        ))}
        {ds.length === 0 && <li className="text-sm text-stone-500">Chưa có chủ đề. Thêm ở dưới, hoặc nhập Excel có cột Chủ đề.</li>}
      </ul>
      <form onSubmit={them} className="flex gap-2">
        <input value={moi} onChange={e => setMoi(e.target.value)} maxLength={50} placeholder="Tên chủ đề mới (ví dụ: Cổ tích)"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm" aria-label="Tên chủ đề mới" />
        <button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Thêm</button>
      </form>
    </HopThoai>
  )
}
