// Tải + thao tác trang Tủ sách của em: các lượt mượn của em (máy chủ trả sẵn hàng chờ, số bản), quy tắc mượn.
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { huyDatTruoc, layMuonCuaToi } from '../data/muonTra'
import { layCaiDat } from '../data/caiDat'
import { DANG_DUNG, loiMuonTra } from '../domain/muonTra'

export function useTuSach() {
  const [ds, setDs] = useState(null)              // null = đang tải
  const [toiDa, setToiDa] = useState(null)

  const tai = useCallback(() => layMuonCuaToi().then(setDs, () => {
    setDs([])
    toast.error('Không tải được tủ sách, thử lại sau nhé.')
  }), [])

  useEffect(() => {
    tai()
    layCaiDat().then(({ data }) => setToiDa(data?.so_sach_toi_da ?? null))
  }, [tai])

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

  const lay = (...tt) => (ds ?? []).filter(l => tt.includes(l.trang_thai))
  return {
    dangTai: ds === null,
    datTruoc: [...lay('da_soan'), ...lay('dat_truoc')],          // sách đã soạn (cần lên nhận) lên đầu
    dangMuon: lay('dang_muon'),
    daMuon: lay('da_tra', 'mat'),
    dangGiu: lay(...DANG_DUNG).length,
    toiDa,
    huy,
  }
}
