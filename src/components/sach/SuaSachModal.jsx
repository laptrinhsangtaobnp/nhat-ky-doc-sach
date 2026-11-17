// Sửa 1 cuốn sách (nhân viên): thông tin, khối, số bản, chủ đề (≤ 2), ẩn / hiện, xoá. Máy chủ kiểm quyền + ràng buộc.
import { useState } from 'react'
import toast from 'react-hot-toast'
import HopThoai from '../ui/HopThoai'
import { suaSach, xoaSach } from '../../data/sach'
import { TOI_DA_CHU_DE } from '../../domain/danhMuc'

const o = 'mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm'

export default function SuaSachModal({ sach, chuDe, onDong }) {
  const [f, setF] = useState({
    ten: sach.ten, tac_gia: sach.tac_gia ?? '', nxb: sach.nxb ?? '', nam: sach.nam ?? '', khoi_tu: sach.khoi_tu, khoi_den: sach.khoi_den,
    so_ban: sach.so_ban, vi_tri: sach.vi_tri ?? '', gioi_thieu: sach.gioi_thieu ?? '', an: sach.an,
  })
  const [cd, setCd] = useState(sach.sach_chu_de.map(x => x.chu_de_id))
  const [dangLuu, setDangLuu] = useState(false)
  const dat = k => e => setF(x => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const batCd = id => setCd(c => (c.includes(id) ? c.filter(x => x !== id) : c.length < TOI_DA_CHU_DE ? [...c, id] : c))

  async function luu(e) {
    e.preventDefault()
    const khoi_tu = Number(f.khoi_tu), khoi_den = Number(f.khoi_den)
    if (khoi_tu > khoi_den) return toast.error('Khối "từ" phải nhỏ hơn hoặc bằng khối "đến"')
    setDangLuu(true)
    try {
      const rong = v => (String(v).trim() === '' ? null : String(v).trim())
      const moi = await suaSach(sach.id, {
        ten: f.ten.trim(), tac_gia: rong(f.tac_gia), nxb: rong(f.nxb), nam: f.nam === '' ? null : Number(f.nam),
        khoi_tu, khoi_den, so_ban: Number(f.so_ban), vi_tri: rong(f.vi_tri), gioi_thieu: rong(f.gioi_thieu), an: f.an, chuDeIds: cd,
      })
      toast.success('Đã lưu')
      onDong(moi)
    } catch (err) {
      toast.error(err?.code === '23514' ? 'Có ô không hợp lệ (năm, số bản, độ dài…)' : 'Không lưu được')
      setDangLuu(false)
    }
  }

  async function xoa() {
    if (!confirm(`Xoá hẳn sách "${sach.ten}"? Nếu chỉ muốn tạm ẩn với học sinh, hãy tích "Ẩn" thay vì xoá.`)) return
    const { error } = await xoaSach(sach.id)
    if (error) return toast.error('Không xoá được (sách đã có lượt mượn thì chỉ ẩn được)')
    toast.success('Đã xoá')
    onDong(null, true)
  }

  return (
    <HopThoai tieuDe={`Sửa sách ${sach.ma_sach}`} onDong={() => onDong(null)}>
      <form onSubmit={luu} className="space-y-3">
        <label className="block text-sm">Tên sách<input required maxLength={200} value={f.ten} onChange={dat('ten')} className={o} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">Tác giả<input maxLength={150} value={f.tac_gia} onChange={dat('tac_gia')} className={o} /></label>
          <label className="block text-sm">Vị trí (kệ)<input maxLength={50} value={f.vi_tri} onChange={dat('vi_tri')} className={o} /></label>
          <label className="block text-sm">Nhà xuất bản<input maxLength={100} value={f.nxb} onChange={dat('nxb')} className={o} /></label>
          <label className="block text-sm">Năm<input type="number" min={1900} max={2100} value={f.nam} onChange={dat('nam')} className={o} /></label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="block text-sm">Từ khối<select value={f.khoi_tu} onChange={dat('khoi_tu')} className={o}>{[1, 2, 3, 4, 5].map(k => <option key={k}>{k}</option>)}</select></label>
          <label className="block text-sm">Đến khối<select value={f.khoi_den} onChange={dat('khoi_den')} className={o}>{[1, 2, 3, 4, 5].map(k => <option key={k}>{k}</option>)}</select></label>
          <label className="block text-sm">Số bản<input type="number" min={0} max={999} required value={f.so_ban} onChange={dat('so_ban')} className={o} /></label>
        </div>
        <fieldset>
          <legend className="text-sm">Chủ đề (tối đa {TOI_DA_CHU_DE})</legend>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {chuDe.map(c => (
              <button type="button" key={c.id} onClick={() => batCd(c.id)} aria-pressed={cd.includes(c.id)}
                className={`rounded-full px-3 py-1 text-sm ${cd.includes(c.id) ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700'}`}>{c.ten}</button>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm">Giới thiệu ngắn (1–3 câu cho học sinh)
          <textarea rows={3} maxLength={600} value={f.gioi_thieu} onChange={dat('gioi_thieu')} className={o} />
        </label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.an} onChange={dat('an')} /> Ẩn với học sinh (sách hỏng, chưa lên kệ…)</label>
        <div className="flex items-center gap-2 pt-1">
          <button type="button" onClick={xoa} className="mr-auto text-sm text-red-600 hover:underline">Xoá sách</button>
          <button type="button" onClick={() => onDong(null)} className="rounded-lg border px-3 py-2 text-sm">Huỷ</button>
          <button disabled={dangLuu} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{dangLuu ? 'Đang lưu…' : 'Lưu'}</button>
        </div>
      </form>
    </HopThoai>
  )
}
