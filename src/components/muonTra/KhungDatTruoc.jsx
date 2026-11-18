// Ở trang chi tiết sách: còn mấy bản, hàng chờ; học sinh đặt trước / huỷ / xem tình trạng lượt của mình.
// Nút chỉ để hiển thị — máy chủ (dat_truoc) mới quyết định được đặt hay không.
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BookmarkPlus } from 'lucide-react'
import { datTruoc, huyDatTruoc, layTinhTrangSach } from '../../data/muonTra'
import { loiMuonTra, moTaChoEm } from '../../domain/muonTra'
import { ngayVN } from '../../domain/ngay'
import HopTrangThai from './HopTrangThai'

export default function KhungDatTruoc({ sachId, laHocSinh }) {
  const [tt, setTt] = useState(undefined)            // undefined = đang tải
  const [dangGui, setDangGui] = useState(false)

  const tai = useCallback(() => layTinhTrangSach(sachId).then(setTt, () => setTt(null)), [sachId])
  useEffect(() => { tai() }, [tai])

  async function lam(viec, loiChuc) {
    setDangGui(true)
    try { await viec(); toast.success(loiChuc); await tai() }
    catch (loi) { toast.error(loiMuonTra(loi), { duration: 6000 }); tai() }
    finally { setDangGui(false) }
  }

  if (!tt) return null
  const soBan = tt.so_ban === 0
    ? 'Thư viện hiện chưa có bản nào của sách này.'
    : tt.con_ban > 0 ? `Còn ${tt.con_ban}/${tt.so_ban} bản trên kệ.` : `Các bạn đang mượn hết ${tt.so_ban} bản.`
  const hangCho = tt.hang_cho > 0 ? ` ${tt.hang_cho} bạn đang đặt trước.` : ''

  if (!laHocSinh) return <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">{soBan}{hangCho}</p>

  if (tt.cua_em) {
    const l = { ...tt.cua_em, con_ban: tt.con_ban }
    return (
      <HopTrangThai moTa={moTaChoEm(l, ngayVN())}>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link to="/hoc-sinh" className="font-semibold underline">Xem tủ sách của em</Link>
          {l.trang_thai === 'dat_truoc' && (
            <button disabled={dangGui} onClick={() => confirm('Em muốn huỷ đặt trước cuốn này?') && lam(() => huyDatTruoc(l.id), 'Đã huỷ đặt trước')}
              className="underline disabled:opacity-50">Huỷ đặt trước</button>
          )}
        </div>
      </HopTrangThai>
    )
  }

  const duRoi = tt.em_dang_giu >= tt.toi_da
  return (
    <div className="space-y-2 rounded-lg bg-stone-50 p-3 text-sm">
      <p className="text-stone-700">{soBan}{hangCho}</p>
      {tt.so_ban > 0 && (duRoi
        ? <p className="text-amber-800">Em đang giữ đủ {tt.toi_da} cuốn. Trả bớt hoặc huỷ một cuốn đặt trước rồi đặt tiếp nhé.</p>
        : <>
            <button disabled={dangGui} onClick={() => lam(() => datTruoc(sachId), 'Đã đặt! Cô thư viện sẽ soạn sách cho em.')}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              <BookmarkPlus size={18} aria-hidden /> {tt.con_ban > 0 ? 'Đặt trước cuốn này' : 'Đặt trước (xếp hàng chờ)'}
            </button>
            <p className="text-stone-500">Đặt xong, cô thư viện soạn sách sẵn; em lên thư viện lúc nào cũng được.</p>
          </>)}
    </div>
  )
}
