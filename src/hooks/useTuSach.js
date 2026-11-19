// Tải + thao tác trang chủ học sinh (Tủ sách của em): lượt mượn (máy chủ trả sẵn hàng chờ, số bản), quy tắc mượn,
// tổng quan thói quen (chuỗi tuần, mục tiêu tháng, sách đã đọc xong — máy chủ tính).
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { huyDatTruoc, layMuonCuaToi } from '../data/muonTra'
import { layCaiDat } from '../data/caiDat'
import { datMucTieu, layTongQuan } from '../data/nhatKy'
import { DANG_DUNG, loiMuonTra } from '../domain/muonTra'
import { loiNhatKy } from '../domain/nhatKy'

export function useTuSach() {
  const [ds, setDs] = useState(null)              // null = đang tải
  const [toiDa, setToiDa] = useState(null)
  const [tq, setTq] = useState(null)

  const tai = useCallback(() => layMuonCuaToi().then(setDs, () => {
    setDs([])
    toast.error('Không tải được tủ sách, thử lại sau nhé.')
  }), [])
  const taiTongQuan = useCallback(() => layTongQuan().then(setTq, () => {}), [])

  useEffect(() => {
    tai()
    taiTongQuan()
    layCaiDat().then(({ data }) => setToiDa(data?.so_sach_toi_da ?? null))
  }, [tai, taiTongQuan])

  async function huy(id) {
    try {
      await huyDatTruoc(id)
      toast.success('Đã huỷ đặt trước')
      setDs(d => d.map(l => (l.id === id ? { ...l, trang_thai: 'huy', ly_do_huy: 'hoc_sinh_huy' } : l)))
    } catch (loi) {
      toast.error(loiMuonTra(loi), { duration: 6000 })
      tai()
    }
  }

  async function doiMucTieu(so) {
    try {
      await datMucTieu(so)
      setTq(t => ({ ...t, muc_tieu: so }))
    } catch (loi) {
      toast.error(loiNhatKy(loi))
    }
  }

  const lay = (...tt) => (ds ?? []).filter(l => tt.includes(l.trang_thai))
  return {
    dangTai: ds === null,
    datTruoc: [...lay('da_soan'), ...lay('dat_truoc')],          // sách đã soạn (cần lên nhận) lên đầu
    dangMuon: lay('dang_muon'),
    daMuon: lay('da_tra', 'mat'),
    dangGiu: lay(...DANG_DUNG).length,
    toiDa, tq,
    daDocXong: id => Boolean(tq?.doc_xong?.includes(id)),
    huy, doiMucTieu,
    sauDocXong: () => { taiTongQuan(); tai() },
  }
}
