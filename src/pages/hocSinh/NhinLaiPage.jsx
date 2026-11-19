// Nhìn lại năm đọc sách: số cuốn, số ngày ghi (cây), cảm xúc, theo tháng, kệ sách theo tháng (bấm 1 cuốn → hành trình cảm xúc +
// các lần ghi), thư gửi chính mình đã mở, mốc. /nhin-lai: học sinh xem của mình · /lop/hs/:hsId: GVCN / nhân viên xem 1 em —
// máy chủ chỉ trả con số + cảm xúc; chữ em viết chỉ hiện ở lần em cho cô xem. Có nút In sổ.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { layNhinLai } from '../../data/nhatKy'
import { camXucNhieuNhat, chuThang, MOC, MUC_THICH } from '../../domain/nhatKy'
import { chuNgay } from '../../domain/ngay'
import BiaSach from '../../components/sach/BiaSach'
import DsNhatKy from '../../components/nhatKy/DsNhatKy'
import HanhTrinhCamXuc from '../../components/nhatKy/HanhTrinhCamXuc'
import { BieuDoCamXuc, BieuDoThang } from '../../components/nhatKy/BieuDoNhinLai'
import { useAuth } from '../../context/AuthContext'

function So({ so, nhan }) {
  return <div className="rounded-xl bg-white p-4 text-center shadow-sm"><p className="text-3xl font-bold text-emerald-700">{so}</p><p className="text-sm text-stone-600">{nhan}</p></div>
}

export default function NhinLaiPage() {
  const { hsId } = useParams()
  const { hoSo } = useAuth()
  const dieuHuong = useNavigate()
  const [nl, setNl] = useState(undefined)
  const [mo, setMo] = useState(null)                  // id sách đang mở

  useEffect(() => { layNhinLai(hsId ?? null).then(setNl, () => setNl(null)) }, [hsId])

  if (nl === undefined) return <p className="text-stone-500" role="status">Đang tải…</p>
  if (nl === null) return <p className="rounded-xl bg-white p-6 text-center">Không xem được (không có quyền hoặc lỗi mạng).</p>

  const cx = camXucNhieuNhat(nl.cam_xuc)
  const theoThang = Object.entries(nl.sach.reduce((g, s) => ({ ...g, [s.dau.slice(0, 7)]: [...(g[s.dau.slice(0, 7)] ?? []), s] }), {}))
  const nam = `${nl.tu.slice(0, 4)}–${Number(nl.tu.slice(0, 4)) + 1}`

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {hsId && <button onClick={() => dieuHuong(-1)} className="flex items-center gap-1 text-sm text-stone-600 print:hidden"><ArrowLeft size={16} aria-hidden /> Quay lại</button>}
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">📖 Nhìn lại năm đọc sách {nam}</h1>
          <p className="text-stone-600">{hsId ? nl.ho_ten : `Của ${hoSo?.ho_ten}`}</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm print:hidden">
          <Printer size={16} aria-hidden /> In sổ đọc sách
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <So so={nl.so_cuon} nhan="cuốn đọc xong" />
        <So so={nl.so_lan_ghi} nhan="lần ghi nhật ký" />
        <So so={nl.so_ngay} nhan="ngày ghi nhật ký" />
        <So so={cx ? cx.hinh : '—'} nhan={cx ? `em thấy ${cx.ten.toLowerCase()} nhiều nhất` : 'cảm xúc'} />
      </div>
      {!nl.la_em && <p className="rounded-xl bg-violet-50 px-4 py-2 text-violet-900 print:hidden">🔒 Thầy cô chỉ xem con số và cảm xúc. Chữ em viết chỉ hiện ở những lần em bấm “Cho cô xem” ({nl.so_chia_se} lần trong năm học).</p>}
      {nl.so_lan_bo_me > 0 && <p className="rounded-xl bg-sky-50 px-4 py-2 text-sky-900">👨‍👩‍👧 Em đã đọc cùng bố mẹ {nl.so_lan_bo_me} lần.</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl bg-white p-4 shadow-sm"><h2 className="mb-2 font-semibold">Số lần ghi mỗi tháng</h2><BieuDoThang theoThang={nl.theo_thang} /></section>
        <section className="rounded-xl bg-white p-4 shadow-sm"><h2 className="mb-2 font-semibold">Cảm xúc khi đọc</h2><BieuDoCamXuc dem={nl.cam_xuc} /></section>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">📚 Kệ sách của em</h2>
        {nl.sach.length === 0 && <p className="text-stone-500">Chưa có cuốn nào trong năm học này.</p>}
        {theoThang.map(([thang, ds]) => (
          <div key={thang} className="space-y-2 break-inside-avoid">
            <h3 className="font-semibold text-emerald-700">Tháng {chuThang(thang).slice(1)}</h3>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {ds.map(s => (
                <li key={s.id}>
                  <button onClick={() => setMo(mo === s.id ? null : s.id)} className={`w-full rounded-xl p-1 text-left ${mo === s.id ? 'ring-2 ring-emerald-500' : ''}`}>
                    <BiaSach sach={s} />
                    <p className="mt-1 line-clamp-2 text-sm font-semibold">{s.ten}</p>
                    <p className="text-xs text-stone-500">{s.so_lan} lần ghi{s.muc_thich && ` · ${MUC_THICH[s.muc_thich - 1].hinh}`}{s.ngay_xong && ' · ✓ xong'}</p>
                  </button>
                </li>
              ))}
            </ul>
            {ds.some(s => s.id === mo) && (() => {
              const s = ds.find(x => x.id === mo)
              return (
                <div className="space-y-2 rounded-xl bg-stone-50 p-3">
                  <p className="font-semibold">{s.ten}{s.ngay_xong && <span className="font-normal text-stone-500"> — đọc xong {chuNgay(s.ngay_xong)}</span>}</p>
                  <HanhTrinhCamXuc ds={s.hanh_trinh} soTrang={s.so_trang} />
                  {s.cam_nhan && <p className="italic">“{s.cam_nhan}”</p>}
                  <DsNhatKy hsId={hsId ?? hoSo?.id} sachId={s.id} coLoc={false} choSua={nl.la_em}
                    trong={nl.la_em ? 'Chưa có lần ghi nào.' : 'Em chưa cho cô xem lần ghi nào của cuốn này.'} />
                </div>
              )
            })()}
          </div>
        ))}
      </section>

      {nl.thu.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">💌 Thư em gửi chính mình</h2>
          <ul className="space-y-2">
            {nl.thu.map(t => (
              <li key={t.ten + t.viet_ngay} className="rounded-xl bg-rose-50 p-3 text-rose-950">
                <p className="text-sm text-rose-800">{chuNgay(t.viet_ngay)} · {t.ten}</p>
                <p className="whitespace-pre-line">{t.noi_dung}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {nl.moc.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Mốc đã đạt</h2>
          <ul className="flex flex-wrap gap-3">
            {nl.moc.map(m => <li key={m.ma} className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900">{MOC[m.ma]?.hinh} {MOC[m.ma]?.ten} <span className="text-xs">({chuNgay(m.dat_luc)})</span></li>)}
          </ul>
        </section>
      )}
      {hsId && (
        <section className="space-y-2 print:hidden">
          <h2 className="text-lg font-semibold">Những lần em cho cô xem</h2>
          <DsNhatKy hsId={hsId} trong="Em chưa cho cô xem lần ghi nào." />
        </section>
      )}
    </div>
  )
}
