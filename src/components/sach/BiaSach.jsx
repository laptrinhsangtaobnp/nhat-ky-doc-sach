// Ảnh bìa sách; chưa có ảnh thì vẽ bìa màu (màu theo mã sách) với tên sách.
const MAU = ['bg-emerald-600', 'bg-sky-600', 'bg-amber-500', 'bg-rose-500', 'bg-violet-600', 'bg-teal-600', 'bg-orange-500', 'bg-indigo-500']

function soMau(ma) {
  let h = 0
  for (const c of String(ma)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % MAU.length
}

export default function BiaSach({ sach, className = '' }) {
  if (sach.anh_bia) {
    return <img src={sach.anh_bia} alt={`Bìa sách ${sach.ten}`} loading="lazy"
      className={`aspect-[3/4] w-full rounded-lg bg-stone-100 object-cover ${className}`} />
  }
  return (
    <div aria-hidden className={`flex aspect-[3/4] w-full items-center justify-center rounded-lg p-2 text-center text-white ${MAU[soMau(sach.ma_sach)]} ${className}`}>
      <span className="line-clamp-4 text-sm font-semibold leading-snug">{sach.ten}</span>
    </div>
  )
}
