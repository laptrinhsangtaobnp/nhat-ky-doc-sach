// Thống kê sáng kiến. Máy chủ tính mọi con số (thong_ke); ở đây: tên chỉ số, ghép bảng trước – sau, chênh lệch,
// gộp theo khối, dựng các trang Excel. Hàm thuần, KHÔNG có tên học sinh.

/** 8 chỉ số so sánh trước – sau (tài liệu thư viện phần 3A). tuDong: app tự điền cột "Sau". giam: giảm là tốt. */
export const CHI_SO = [
  { ma: 'luot_thang', ten: 'Tổng lượt mượn mỗi tháng', donVi: 'lượt', tuDong: true },
  { ma: 'ti_le_muon', ten: 'Tỉ lệ học sinh có mượn sách', donVi: '%', tuDong: true, phanTram: true },
  { ma: 'nam_im', ten: 'Số đầu sách "nằm im" (toàn trường)', donVi: 'đầu sách', tuDong: true, giam: true },
  { ma: 'tre_mat', ten: 'Số sách trả trễ hoặc mất', donVi: 'cuốn', tuDong: true, giam: true },
  { ma: 'gio_bao_cao', ten: 'Thời gian làm báo cáo thống kê', donVi: 'giờ', giam: true },
  { ma: 'thich_doc', ten: 'Tỉ lệ HS "rất thích / thích" đọc sách', donVi: '%', phanTram: true },
  { ma: 'sach_thang', ten: 'Số sách trung bình mỗi HS đọc trong tháng (khảo sát)', donVi: 'cuốn' },
  { ma: 'phu_huynh', ten: 'Tỉ lệ phụ huynh thường xuyên đọc cùng con', donVi: '%', phanTram: true },
]

export const PHAM_VI = [
  { ma: 'thi_diem', ten: 'Các lớp thí điểm' },
  { ma: 'toan_truong', ten: 'Toàn trường' },
  { ma: 'lop', ten: 'Một lớp' },
]

const lam1 = x => Math.round(x * 10) / 10

/** Quy đổi về 30 ngày (khoảng ngắn / dài đều so được với "mỗi tháng" của sổ mượn). */
export const moiThang = (so, soNgay) => (soNgay > 0 ? lam1((so * 30) / soNgay) : 0)
/** a / b → % (1 số lẻ); b = 0 → 0. */
export const tiLe = (a, b) => (b > 0 ? lam1((a / b) * 100) : 0)

/** Khoảng mặc định: từ 1/9 năm học hiện tại đến hôm nay. */
export function khoangMacDinh(homNay) {
  const [y, m] = homNay.split('-').map(Number)
  return { tu: `${m >= 8 ? y : y - 1}-09-01`, den: homNay }
}

/** Kiểm khoảng ngày như máy chủ → câu lỗi hoặc null. */
export function kiemKhoang(tu, den) {
  if (!tu || !den) return 'Chọn từ ngày và đến ngày.'
  if (den < tu) return 'Đến ngày phải sau từ ngày.'
  if ((Date.parse(den) - Date.parse(tu)) / 86400000 > 400) return 'Khoảng thời gian tối đa khoảng 13 tháng.'
  return null
}

/** Số "Sau" app tự đo từ kết quả thong_ke. */
export function giaTriTuDong(tk) {
  return {
    luot_thang: moiThang(tk.muon.tong, tk.so_ngay),
    ti_le_muon: tiLe(tk.muon.so_hs, tk.si_so),
    nam_im: tk.nam_im.so,
    tre_mat: tk.muon.tre + tk.muon.mat,
  }
}

/** "12,5" / "12.5" / "" → số hoặc null; chữ sai → NaN. */
export function docSo(chu) {
  const s = String(chu ?? '').trim().replace(',', '.')
  if (!s) return null
  return /^\d+(\.\d+)?$/.test(s) ? Number(s) : NaN
}

/** Kiểm 1 số nhập tay như máy chủ → câu lỗi hoặc null. */
export function kiemSo(chiSo, so) {
  if (so === null) return null
  if (Number.isNaN(so)) return 'Chỉ nhập số (ví dụ 12 hoặc 12,5).'
  if (so > 999999) return 'Số quá lớn.'
  if (CHI_SO.find(c => c.ma === chiSo)?.phanTram && so > 100) return 'Tỉ lệ từ 0 đến 100.'
  return null
}

/**
 * Bảng so sánh: mỗi chỉ số { ...CHI_SO, truoc, sau, nguonTruoc, nguonSau, chenh, phanTramDoi, tot }.
 * soLieu: số thủ thư nhập (lay_so_lieu_sang_kien); tuDong: giaTriTuDong(tk) hoặc null (chưa tải).
 * tot: true = tiến bộ, false = kém đi, null = chưa đủ số / không đổi.
 */
export function bangSoSanh(soLieu = [], tuDong = null) {
  return CHI_SO.map(c => {
    const r = soLieu.find(s => s.chi_so === c.ma) ?? {}
    const truoc = r.truoc == null ? null : Number(r.truoc)
    const sau = c.tuDong ? (tuDong ? tuDong[c.ma] : null) : (r.sau == null ? null : Number(r.sau))
    const coDu = truoc != null && sau != null
    const chenh = coDu ? lam1(sau - truoc) : null
    const phanTramDoi = coDu && truoc > 0 ? lam1(((sau - truoc) / truoc) * 100) : null
    const tot = !coDu || chenh === 0 ? null : (c.giam ? chenh < 0 : chenh > 0)
    return { ...c, truoc, sau, nguonTruoc: r.nguon_truoc ?? '', nguonSau: c.tuDong ? 'App tự đo' : (r.nguon_sau ?? ''), chenh, phanTramDoi, tot }
  })
}

/** Chữ chênh lệch: "+12,5 (+30%)". */
export function chuChenh({ chenh, phanTramDoi }) {
  if (chenh == null) return '—'
  const dau = x => (x > 0 ? '+' : '') + String(x).replace('.', ',')
  return phanTramDoi == null ? dau(chenh) : `${dau(chenh)} (${dau(phanTramDoi)}%)`
}

/** Gộp lượt mượn theo khối từ theo_lop. */
export function theoKhoi(theoLop = []) {
  const m = new Map()
  for (const l of theoLop) {
    const k = m.get(l.khoi) ?? { khoi: l.khoi, si_so: 0, so_luot: 0, so_hs: 0 }
    k.si_so += l.si_so; k.so_luot += l.so_luot; k.so_hs += l.so_hs
    m.set(l.khoi, k)
  }
  return [...m.values()].sort((a, b) => a.khoi - b.khoi)
}

const dam = value => ({ value, fontWeight: 'bold' })
const dauBang = (...cot) => cot.map(dam)

/** Các trang Excel minh chứng (không tên học sinh). tk: kết quả thong_ke; soSanh: bangSoSanh(...) hoặc null. */
export function cacTrangExcel(tk, soSanh, tenPhamVi) {
  const a = tk.app
  const trang = []
  if (soSanh) {
    trang.push({ sheet: 'So sánh trước – sau', columns: [{ width: 50 }, { width: 10 }, { width: 10 }, { width: 18 }, { width: 30 }, { width: 30 }],
      data: [dauBang('Chỉ số', 'Trước', 'Sau', 'Chênh lệch', 'Nguồn số Trước', 'Nguồn số Sau'),
        ...soSanh.map(r => [`${r.ten} (${r.donVi})`, r.truoc, r.sau, chuChenh(r), r.nguonTruoc, r.nguonSau]),
        [], [`Số "Sau" app tự đo: ${tenPhamVi}, từ ${tk.tu} đến ${tk.den}.`]] })
  }
  trang.push({ sheet: 'Tổng quan', columns: [{ width: 50 }, { width: 14 }], data: [
    dauBang('Chỉ số', 'Số'),
    ['Phạm vi', tenPhamVi], ['Từ ngày', tk.tu], ['Đến ngày', tk.den], ['Số học sinh', tk.si_so],
    ['Tổng lượt mượn', tk.muon.tong], ['Lượt mượn mỗi tháng (quy đổi 30 ngày)', moiThang(tk.muon.tong, tk.so_ngay)],
    ['Số HS có mượn ít nhất 1 lần', tk.muon.so_hs], ['Tỉ lệ HS có mượn (%)', tiLe(tk.muon.so_hs, tk.si_so)],
    ['Lượt trả trễ', tk.muon.tre], ['Lượt báo mất', tk.muon.mat],
    ['Lượt đặt mượn qua app', tk.muon.dat_app], ['— trong đó từ gợi ý của app', tk.muon.dat_goi_y],
    ['Đầu sách nằm im (toàn trường)', tk.nam_im.so], ['Tổng đầu sách đang cho mượn', tk.nam_im.tong_sach],
    ['Số HS có nhật ký', a.so_hs_nhat_ky], ['Tổng lần ghi nhật ký', a.so_lan_ghi], ['Tổng ngày ghi được tính (cây lớn)', a.so_ngay_ghi],
    ['Số HS có ghi cùng bố mẹ', a.so_hs_bo_me], ['Lần ghi cùng bố mẹ', a.so_lan_bo_me],
    ['Lượt đọc xong', a.doc_xong], ['Sách đọc xong mỗi HS mỗi tháng (app)', tk.si_so ? moiThang(a.doc_xong / tk.si_so, tk.so_ngay) : 0],
    ['Review được duyệt đăng', a.review_duyet], ['HS hoàn thành thử thách lớp', a.thu_thach_dat], ['Tem thể loại trung bình / HS', a.tem_tb ?? 0],
  ] })
  trang.push({ sheet: 'Mượn theo tháng', columns: [{ width: 12 }, { width: 10 }], data: [dauBang('Tháng', 'Lượt'), ...tk.muon.theo_thang.map(t => [t.thang, t.so])] })
  trang.push({ sheet: 'Theo lớp', columns: [{ width: 10 }, { width: 8 }, { width: 10 }, { width: 10 }, { width: 14 }, { width: 12 }], data: [
    dauBang('Lớp', 'Khối', 'Sĩ số', 'Lượt mượn', 'HS có mượn', 'Tỉ lệ (%)'),
    ...tk.muon.theo_lop.map(l => [l.lop, l.khoi, l.si_so, l.so_luot, l.so_hs, tiLe(l.so_hs, l.si_so)]),
    [], dauBang('Khối', '', 'Sĩ số', 'Lượt mượn', 'HS có mượn', 'Tỉ lệ (%)'),
    ...theoKhoi(tk.muon.theo_lop).map(k => [`Khối ${k.khoi}`, '', k.si_so, k.so_luot, k.so_hs, tiLe(k.so_hs, k.si_so)])] })
  trang.push({ sheet: 'Top 10 sách', columns: [{ width: 6 }, { width: 14 }, { width: 50 }, { width: 10 }],
    data: [dauBang('#', 'Mã sách', 'Tên sách', 'Lượt'), ...tk.muon.top.map((s, i) => [i + 1, s.ma_sach, s.ten, s.so])] })
  trang.push({ sheet: 'Chủ đề yêu thích', columns: [{ width: 30 }, { width: 12 }, { width: 12 }, { width: 14 }],
    data: [dauBang('Chủ đề', 'Lượt mượn', 'Đọc xong', 'Mức thích TB (1–5)'), ...a.chu_de.map(c => [c.ten, c.so_muon, c.so_doc_xong, c.thich_tb])] })
  trang.push({ sheet: 'Sách nằm im', columns: [{ width: 14 }, { width: 60 }],
    data: [dauBang('Mã sách', 'Tên sách'), ...tk.nam_im.ds.map(s => [s.ma_sach, s.ten]),
      ...(tk.nam_im.so > tk.nam_im.ds.length ? [[`… và ${tk.nam_im.so - tk.nam_im.ds.length} đầu sách khác`]] : [])] })
  return trang
}

/** Mã lỗi máy chủ → câu dễ hiểu. */
export function loiThongKe(loi) {
  const m = String(loi?.message ?? '')
  if (m.includes('sai_ngay')) return 'Khoảng thời gian chưa hợp lệ (tối đa khoảng 13 tháng).'
  if (m.includes('sai_pham_vi')) return 'Chọn lớp cần xem.'
  if (m.includes('tu_dong')) return 'Chỉ số này app tự đo, không nhập tay cột "Sau".'
  if (m.includes('sai_so')) return 'Số chưa hợp lệ (tỉ lệ từ 0 đến 100).'
  if (m.includes('forbidden')) return 'Bạn không có quyền xem thống kê.'
  return 'Chưa tải / lưu được, thử lại nhé.'
}
