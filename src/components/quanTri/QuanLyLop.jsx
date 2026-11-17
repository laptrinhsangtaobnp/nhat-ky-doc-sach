// Danh sách lớp của năm học: thêm lớp, đánh dấu lớp thí điểm, xoá lớp.
import { useState } from 'react'
import { X } from 'lucide-react'
import { chuanHoaLop } from '../../domain/nhapHocSinh'

export default function QuanLyLop({ cacLop, onThem, onThiDiem, onXoa }) {
  const [ten, setTen] = useState('')

  function them(e) {
    e.preventDefault()
    const t = chuanHoaLop(ten)
    if (!t) return alert('Tên lớp chưa đúng (ví dụ: 4A)')
    onThem(t)
    setTen('')
  }

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-2 font-semibold">Lớp <span className="text-sm font-normal text-stone-500">— bấm vào lớp để bật / tắt "thí điểm"</span></h2>
      <div className="flex flex-wrap items-center gap-2">
        {cacLop.map(l => (
          <span key={l.id} className={`flex items-center rounded-full border text-sm ${l.thi_diem ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-stone-300'}`}>
            <button onClick={() => onThiDiem(l)} className="py-1 pl-3 pr-1" title={l.thi_diem ? 'Lớp thí điểm — bấm để tắt' : 'Bấm để đánh dấu lớp thí điểm'}>
              {l.ten}{l.thi_diem && ' ★'}
            </button>
            <button onClick={() => confirm(`Xoá lớp ${l.ten}? Học sinh trong lớp sẽ thành "chưa có lớp".`) && onXoa(l)}
              className="rounded-full p-1 text-stone-400 hover:text-red-600" aria-label={`Xoá lớp ${l.ten}`}>
              <X size={14} />
            </button>
          </span>
        ))}
        <form onSubmit={them} className="flex gap-1">
          <input value={ten} onChange={e => setTen(e.target.value)} placeholder="4A" aria-label="Tên lớp mới"
            className="w-16 rounded-lg border border-stone-300 px-2 py-1 text-sm" />
          <button className="rounded-lg border border-stone-300 px-2 py-1 text-sm hover:bg-stone-50">+ Lớp</button>
        </form>
      </div>
    </section>
  )
}
