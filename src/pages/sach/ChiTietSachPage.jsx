// Chi tiết 1 cuốn sách — mọi vai trò (HS không mở được sách ẩn: RLS trả rỗng). Nhân viên có nút Sửa.
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { laySach } from '../../data/sach'
import { layChuDe } from '../../data/chuDe'
import { laNhanVien } from '../../domain/taiKhoan'
import { chuKhoi } from '../../domain/danhMuc'
import BiaSach from '../../components/sach/BiaSach'

const SuaSachModal = lazy(() => import('../../components/sach/SuaSachModal'))

export default function ChiTietSachPage() {
  const { id } = useParams()
  const dieuHuong = useNavigate()
  const { hoSo } = useAuth()
  const nv = laNhanVien(hoSo?.vai_tro)
  const [sach, setSach] = useState(undefined)          // undefined = đang tải, null = không có
  const [chuDe, setChuDe] = useState([])
  const [sua, setSua] = useState(false)

  useEffect(() => {
    let huy = false
    Promise.all([laySach(Number(id)), layChuDe()]).then(([s, c]) => {
      if (huy) return
      setSach(s.error ? null : s.data)
      setChuDe(c.data ?? [])
    })
    return () => { huy = true }
  }, [id])

  if (sach === undefined) return <p className="text-stone-500" role="status">Đang tải…</p>
  if (sach === null) return <p className="rounded-xl bg-white p-6 text-center">Không tìm thấy sách. <Link to="/sach" className="text-emerald-700 underline">Về trang tìm sách</Link></p>

  const tenChuDe = sach.sach_chu_de.map(x => chuDe.find(c => c.id === x.chu_de_id)?.ten).filter(Boolean)
  const nxbNam = [sach.nxb, sach.nam].filter(Boolean).join(', ')

  return (
    <div className="space-y-4">
      <button onClick={() => dieuHuong(-1)} className="flex items-center gap-1 text-sm text-stone-600 hover:text-emerald-700">
        <ArrowLeft size={16} aria-hidden /> Quay lại
      </button>
      <article className="grid gap-5 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-[200px_1fr]">
        <div className="mx-auto w-40 sm:w-full"><BiaSach sach={sach} /></div>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <h1 className="mr-auto text-2xl font-bold">{sach.ten}</h1>
            {nv && (
              <button onClick={() => setSua(true)} className="flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50">
                <Pencil size={14} aria-hidden /> Sửa
              </button>
            )}
          </div>
          {sach.tac_gia && <p className="text-stone-700">Tác giả: <b>{sach.tac_gia}</b></p>}
          {tenChuDe.length > 0 && (
            <div className="flex flex-wrap gap-1.5">{tenChuDe.map(t => <span key={t} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm text-emerald-800">{t}</span>)}</div>
          )}
          {sach.gioi_thieu && <p className="whitespace-pre-line leading-relaxed text-stone-800">{sach.gioi_thieu}</p>}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-stone-600">
            <dt>Dành cho</dt><dd>{chuKhoi(sach.khoi_tu, sach.khoi_den)}</dd>
            {nxbNam && <><dt>Nhà xuất bản</dt><dd>{nxbNam}</dd></>}
            {sach.vi_tri && <><dt>Vị trí</dt><dd>{sach.vi_tri}</dd></>}
            <dt>Mã sách</dt><dd className="font-mono">{sach.ma_sach}</dd>
            {nv && <><dt>Số bản</dt><dd>{sach.so_ban}{sach.an && ' · đang ẩn với học sinh'}</dd></>}
          </dl>
        </div>
      </article>

      <Suspense fallback={null}>
        {sua && <SuaSachModal sach={sach} chuDe={chuDe} onDong={(moi, daXoa) => {
          setSua(false)
          if (daXoa) dieuHuong('/sach', { replace: true })
          else if (moi) setSach(moi)
        }} />}
      </Suspense>
    </div>
  )
}
