// Học sinh đã đọc xong cuốn này: xem trạng thái bài giới thiệu của em (chờ duyệt / đã hiện / chưa duyệt + lý do), viết, sửa, xoá.
import { useState } from 'react'
import { kiemReview, LY_DO_KHONG_DUYET, TRANG_THAI_REVIEW } from '../../domain/review'
import OVietReview from './OVietReview'

export default function BaiCuaEm({ cuaEm, lop, ban, onViet, onXoa }) {
  const [sua, setSua] = useState(false)
  const [noiDung, setNoiDung] = useState(cuaEm?.noi_dung ?? '')
  const [anTen, setAnTen] = useState(cuaEm?.an_ten ?? false)
  const canhBao = noiDung.trim() ? kiemReview(noiDung) : null

  async function gui() {
    if (await onViet(noiDung, anTen)) setSua(false)
  }

  if (sua) {
    return (
      <div className="space-y-2">
        <OVietReview noiDung={noiDung} setNoiDung={setNoiDung} anTen={anTen} setAnTen={setAnTen} lop={lop} />
        {canhBao && <p className="text-sm text-rose-700">{canhBao}</p>}
        <div className="flex gap-2">
          <button disabled={ban || !!kiemReview(noiDung)} onClick={gui}
            className="flex-1 rounded-lg bg-sky-600 py-2.5 font-semibold text-white disabled:opacity-50">Gửi cô thư viện duyệt</button>
          <button onClick={() => setSua(false)} className="rounded-lg border border-stone-300 px-4">Thôi</button>
        </div>
      </div>
    )
  }

  if (!cuaEm) {
    return (
      <button onClick={() => setSua(true)} className="w-full rounded-xl border-2 border-dashed border-sky-300 py-3 font-semibold text-sky-800 hover:bg-sky-50">
        📣 Em đã đọc xong — giới thiệu sách cho bạn
      </button>
    )
  }

  const tt = TRANG_THAI_REVIEW[cuaEm.trang_thai]
  return (
    <div className={`space-y-2 rounded-xl p-3 ${tt.mau}`}>
      <p className="text-sm font-semibold">Bài của em · {tt.chu}{cuaEm.an_ten && ' · ẩn tên'}</p>
      {cuaEm.trang_thai === 'khong_duyet' && cuaEm.ly_do && <p className="text-sm">Lý do: {LY_DO_KHONG_DUYET[cuaEm.ly_do]}. Em sửa lại rồi gửi nhé.</p>}
      <p className="whitespace-pre-line">{cuaEm.noi_dung}</p>
      <div className="flex gap-3 text-sm">
        <button onClick={() => setSua(true)} className="font-semibold underline">Sửa</button>
        <button disabled={ban} onClick={() => { if (confirm('Xoá bài giới thiệu của em?')) onXoa() }} className="underline">Xoá</button>
      </div>
    </div>
  )
}
