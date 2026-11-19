// Tải + lưu màn Ghi nhật ký (ghi mới hoặc sửa). Máy chủ đặt ngày, tính cây, mốc; ở đây chỉ gửi nội dung em viết.
// Khi chọn sách: tải đủ thông tin (số trang, câu hỏi theo sách) và đặt sẵn trang em đọc đến lần trước.
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ghiNhatKy, layMotNhatKy, layTongQuan, suaNhatKy } from '../data/nhatKy'
import { layMuonCuaToi } from '../data/muonTra'
import { laySach } from '../data/sach'
import { chuCay, loiNhatKy } from '../domain/nhatKy'

const trangLanTruoc = (dangDoc, sachId) => (dangDoc ?? []).find(s => s.id === sachId)?.trang_cuoi ?? ''

const TRONG = { camXuc: null, doanNho: '', trang: '', emNghi: '', cungBoMe: false, boMeViet: '', choCoXem: false }

export function useGhiNhatKy({ id, sachId }) {
  const [sach, setSach] = useState(null)
  const [dangMuon, setDangMuon] = useState([])
  const [dangDoc, setDangDoc] = useState([])           // cuốn đang đọc dở (trang lần trước) — máy chủ trả
  const [nd, setNd] = useState(TRONG)
  const [toiThieu, setToiThieu] = useState(3)
  const [dangTai, setDangTai] = useState(Boolean(id))
  const [dangLuu, setDangLuu] = useState(false)

  useEffect(() => {
    let huy = false
    const tq = layTongQuan().catch(() => null)
    tq.then(t => { if (!huy && t) { setToiThieu(t.so_chu_tinh_chuoi); setDangDoc(t.dang_doc ?? []) } })
    layMuonCuaToi().then(ds => { if (!huy) setDangMuon(ds.filter(l => l.trang_thai === 'dang_muon').map(l => l.sach)) }, () => {})
    if (id) {
      layMotNhatKy(id).then(({ data }) => {
        if (huy) return
        setDangTai(false)
        if (!data) return
        laySach(data.sach_id).then(({ data: s }) => { if (!huy) setSach(s ?? data.sach) })
        setNd({
          camXuc: data.cam_xuc, doanNho: data.doan_nho ?? '', trang: data.trang ?? '', emNghi: data.em_nghi ?? '',
          cungBoMe: data.cung_bo_me, boMeViet: data.bo_me_viet ?? '', choCoXem: data.cho_co_xem,
        })
      })
    } else if (sachId) {
      Promise.all([laySach(sachId), tq]).then(([{ data }, t]) => {
        if (huy || !data) return
        setSach(data)
        setNd(c => ({ ...c, trang: trangLanTruoc(t?.dang_doc, data.id) }))
      })
    }
    return () => { huy = true }
  }, [id, sachId])

  const trangCuoi = sach ? trangLanTruoc(dangDoc, sach.id) || null : null

  /** Chọn sách (null = bỏ chọn); tải thêm số trang + câu hỏi theo sách. */
  function chonSach(s) {
    setSach(s)
    setNd(c => ({ ...c, trang: s ? trangLanTruoc(dangDoc, s.id) : '' }))
    if (s && !('cau_hoi' in s)) laySach(s.id).then(({ data }) => { if (data) setSach(cu => (cu?.id === data.id ? data : cu)) })
  }

  /** Lưu; trả kết quả máy chủ (có moc_moi khi ghi mới) hoặc null nếu lỗi. */
  async function luu() {
    if (!sach) { toast.error('Em chọn cuốn sách trước nhé.'); return null }
    if (!nd.camXuc) { toast.error('Em chọn một cảm xúc nhé.'); return null }
    if (!nd.doanNho.trim() && !nd.emNghi.trim()) { toast.error('Em viết 1 câu thôi cũng được nhé.'); return null }
    setDangLuu(true)
    try {
      const nd2 = { ...nd, trang: nd.trang ? Number(nd.trang) : null }
      const kq = id ? await suaNhatKy(Number(id), nd2) : await ghiNhatKy(sach.id, nd2)
      toast.success(`${id ? 'Đã sửa' : 'Đã lưu nhật ký'}! ${kq.tinh_chuoi ? chuCay(kq.cay).homNay : ''}`, { duration: 5000 })
      return kq
    } catch (loi) {
      toast.error(loiNhatKy(loi), { duration: 6000 })
      return null
    } finally {
      setDangLuu(false)
    }
  }

  return {
    sach, chonSach, dangMuon, trangCuoi, nd, datNd: thayDoi => setNd(c => ({ ...c, ...thayDoi })), toiThieu, dangTai, dangLuu, luu,
  }
}
