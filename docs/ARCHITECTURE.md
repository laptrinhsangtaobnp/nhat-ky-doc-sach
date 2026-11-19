# Kiến trúc — cập nhật 18/11/2026 (giai đoạn 3: nhật ký + Nhìn lại)

```
Trình duyệt (React, Vercel)
  ├─ Đăng nhập ──────────► Supabase Auth (tên đăng nhập = <ten>@school.local; tắt tự đăng ký)
  ├─ Đọc / ghi dữ liệu ──► Neon Data API — nhận JWT Supabase (JWKS), RLS dùng auth.uid()
  ├─ Tạo / sửa / xoá TK ─► Supabase Edge Functions: tao-tai-khoan · sua-tai-khoan · xoa-tai-khoan
  │                         (đọc vai trò người gọi ở Neon bằng thẻ của chính họ; Neon kiểm lại lần nữa)
  ├─ AI (giai đoạn 1+) ──► Vercel api/*.js (Gemini) — chỉ nhân viên
  └─ Ảnh bìa (gđ 1) ─────► Cloudinary
Máy thầy: scripts/sao-luu-neon.mjs (Neon + auth Supabase → SaoLuu/), scripts/khoi-phuc-neon.mjs
```

## 3 tầng
| Tầng | Thư mục | Việc |
|---|---|---|
| Giao diện | `src/pages`, `src/components`, `src/hooks` | hiển thị, nhận thao tác; hook gom tải + thao tác của 1 trang |
| Dữ liệu | `src/data/` | CHỈ nơi gọi Supabase / Neon; chọn sẵn cột, có giới hạn dòng |
| Nghiệp vụ | `src/domain/` | hàm thuần, có test |

## Danh mục hàm — TRA Ở ĐÂY TRƯỚC KHI VIẾT HÀM MỚI
Có rồi thì dùng lại; thấy 2 hàm cùng việc thì gộp. Thêm / đổi / xoá hàm → sửa bảng này cùng lúc.

**src/domain/** (hàm thuần, có test)
| Tệp | Hàm | Việc |
|---|---|---|
| `taiKhoan.js` | `VAI_TRO`, `TEN_VAI_TRO`, `DUOI_EMAIL`, `TEN_DANG_NHAP_HOP_LE` | hằng số vai trò, đuôi email, mẫu tên đăng nhập |
| | `laNhanVien(vaiTro)` | quản trị hoặc thủ thư? |
| | `trangChu(vaiTro)` | đường dẫn trang chủ theo vai trò |
| | `emailDangNhap(nhap)` | chữ gõ ở ô đăng nhập → email (có `@` thì giữ nguyên) |
| | `loiDangNhap(loi)` | lỗi Supabase Auth → câu tiếng Việt dễ hiểu |
| | `boDau(s)` | bỏ dấu tiếng Việt, chữ thường |
| | `goiYTenDangNhap(hoTen, daDung)` | "Nguyễn Văn An" → `annv`, trùng thì `annv2` |
| | `taoMatKhau(rand)` | mật khẩu 6 chữ số |
| `nhapHocSinh.js` | `chuanHoaLop(s)`, `khoiCuaLop(lop)` | "3 a" → "3A"; khối của lớp |
| | `docBangHocSinh(dongs)` | dòng Excel → danh sách học sinh + lỗi từng dòng |
| | `ganTenDangNhap(hocSinh, daCo, rand)` | gán tên đăng nhập + mật khẩu, chống trùng |
| | `csvTaiKhoan(ds)` | CSV tài khoản để in phát cho HS (có BOM cho Excel) |
| `namHoc.js` | `namHocHienTai(ngay)` | "2026-2027" (đổi năm học từ tháng 8) |
| `danhMuc.js` | `MA_SACH_HOP_LE`, `TOI_DA_CHU_DE`, `chuanHoaMaSach(s)` | " tn 001 " → "TN001" |
| | `tachNxbNam(s)` | "Kim Đồng, 2020" → { nxb, nam } |
| | `docKhoi(s)`, `chuKhoi(tu, den)` | "3-4" → {3,4}; hiển thị "Khối 3–4" / "Mọi khối" |
| | `tachChuDe(s)` | "Cổ tích; Khoa học" → mảng, bỏ trùng |
| | `docBangSach(dongs, chuDeCo)` | dòng Excel → sách + lỗi từng dòng + chủ đề mới; chống trùng mã trong tệp |
| | `tachCauHoiExcel(s)` | ô Câu hỏi → mỗi câu 1 dòng (xuống dòng / dấu ;) |
| | `mauTim(s)` | chữ ô tìm → mẫu không dấu cho cột `sach.tim` |
| `ngay.js` | `ngayVN(luc)` | "YYYY-MM-DD" theo giờ Việt Nam (khớp `hom_nay()` ở máy chủ) |
| | `soNgayDen(han, homNay)`, `chuNgay(ngay, homNay)` | số ngày đến hạn (âm = quá); "25/11" |
| `muonTra.js` | `DANG_DUNG`, `TEN_TRANG_THAI` | các trạng thái đang giữ sách; tên trạng thái |
| | `coBanChoEm(l)` | đặt trước đã có bản trên kệ cho em chưa (thứ chờ ≤ số bản còn) |
| | `moTaChoEm(l, homNay)` | câu báo cho HS theo trạng thái / hạn → { tieuDe, chiTiet, mau } |
| | `nhanHan(han, homNay)` | "Quá hạn 3 ngày" / "Hạn hôm nay" / "Còn 2 ngày" cho nhân viên |
| | `loiMuonTra(loi)` | mã lỗi hàm máy chủ → câu dễ hiểu |
| | `boLuotKhoiHang(ds, luot, layBan)` | cập nhật tại chỗ hàng chờ sau khi soạn / cho mượn / huỷ |
| `nhatKy.js` | `CAM_XUC`, `camXuc(ma)`, `MUC_THICH`, `CAU_GOI_Y`, `CAU_TRO_CHUYEN`, `MOC` | 7 cảm xúc, 5 mức thích, câu gợi ý cho em, câu bố mẹ hỏi con, mốc (ngày 7/30/100, gia đình; mã cũ để hiện) |
| | `GIAI_DOAN_CAY`, `giaiDoanCay(soNgay)`, `chuCay(cay)` | cây đọc sách theo số ngày có ghi (không héo) |
| | `cauHoiHomNay(ngay, buoc)`, `tachCauHoi(cauHoi)`, `cauTroChuyen(ngay, cauHoiSach)` | câu gợi ý đổi theo ngày; 3 câu "5 phút trò chuyện" (câu theo sách trước) |
| | `viTriHanhTrinh(ds, soTrang)`, `trangToiDa(soTrang, trangCuoi)` | hành trình cảm xúc theo trang; giới hạn thanh kéo trang |
| | `demChu(t)`, `duDaiTinhChuoi(doanNho, emNghi, toiThieu)` | đếm chữ như máy chủ `so_chu` — chỉ để nhắc em |
| | `conSuaDuoc(ngay, homNay)` | trong 7 ngày (máy chủ cũng chặn) |
| | `loiNhac(lanGhiCuoi, homNay)` | dòng nhắc trang chủ |
| | `camXucNhieuNhat(dem)`, `chuThang(thang)`, `loiNhatKy(loi)` | Nhìn lại; "T11"; lỗi máy chủ → câu dễ hiểu |
| `review.js` | `REVIEW_TOI_THIEU`, `REVIEW_TOI_DA`, `LY_DO_KHONG_DUYET`, `TRANG_THAI_REVIEW` | 10–300 ký tự; lý do không duyệt; nhãn trạng thái |
| | `kiemReview(noiDung)`, `tenNguoiViet({ten, lop})`, `chuDaDoc({da_doc, cung_lop, lop})`, `loiReview(loi)` | kiểm trước khi gửi; "Lan N.T. – lớp 3A" / "Một bạn lớp 3A"; "12 bạn đã đọc · 5 bạn lớp 3A"; lỗi máy chủ |

**src/data/** (chỉ nơi gọi Supabase / Neon)
| Tệp | Hàm | Việc |
|---|---|---|
| `dangNhap.js` | `dangNhap`, `dangXuat`, `layPhien`, `theoDoiDangNhap`, `doiMatKhauCuaToi` | Supabase Auth |
| | `layTenTheoMaLop(ma)`, `dangNhapPin(ma, hsId, pin)` | HS: Edge Function `dang-nhap-pin` → đặt phiên |
| `pin.js` | `layMaLop`, `doiMaLop`, `layTinhTrangPin`, `taoPin(lopId, hsId?)` | mã lớp + PIN (rpc, nhân viên / GVCN lớp mình) |
| `hoSo.js` | `layHoSo(id)` | hồ sơ 1 người |
| | `layNguoiDung({lopId, vaiTro, tuKhoa, trang})` | danh sách có lọc, 50 dòng/trang + tổng |
| | `layTenDangNhapDaCo(ds)` | tên đăng nhập nào đã có (chống trùng khi nhập Excel) |
| | `suaHoSo({...})` | rpc `sua_ho_so` |
| `lop.js` | `layCacLop(namHoc)`, `damBaoCoLop(ten, namHoc)`, `taoLop`, `datThiDiem`, `xoaLop` | bảng `lop` |
| `taiKhoan.js` | `taoTaiKhoan(ds, moiLan)`, `datLaiMatKhau(id, mk)`, `xoaTaiKhoan(id)` | Edge Functions tài khoản (lô 40 người) |
| `sach.js` | `timSach({tuKhoa, chuDeId, khoi, trang})` | tìm không dấu, lọc chủ đề / khối, 30 cuốn/trang + tổng |
| | `laySach(id)`, `suaSach(id, {...so_trang, cau_hoi, chuDeIds})`, `xoaSach(id)` | chi tiết / sửa (cột được phép + rpc `dat_chu_de_sach`) / xoá |
| | `nhapDanhMuc(ds, moiLan)` | rpc `nhap_danh_muc` (có số trang, câu hỏi — `sql/2026-11-19_nhap_so_trang.sql`), lô 200 cuốn |
| `chuDe.js` | `layChuDe`, `themChuDe`, `suaChuDe`, `xoaChuDe` | bảng `chu_de` |
| `muonTra.js` | `datTruoc(sachId, nguon)`, `huyDatTruoc(id)`, `layMuonCuaToi()`, `layTinhTrangSach(sachId)` | HS (rpc; ném lỗi khi máy chủ từ chối) |
| | `soanSach`, `choMuon`, `choMuonTrucTiep(hsId, sachId)`, `ghiTra`, `baoMat`, `layDsMuon({loai, tuKhoa, trang})`, `demMuon()` | nhân viên (rpc), 50 dòng/trang |
| `caiDat.js` | `layCaiDat()`, `suaCaiDat({...})` | quy tắc mượn (bảng `cai_dat`) |
| `nhatKy.js` | `ghiNhatKy(sachId, nd)`, `suaNhatKy(id, nd)`, `xoaNhatKy(id)`, `doiChoCoXem(id, cho)`, `danhDauDocXong(sachId, mucThich, camNhan, thu)`, `moThu(sachId)` | HS ghi (rpc, ném lỗi) |
| | `layTongQuan()`, `layGoiYDocTiep(sachId)`, `layNhinLai(hsId)`, `layLopTongQuan(lopId)` | rpc đọc (máy chủ tính cây / mốc / thống kê; người khác chỉ nhận con số) |
| | `layNhatKy({hsId, sachId, camXuc, tuKhoa, trang})`, `layMotNhatKy(id)` | bảng `nhat_ky` (RLS: em hết; GVCN / nhân viên chỉ lần "Cho cô xem"), 30 dòng/trang |
| `review.js` | `vietReview(sachId, noiDung, anTen)`, `xoaReview(sachId)`, `layReviewSach(sachId)` | HS viết / sửa (→ chờ duyệt lại) / xoá; trang sách (rpc) |
| | `layReviewChoDuyet()`, `duyetReview(id, suaLuc)`, `khongDuyetReview(id, lyDo)` | nhân viên: hàng chờ (50), duyệt đúng bản đang xem, không duyệt / gỡ |
| `tepExcel.js` | `docTepExcel(tep)`, `taiVeTep(noiDung, tenTep)` | đọc .xlsx (≤ 5MB), tải tệp về máy |
| `cauHinh.js` | `THIEU_CAU_HINH` | đã đủ biến kết nối chưa |

**src/hooks/**: `useTaiKhoan()` — trang Tài khoản · `useTimSach()` — trang Tìm sách (lọc, "Xem thêm", cập nhật tại chỗ) ·
`useTuSach()` — trang chủ HS (lượt mượn + tổng quan thói quen) · `useMuonTra()` — trang Mượn – trả ·
`useGhiNhatKy({id, sachId})` — ghi / sửa nhật ký · `useDsNhatKy({hsId, sachId})` — danh sách nhật ký (lọc, xoá / bật tắt "Cho cô xem" tại chỗ) ·
`usePinLop(lopId)` — trang Mã lớp & PIN · `useReviewSach(sachId)` — mục "Các bạn nói gì" · `useReviewChoDuyet()` — thẻ Review chờ duyệt.

**src/lib/**: `supabase.js` (2 client), `goiLai.js` (gọi lại khi Neon chưa nhận thẻ), `conDaLuu.js` (các bạn đã vào trên máy này:
chỉ id, tên rút gọn, lớp, mã lớp — không PIN, không dữ liệu đọc sách).

**src/domain/dangNhapPin.js**: `MA_LOP_HOP_LE`, `chuanMaLop(s)`, `loiPin(kq, homNay)`, `themCon(ds, con)`, `boCon(ds, id)`, `TOI_DA_CON`.

**Edge Functions** `supabase/functions/_shared/chung.ts`: `json`, `laOptions`, `quanTriSupabase()`, `neon(duong, token)`,
`nguoiGoi(req, sb)` (chỉ trả về nếu là nhân viên đang hoạt động), `vaiTroCua(id, token)`.
`dang-nhap-pin` (**--no-verify-jwt**, ai cũng gọi được): `{ma}` → tên rút gọn các em có PIN; `{ma, hs, pin}` → kiểm PIN ở Neon bằng
vai trò `dang_nhap_pin` (secret `NEON_PIN_URL`, chỉ gọi được `ds_ten_theo_ma`, `kiem_pin`) → đúng thì tạo phiên Supabase (magic link
tạo + xác nhận ngay ở máy chủ, không gửi email).

**Hàm Neon (SQL)**: `vai_tro_cua_toi()`, `lop_cua_toi()`, `la_nhan_vien()`, `tao_ho_so`, `sua_ho_so`, `xoa_ho_so`,
`bo_dau(t)` (bỏ dấu, dùng cho cột `sach.tim`), `nhap_danh_muc(p_ds)`, `dat_chu_de_sach(p_sach_id, p_chu_de_ids)`,
trigger `kiem_toi_da_chu_de` (≤ 2 chủ đề / sách).
Mượn – trả: HS `dat_truoc`, `huy_dat_truoc` (cả nhân viên), `muon_cua_toi`, `tinh_trang_sach`; nhân viên `soan_sach`, `cho_muon`,
`cho_muon_truc_tiep`, `ghi_tra`, `bao_mat`, `ds_muon(loai, tu_khoa, trang)`, `dem_muon`. Nội bộ (không cấp cho trình duyệt):
`hom_nay()` (giờ VN), `ban_ranh(sach)`, `thu_tu_cho(luot)`, `kiem_con_cho(hs, sach)` (không trùng, chưa quá tối đa).
Nhật ký: HS `ghi_nhat_ky`, `sua_nhat_ky` / `xoa_nhat_ky` (7 ngày), `doi_cho_co_xem`, `danh_dau_doc_xong` (cần ≥ 1 lần ghi; kèm thư gửi chính mình), `mo_thu` (đến ngày mới mở),
`tong_quan_cua_toi` (cây, đọc tiếp, tuần này, thư), `goi_y_doc_tiep`; `nhin_lai_nam(hs, tu)` (em; GVCN / nhân viên: không có cảm nhận / thư), `lop_tong_quan(lop)` (GVCN lớp mình / nhân viên).
Review (`sql/2026-11-19_review.sql`): HS `viet_review` (đã đọc xong, ≤ 5 bài / ngày, sửa → chờ duyệt lại), `xoa_review`;
mọi người đã đăng nhập `review_cua_sach` (con số + 30 bài đã duyệt, ẩn tên thì không gửi tên; HS: bài của em); nhân viên `review_cho_duyet`,
`duyet_review(id, duyet, ly_do, sua_luc)`.
Quyền: `la_hs_lop_toi(hs)`, `xem_duoc_hs(hs)`. Nội bộ: `so_chu(t)`, `tinh_lai_ngay(hs, ngay)` (chỉ lần đủ dài sớm nhất trong ngày
được tính cho cây), `cay_cua(hs)` (số ngày cây lớn, tuần này, hôm nay), `cap_nhat_moc(hs)`. Thay đổi 19/11: `sql/2026-11-19_cay_doc_sach.sql`.

**scripts/**: `docEnv.mjs` → `docEnv()` (đọc .env — mọi script và test thật dùng chung), `GOC_DU_AN`.
`sao-luu-neon.mjs`, `khoi-phuc-neon.mjs`, `chay-sql.mjs` (chạy 1 tệp SQL trên Neon), `dat-vai-tro-pin.mjs` (đặt mật khẩu vai trò
`dang_nhap_pin`, ghi `NEON_PIN_URL` vào .env, không in mật khẩu).

Mã lớp + PIN (`sql/2026-11-19_dang_nhap_pin.sql`): `quan_ly_lop(lop)`, `lay_ma_lop`, `doi_ma_lop`, `tinh_trang_pin_lop`,
`tao_pin(lop, hs?)` (PIN rõ chỉ trả lúc tạo, lưu bcrypt) — nhân viên / GVCN lớp mình. Chỉ vai trò `dang_nhap_pin`: `ds_ten_theo_ma(ma)`
(tên rút gọn `ten_hien`), `kiem_pin(ma, hs, pin)` (sai 5 liền → khoá 15 phút; 15 / ngày → hết ngày; cả lớp 60 / ngày → khoá lớp).

## Cơ sở dữ liệu (Neon) — `sql/2026-11-17_khoi_tao.sql`, `sql/2026-11-18_danh_muc_sach.sql`, `sql/2026-11-18_muon_tra.sql`, `sql/2026-11-18_nhat_ky.sql`, `sql/2026-11-19_cay_doc_sach.sql`, `sql/2026-11-19_review.sql`
| Bảng | Ai đọc | Ai ghi |
|---|---|---|
| `ho_so` | tự mình; nhân viên: tất cả; GVCN: HS lớp mình | chỉ qua hàm `tao_ho_so` / `sua_ho_so` (nhân viên; thủ thư chỉ với HS) / `xoa_ho_so` (quản trị) |
| `lop` (`ma_lop` 6 ký tự) | mọi người đã đăng nhập — **trừ cột `ma_lop`** (chỉ qua `lay_ma_lop`) | nhân viên (không sửa thẳng `ma_lop`: `doi_ma_lop`) |
| `pin_hs` (bcrypt, đếm sai, khoá) · `lop_sai_pin` (sai cả lớp / ngày) | **không ai đọc thẳng** | chỉ qua hàm PIN |
| `cai_dat` (1 dòng: số sách tối đa, số ngày mượn, số ngày giữ sách đã soạn, số chữ để cây lớn (3), số ngày mở thư (90)) | mọi người đã đăng nhập | nhân viên |
| `chu_de` | mọi người đã đăng nhập | nhân viên |
| `sach` (`tim` = tên + tác giả + mã bỏ dấu, chỉ mục trigram; `so_trang`, `cau_hoi` theo sách) | nhân viên: tất cả; người khác: sách không ẩn | nhân viên: sửa đúng các cột được cấp; thêm qua `nhap_danh_muc` |
| `sach_chu_de` (≤ 2 / sách) | mọi người đã đăng nhập | nhân viên |
| `luot_muon` (dat_truoc → da_soan → dang_muon → da_tra / mat; huy) | HS: lượt của mình; nhân viên: tất cả | **không ai ghi thẳng** — chỉ qua hàm mượn – trả (kiểm vai trò, khoá dòng, tối đa, còn bản). Sách có lượt mượn không xoá được (chỉ ẩn) |

| `nhat_ky` (đoạn em nhớ, trang, cảm xúc, em nghĩ, cùng bố mẹ, bố mẹ viết, `cho_co_xem`, `tinh_chuoi` máy chủ tính) | em; GVCN lớp em / nhân viên **chỉ dòng cho_co_xem** | chỉ qua hàm, em sửa / xoá trong 7 ngày; bật tắt cho cô xem lúc nào cũng được |
| `doc_xong` (mức thích 1–5, cảm nhận cuối) | em (người khác: số liệu qua hàm) | chỉ qua hàm |
| `moc_dat` (mốc) | em; GVCN lớp em; nhân viên | chỉ qua hàm |
| `thu_gui_minh` (thư gửi chính mình, `mo_ngay`, `da_mo_luc`) | **không ai đọc thẳng** — em mở qua `mo_thu` khi đến ngày | chỉ qua `danh_dau_doc_xong` |
| `review` (bài giới thiệu sách cho bạn: 1 / em / cuốn, `an_ten`, `trang_thai` cho_duyet → da_duyet / khong_duyet + `ly_do`) | **không ai đọc thẳng** — qua `review_cua_sach` (bài đã duyệt) / `review_cho_duyet` (nhân viên) | chỉ qua hàm review |
| `tuy_chon_hs` (mục tiêu tháng — **bỏ từ 19/11**, giữ bảng) | em | không còn hàm ghi |

Hàm hỏi quyền: `vai_tro_cua_toi()`, `lop_cua_toi()`, `la_nhan_vien()` — STABLE, security definer, gọi trong RLS dạng
`(select ...)` để chỉ tính 1 lần mỗi câu lệnh. Tài khoản bị khoá (`hoat_dong=false`) → các hàm trả null → không đọc được gì.

## Kiểm tra
- `npm test`: domain + quy tắc tầng / độ dài tệp.
- `npm run test:quyen` (`tests/that/`, dùng chung `_chung.js`): `quyen.test.js` hồ sơ / tài khoản, `sach.test.js` danh mục
  (HS không ghi được, không thấy sách ẩn, nhập lại không trùng, ≤ 2 chủ đề), `muonTra.test.js` mượn – trả (HS không tự đổi trạng thái,
  không xem lượt của bạn; trùng / tối đa / hết bản / sách ẩn bị chặn; đủ vòng đặt → soạn → mượn → trả; báo mất giảm số bản),
  `nhatKy.test.js` nhật ký (bạn khác không đọc / sửa; máy chủ tính cây, mốc; 7 ngày; đọc xong cần nhật ký;
  riêng tư: nhân viên chỉ đọc lần cho cô xem, không đọc cảm nhận / thư; thư chỉ mở khi đến ngày),
  `giaoVien.test.js` GVCN (tài khoản THU_GV: chỉ lớp mình, chỉ con số + lần cho cô xem, PIN lớp mình, không ghi thay em),
  `review.test.js` review (không ai đọc / ghi thẳng bảng; chưa đọc xong không viết; bài chờ duyệt không hiện; chỉ nhân viên duyệt —
  HS, GVCN bị chặn; duyệt cần đúng bản; ẩn tên không lộ tên; sửa → duyệt lại; sách ẩn; ≤ 5 bài / ngày),
  `pin.test.js` mã lớp + PIN (HS không xem mã / tạo PIN / gọi kiem_pin; vai trò PIN chỉ gọi 2 hàm; khoá khi sai; đổi mã; Edge Function)
  — người lạ, HS, thủ thư thật trên Neon / Edge Function. Chạy lần lượt từng tệp; dọn dữ liệu thử bằng `sqlChu` (quyền chủ CSDL).
