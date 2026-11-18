// Cho mượn tại chỗ (em đến thư viện chọn sách, không đặt trước): chọn học sinh → chọn sách → Cho mượn.
// Máy chủ (cho_muon_truc_tiep) kiểm: đúng học sinh đang hoạt động, chưa giữ đủ tối đa, không trùng, còn bản trên kệ.
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import HopThoai from '../ui/HopThoai'
import { layNguoiDung } from '../../data/hoSo'
import { layCacLop } from '../../data/lop'
import { timSach } from '../../data/sach'
import { choMuonTrucTiep } from '../../data/muonTra'
import { namHocHienTai } from '../../domain/namHoc'
import { loiMuonTra } from '../../domain/muonTra'

// Tìm có chờ gõ xong 300ms; trả danh sách (tối đa 8 dòng hiển thị)
function useTimCho(tuKhoa, timFn) {
  const [ds, setDs] = useState([])
  useEffect(() => {
    if (tuKhoa.trim().length < 2) return
    let huy = false
    const t = setTimeout(() => timFn(tuKhoa).then(({ data }) => { if (!huy) setDs((data ?? []).slice(0, 8)) }), 300)
    return () => { huy = true; clearTimeout(t) }
  }, [tuKhoa, timFn])
  return tuKhoa.trim().length < 2 ? [] : ds
}

const timHs = k => layNguoiDung({ vaiTro: 'hoc_sinh', tuKhoa: k })
const timS = k => timSach({ tuKhoa: k })

function OChon({ nhan, giaTri, onBo, tuKhoa, setTuKhoa, ds, hien, onChon, goiY }) {
  if (giaTri) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
        <span className="mr-auto"><span className="text-sm text-stone-500">{nhan}: </span><b>{giaTri}</b></span>
        <button onClick={onBo} className="text-sm underline">Đổi</button>
      </div>
    )
  }
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{nhan}
        <input value={tuKhoa} onChange={e => setTuKhoa(e.target.value)} placeholder={goiY}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-base" />
      </label>
      {ds.length > 0 && (
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
          {ds.map(x => <li key={x.id}><button onClick={() => onChon(x)} className="w-full px-3 py-2 text-left hover:bg-stone-50">{hien(x)}</button></li>)}
        </ul>
      )}
    </div>
  )
}

export default function ChoMuonTaiChoModal({ onDong }) {
  const [lop, setLop] = useState([])
  const [kHs, setKHs] = useState(''), [hs, setHs] = useState(null)
  const [kS, setKS] = useState(''), [sach, setSach] = useState(null)
  const [dangGui, setDangGui] = useState(false)
  const dsHs = useTimCho(kHs, timHs)
  const dsS = useTimCho(kS, timS)

  useEffect(() => { layCacLop(namHocHienTai()).then(({ data }) => setLop(data ?? [])) }, [])
  const tenLop = id => lop.find(l => l.id === id)?.ten ?? 'chưa có lớp'

  async function choMuon() {
    setDangGui(true)
    try {
      await choMuonTrucTiep(hs.id, sach.id)
      toast.success(`Đã cho ${hs.ho_ten} mượn "${sach.ten}"`)
      onDong(true)
    } catch (loi) {
      toast.error(loiMuonTra(loi), { duration: 6000 })
    } finally {
      setDangGui(false)
    }
  }

  return (
    <HopThoai tieuDe="Cho mượn tại chỗ" onDong={() => onDong(false)} rong="max-w-lg">
      <p className="text-sm text-stone-600">Dùng khi em đến thư viện chọn sách ngay, không đặt trước. Em đã đặt trước thì cho mượn ở thẻ “Cần soạn” / “Chờ em đến nhận”.</p>
      <OChon nhan="Học sinh" goiY="Gõ tên hoặc tên đăng nhập…" giaTri={hs && `${hs.ho_ten} · ${tenLop(hs.lop_id)}`} onBo={() => setHs(null)}
        tuKhoa={kHs} setTuKhoa={setKHs} ds={dsHs} onChon={setHs}
        hien={x => <>{x.ho_ten} <span className="text-sm text-stone-500">· {tenLop(x.lop_id)} · {x.ten_dang_nhap}{!x.hoat_dong && ' · đã khoá'}</span></>} />
      <OChon nhan="Sách" goiY="Gõ tên sách hoặc mã sách…" giaTri={sach && `${sach.ten} (${sach.ma_sach})`} onBo={() => setSach(null)}
        tuKhoa={kS} setTuKhoa={setKS} ds={dsS} onChon={setSach}
        hien={x => <>{x.ten} <span className="font-mono text-xs text-stone-500">{x.ma_sach}</span></>} />
      <div className="flex justify-end gap-2">
        <button onClick={() => onDong(false)} className="rounded-lg border border-stone-300 px-4 py-2">Đóng</button>
        <button disabled={!hs || !sach || dangGui} onClick={choMuon}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          {dangGui ? 'Đang ghi…' : 'Cho mượn'}
        </button>
      </div>
    </HopThoai>
  )
}
