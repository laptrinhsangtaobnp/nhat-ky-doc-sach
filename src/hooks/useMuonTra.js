// Tải + thao tác trang Mượn – trả (nhân viên): thẻ đếm, danh sách theo thẻ (50 dòng, "Xem thêm"), tìm, thao tác cập nhật tại chỗ.
// Không tự hỏi lại máy chủ định kỳ — có nút Làm mới.
import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { baoMat, choMuon, demMuon, ghiTra, huyDatTruoc, layDsMuon, MUON_MOI_TRANG, soanSach } from '../data/muonTra'
import { boLuotKhoiHang, loiMuonTra } from '../domain/muonTra'

// Thao tác → [hàm máy chủ, lời báo, có lấy 1 bản trên kệ không]
const VIEC = {
  soan: [soanSach, 'Đã soạn — học sinh sẽ thấy "Sách đã soạn xong"', true],
  cho_muon: [choMuon, 'Đã cho mượn', true],
  huy: [huyDatTruoc, 'Đã huỷ / cất lại', false],
  tra: [ghiTra, 'Đã ghi trả', false],
  mat: [baoMat, 'Đã báo mất (số bản giảm 1)', false],
}

export function useMuonTra() {
  const [loai, setLoai] = useState('can_soan')
  const [tuKhoa, setTuKhoa] = useState('')
  const [ds, setDs] = useState([])
  const [trang, setTrang] = useState(0)
  const [conNua, setConNua] = useState(false)
  const [dem, setDem] = useState(null)
  const [dangTai, setDangTai] = useState(true)
  const [dangLam, setDangLam] = useState(null)        // id lượt đang xử lý
  const lanGoi = useRef(0)

  const taiDem = useCallback(() => demMuon().then(setDem, () => {}), [])

  const tai = useCallback(async trangMoi => {
    const lan = ++lanGoi.current
    setDangTai(true)
    try {
      const data = await layDsMuon({ loai, tuKhoa, trang: trangMoi })
      if (lan !== lanGoi.current) return
      setDs(cu => (trangMoi === 0 ? data : [...cu, ...data]))
      setTrang(trangMoi)
      setConNua(data.length === MUON_MOI_TRANG)
    } catch (loi) {
      if (lan === lanGoi.current) toast.error(loiMuonTra(loi))
    } finally {
      if (lan === lanGoi.current) setDangTai(false)
    }
  }, [loai, tuKhoa])

  useEffect(() => { taiDem() }, [taiDem])
  useEffect(() => {
    const t = setTimeout(() => tai(0), 300)
    return () => clearTimeout(t)
  }, [tai])

  async function lam(viec, luot) {
    const [ham, loiBao, layBan] = VIEC[viec]
    setDangLam(luot.id)
    try {
      await ham(luot.id)
      toast.success(loiBao)
      setDs(d => (luot.trang_thai === 'dat_truoc' ? boLuotKhoiHang(d, luot, layBan) : d.filter(l => l.id !== luot.id)))
      taiDem()
    } catch (loi) {
      toast.error(loiMuonTra(loi), { duration: 6000 })
    } finally {
      setDangLam(null)
    }
  }

  return {
    loai, tuKhoa, ds, dem, dangTai, dangLam, conNua,
    datLoai: l => { setDs([]); setLoai(l) },
    setTuKhoa,
    xemThem: () => tai(trang + 1),
    taiLai: () => { taiDem(); tai(0) },
    lam,
  }
}
