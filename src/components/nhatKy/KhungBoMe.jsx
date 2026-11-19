// "5 phút trò chuyện" (gập sẵn): 3 câu bố mẹ hỏi con (câu theo sách do thủ thư nhập + câu chung, đổi theo ngày),
// ô "đọc cùng bố mẹ" và "Bố mẹ viết 1 dòng". Tuỳ chọn — con ghi một mình vẫn được tính đủ.
import { cauTroChuyen } from '../../domain/nhatKy'

export default function KhungBoMe({ homNay, cauHoiSach, nd, datNd }) {
  return (
    <details open={Boolean(nd.boMeViet || nd.cungBoMe)} className="rounded-xl bg-sky-50 p-3 text-sky-950">
      <summary className="cursor-pointer font-semibold">👨‍👩‍👧 5 phút trò chuyện cùng bố mẹ <span className="font-normal text-sky-800">(không bắt buộc)</span></summary>
      <div className="mt-3 space-y-3">
        <div>
          <p className="text-sm">Bố mẹ hỏi con:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">{cauTroChuyen(homNay, cauHoiSach).map(c => <li key={c}>{c}</li>)}</ul>
        </div>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={nd.cungBoMe} onChange={e => datNd({ cungBoMe: e.target.checked })} className="size-5" />
          <span>Hôm nay con đọc cùng bố mẹ (hoặc người thân)</span>
        </label>
        <label className="block">
          <span className="text-sm">Bố mẹ viết 1 dòng cho con</span>
          <input maxLength={300} value={nd.boMeViet} onChange={e => datNd({ boMeViet: e.target.value })}
            placeholder="Ví dụ: Mẹ thích nghe con kể đoạn Dế Mèn hối hận." className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2.5 text-base" />
        </label>
      </div>
    </details>
  )
}
