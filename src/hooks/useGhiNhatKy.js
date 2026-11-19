// Tải + lưu màn Ghi nhật ký (ghi mới hoặc sửa). Máy chủ đặt ngày, tính chuỗi, mốc; ở đây chỉ gửi nội dung em viết.
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ghiNhatKy, layMotNhatKy, layTongQuan, suaNhatKy } from '../data/nhatKy'
import { layMuonCuaToi } from '../data/muonTra'
import { laySach } from '../data/sach'
import { chuChuoi, loiNhatKy } from '../domain/nhatKy'

const TRONG = { camXuc: null, doanNho: '', trang: '', emNghi: '', cungBoMe: false }

export function useGhiNhatKy({ id, sachId }) {
  const [sach, setSach] = useState(null)
  const [dangMuon, setDangMuon] = useState([])
  const [nd, setNd] = useState(TRONG)
  const [toiThieu, setToiThieu] = useState(20)
  const [dangTai, setDangTai] = useState(Boolean(id))
  const [dangLuu, setDangLuu] = useState(false)

  useEffect(() => {
    let huy = false
    layTongQuan().then(t => { if (!huy) setToiThieu(t.so_chu_tinh_chuoi) }, () => {})
    layMuonCuaToi().then(ds => { if (!huy) setDangMuon(ds.filter(l => l.trang_thai === 'dang_muon').map(l => l.sach)) }, () => {})
    if (id) {
      layMotNhatKy(id).then(({ data }) => {
        if (huy) return
        setDangTai(false)
        if (!data) return
        setSach(data.sach)
        setNd({ camXuc: data.cam_xuc, doanNho: data.doan_nho ?? '', trang: data.trang ?? '', emNghi: data.em_nghi ?? '', cungBoMe: data.cung_bo_me })
      })
    } else if (sachId) {
      laySach(sachId).then(({ data }) => { if (!huy && data) setSach(data) })
    }
    return () => { huy = true }
  }, [id, sachId])

  /** Lưu; trả kết quả máy chủ (có moc_moi khi ghi mới) hoặc null nếu lỗi. */
  async function luu() {
    if (!sach) { toast.error('Em chọn cuốn sách trước nhé.'); return null }
    if (!nd.camXuc) { toast.error('Em chọn một cảm xúc nhé.'); return null }
    if (!nd.doanNho.trim() && !nd.emNghi.trim()) { toast.error('Em viết "Đoạn em nhớ" hoặc "Em nghĩ gì" nhé.'); return null }
    setDangLuu(true)
    try {
      const nd2 = { ...nd, trang: nd.trang ? Number(nd.trang) : null }
      const kq = id ? await suaNhatKy(Number(id), nd2) : await ghiNhatKy(sach.id, nd2)
      const c = chuChuoi(kq.chuoi)
      toast.success(`${id ? 'Đã sửa' : 'Đã lưu nhật ký'}! ${kq.tinh_chuoi ? c.tuan : 'Lần này chưa tính vào chuỗi tuần.'}`, { duration: 5000 })
      return kq
    } catch (loi) {
      toast.error(loiNhatKy(loi), { duration: 6000 })
      return null
    } finally {
      setDangLuu(false)
    }
  }

  return { sach, setSach, dangMuon, nd, datNd: thayDoi => setNd(c => ({ ...c, ...thayDoi })), toiThieu, dangTai, dangLuu, luu }
}
