// Em đọc xong 1 cuốn: mức thích + cảm nhận cuối + thư gửi chính mình (chỉ em xem) + "Giới thiệu sách cho bạn" (gửi thủ thư duyệt,
// không bắt buộc) → 🎉 (mốc mới nếu có) → gợi ý 3 cuốn đọc tiếp, đặt trước luôn.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import HopThoai from '../ui/HopThoai'
import BiaSach from '../sach/BiaSach'
import { danhDauDocXong, layGoiYDocTiep } from '../../data/nhatKy'
import { datTruoc } from '../../data/muonTra'
import { loiNhatKy, MOC, MUC_THICH } from '../../domain/nhatKy'
import { loiMuonTra } from '../../domain/muonTra'
import { vietReview } from '../../data/review'
import { kiemReview, loiReview } from '../../domain/review'
import OVietReview from '../review/OVietReview'

export default function DocXongModal({ sach, onDong }) {
  const [mucThich, setMucThich] = useState(null)
  const [camNhan, setCamNhan] = useState('')
  const [thu, setThu] = useState('')
  const [review, setReview] = useState('')
  const [anTen, setAnTen] = useState(false)
  const loiBai = review.trim() ? kiemReview(review) : null
  const [xong, setXong] = useState(null)          // { moc_moi, goiY }
  const [dangGui, setDangGui] = useState(false)
  const [daDat, setDaDat] = useState([])

  async function luu() {
    setDangGui(true)
    try {
      const kq = await danhDauDocXong(sach.id, mucThich, camNhan, thu)
      let daGuiReview = false
      if (review.trim()) {
        try {
          await vietReview(sach.id, review, anTen)
          daGuiReview = true
        } catch (loi) {
          toast.error(`Đã lưu "đọc xong", nhưng bài giới thiệu chưa gửi được: ${loiReview(loi)} Em gửi lại ở trang của cuốn sách nhé.`, { duration: 8000 })
        }
      }
      const goiY = await layGoiYDocTiep(sach.id).catch(() => [])
      setXong({ ...kq, goiY, daGuiReview })
    } catch (loi) {
      toast.error(loiNhatKy(loi), { duration: 6000 })
    } finally {
      setDangGui(false)
    }
  }

  async function dat(s) {
    try {
      await datTruoc(s.id, 'goi_y')
      setDaDat(d => [...d, s.id])
      toast.success(`Đã đặt trước "${s.ten}"`)
    } catch (loi) {
      toast.error(loiMuonTra(loi), { duration: 6000 })
    }
  }

  if (xong) {
    return (
      <HopThoai tieuDe="🎉 Chúc mừng em!" onDong={() => onDong(true)} rong="max-w-lg">
        <p className="text-center text-lg">Em đã đọc xong <b>{sach.ten}</b>!</p>
        {thu.trim() && <p className="rounded-lg bg-rose-50 p-2 text-center text-rose-900">💌 Thư của em đã được cất. Khoảng 3 tháng nữa app sẽ mở lại cho em đọc!</p>}
        {xong.daGuiReview && <p className="rounded-lg bg-sky-50 p-2 text-center text-sky-900">📣 Bài giới thiệu đã gửi cô thư viện. Cô duyệt xong, các bạn sẽ thấy ở trang cuốn sách.</p>}
        {xong.tem_moi?.map(t => (
          <p key={t} className="rounded-lg bg-indigo-50 p-2 text-center text-indigo-900">🎫 Em nhận tem <b>{t}</b> trong <Link to="/ho-chieu" onClick={() => onDong(true)} className="underline">Hộ chiếu đọc sách</Link>!</p>
        ))}
        {xong.moc_moi?.map(m => (
          <p key={m} className="rounded-lg bg-amber-50 p-2 text-center text-amber-900">{MOC[m]?.hinh} Em đạt mốc <b>{MOC[m]?.ten}</b></p>
        ))}
        {xong.goiY.length > 0 && <>
          <h3 className="font-semibold">Em có thể thích đọc tiếp:</h3>
          <ul className="grid grid-cols-3 gap-3">
            {xong.goiY.map(s => (
              <li key={s.id} className="space-y-1 text-sm">
                <Link to={`/sach/${s.id}`} onClick={() => onDong(true)}><BiaSach sach={s} /></Link>
                <p className="line-clamp-2 font-semibold">{s.ten}</p>
                {daDat.includes(s.id)
                  ? <p className="text-emerald-700">✓ Đã đặt</p>
                  : <button onClick={() => dat(s)} className="w-full rounded-lg border border-emerald-500 px-2 py-1 text-emerald-700 hover:bg-emerald-50">
                      {s.con_ban > 0 ? 'Đặt trước' : 'Xếp hàng chờ'}</button>}
              </li>
            ))}
          </ul>
        </>}
        <button onClick={() => onDong(true)} className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white">Xong</button>
      </HopThoai>
    )
  }

  return (
    <HopThoai tieuDe="Em đọc xong rồi!" onDong={() => onDong(false)} rong="max-w-lg">
      <p>Em thấy <b>{sach.ten}</b> thế nào?</p>
      <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Mức em thích">
        {MUC_THICH.map(m => (
          <button key={m.so} role="radio" aria-checked={mucThich === m.so} onClick={() => setMucThich(m.so)}
            className={`flex flex-col items-center rounded-xl border-2 py-2 ${mucThich === m.so ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200'}`}>
            <span className="text-3xl" aria-hidden>{m.hinh}</span><span className="text-xs">{m.ten}</span>
          </button>
        ))}
      </div>
      <label className="block">
        <span className="font-medium">Cảm nhận cuối của em (không bắt buộc, chỉ em xem)</span>
        <textarea rows={3} maxLength={1000} value={camNhan} onChange={e => setCamNhan(e.target.value)}
          placeholder="Cả cuốn sách làm em nhớ nhất điều gì?" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-base" />
      </label>
      <label className="block rounded-xl bg-rose-50 p-3">
        <span className="font-medium">💌 Thư gửi chính em (không bắt buộc)</span>
        <span className="block text-sm text-stone-600">Viết 1 lời nhắn cho em của 3 tháng sau. Chỉ em đọc được, app sẽ mở lại khi đến ngày.</span>
        <textarea rows={2} maxLength={500} value={thu} onChange={e => setThu(e.target.value)}
          placeholder="Ví dụ: Nhớ nhé, Dế Mèn đã học được bài học…" className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-base" />
      </label>
      <OVietReview noiDung={review} setNoiDung={setReview} anTen={anTen} setAnTen={setAnTen} />
      {loiBai && <p className="text-sm text-rose-700">{loiBai}</p>}
      <button disabled={!mucThich || dangGui || !!loiBai} onClick={luu} className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white disabled:opacity-50">
        {dangGui ? 'Đang lưu…' : 'Lưu'}
      </button>
    </HopThoai>
  )
}
