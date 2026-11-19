// Chọn 1 cảm xúc bằng hình to (dễ bấm trên điện thoại).
import { CAM_XUC } from '../../domain/nhatKy'

export default function ChonCamXuc({ giaTri, onChon }) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7" role="radiogroup" aria-label="Cảm xúc của em">
      {CAM_XUC.map(c => (
        <button key={c.ma} type="button" role="radio" aria-checked={giaTri === c.ma} onClick={() => onChon(c.ma)}
          className={`flex flex-col items-center rounded-xl border-2 px-1 py-2 ${giaTri === c.ma ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}>
          <span className="text-3xl" aria-hidden>{c.hinh}</span>
          <span className="text-xs">{c.ten}</span>
        </button>
      ))}
    </div>
  )
}
