// Số liệu máy chủ tính trong khoảng đã chọn: thẻ tổng quan, mượn theo tháng / lớp / khối, top 10, chủ đề, sách nằm im.
// Chỉ con số theo lớp / khối / sách — không tên học sinh.
import { moiThang, theoKhoi, tiLe } from '../../domain/thongKe'

function The({ ten, so, phu }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <p className="text-sm text-stone-600">{ten}</p>
      <p className="text-2xl font-bold">{so}</p>
      {phu && <p className="text-xs text-stone-500">{phu}</p>}
    </div>
  )
}

function Bang({ tieuDe, cot, dong, trong = 'Chưa có số liệu.' }) {
  return (
    <section className="space-y-2">
      <h3 className="font-semibold">{tieuDe}</h3>
      {dong.length === 0 ? <p className="text-sm text-stone-500">{trong}</p> : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-600"><tr>{cot.map(c => <th key={c} className="p-2">{c}</th>)}</tr></thead>
            <tbody>{dong.map((d, i) => <tr key={i} className="border-t border-stone-100">{d.map((o, j) => <td key={j} className="p-2">{o}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}

const so = x => String(x ?? 0).replace('.', ',')

export default function SoLieuApp({ tk }) {
  const { muon: m, app: a, nam_im: im } = tk
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold">Mượn sách</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <The ten="Lượt mượn mỗi tháng" so={so(moiThang(m.tong, tk.so_ngay))} phu={`Tổng ${m.tong} lượt / ${tk.so_ngay} ngày (quy đổi 30 ngày)`} />
        <The ten="HS có mượn sách" so={`${so(tiLe(m.so_hs, tk.si_so))}%`} phu={`${m.so_hs}/${tk.si_so} em`} />
        <The ten="Trả trễ / mất" so={`${m.tre} / ${m.mat}`} />
        <The ten="Sách nằm im (toàn trường)" so={im.so} phu={`trên ${im.tong_sach} đầu sách đang cho mượn`} />
        <The ten="Đặt mượn qua app" so={m.dat_app} phu={`${m.dat_goi_y} lượt từ gợi ý của app`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Bang tieuDe="Lượt mượn theo tháng" cot={['Tháng', 'Lượt']} dong={m.theo_thang.map(t => [t.thang, t.so])} />
        <Bang tieuDe="Theo khối" cot={['Khối', 'Sĩ số', 'Lượt', 'HS có mượn']}
          dong={theoKhoi(m.theo_lop).map(k => [k.khoi, k.si_so, k.so_luot, `${k.so_hs} (${so(tiLe(k.so_hs, k.si_so))}%)`])} />
      </div>
      <Bang tieuDe="Theo lớp" cot={['Lớp', 'Sĩ số', 'Lượt', 'HS có mượn']}
        dong={m.theo_lop.map(l => [l.lop, l.si_so, l.so_luot, `${l.so_hs} (${so(tiLe(l.so_hs, l.si_so))}%)`])} />
      <Bang tieuDe="10 sách được mượn nhiều nhất" cot={['#', 'Mã', 'Tên sách', 'Lượt']} dong={m.top.map((s, i) => [i + 1, s.ma_sach, s.ten, s.so])} />

      <h2 className="text-lg font-bold">Số liệu riêng của app</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <The ten="HS có nhật ký" so={`${a.so_hs_nhat_ky}/${tk.si_so}`} phu={`${a.so_lan_ghi} lần ghi · ${a.so_ngay_ghi} ngày cây lớn`} />
        <The ten="Đọc cùng bố mẹ" so={`${a.so_hs_bo_me} em`} phu={`${a.so_lan_bo_me} lần ghi`} />
        <The ten="Lượt đọc xong" so={a.doc_xong} phu={`${so(tk.si_so ? moiThang(a.doc_xong / tk.si_so, tk.so_ngay) : 0)} cuốn / em / tháng`} />
        <The ten="Review được duyệt" so={a.review_duyet} />
        <The ten="Hoàn thành thử thách lớp" so={`${a.thu_thach_dat} em`} />
        <The ten="Tem thể loại trung bình" so={so(a.tem_tb)} phu="tem / em (đến hôm nay)" />
      </div>
      <Bang tieuDe="Chủ đề được yêu thích (căn cứ đề xuất mua sách)" cot={['Chủ đề', 'Lượt mượn', 'Đọc xong', 'Mức thích TB (1–5)']}
        dong={a.chu_de.map(c => [c.ten, c.so_muon, c.so_doc_xong, c.thich_tb == null ? '—' : so(c.thich_tb)])} trong="Chưa có sách gắn chủ đề được mượn / đọc." />
    </div>
  )
}
