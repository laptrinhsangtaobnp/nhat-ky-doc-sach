// Bàn phím PIN 4 số, nút to cho trẻ 8–10 tuổi. Đủ 4 số thì tự gửi (onDu). Gõ phím số trên máy tính cũng được.
import { useEffect } from 'react'

export default function BanPhimPin({ giaTri, onDoi, onDu, khoa }) {
  const bam = so => {
    if (khoa || giaTri.length >= 4) return
    const moi = giaTri + so
    onDoi(moi)
    if (moi.length === 4) onDu(moi)
  }
  const xoa = () => !khoa && onDoi(giaTri.slice(0, -1))

  useEffect(() => {
    const nghe = e => { if (/^\d$/.test(e.key)) bam(e.key); else if (e.key === 'Backspace') xoa() }
    window.addEventListener('keydown', nghe)
    return () => window.removeEventListener('keydown', nghe)
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-3" aria-label={`Đã nhập ${giaTri.length} trên 4 số`}>
        {[0, 1, 2, 3].map(i => (
          <span key={i} className={`size-5 rounded-full border-2 ${i < giaTri.length ? 'border-emerald-600 bg-emerald-600' : 'border-stone-300'}`} />
        ))}
      </div>
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(s => (
          <button key={s} type="button" onClick={() => bam(s)} disabled={khoa}
            className="h-16 rounded-2xl bg-stone-100 text-3xl font-bold active:bg-emerald-100 disabled:opacity-50">{s}</button>
        ))}
        <span />
        <button type="button" onClick={() => bam('0')} disabled={khoa} className="h-16 rounded-2xl bg-stone-100 text-3xl font-bold active:bg-emerald-100 disabled:opacity-50">0</button>
        <button type="button" onClick={xoa} disabled={khoa} aria-label="Xoá số vừa nhập" className="h-16 rounded-2xl text-2xl text-stone-500 active:bg-stone-100">⌫</button>
      </div>
    </div>
  )
}
