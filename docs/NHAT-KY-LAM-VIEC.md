# Nhật ký làm việc — đọc ĐẦU MỖI PHIÊN để biết đã làm gì, đang dở gì

Ghi mới nhất ở trên. Mỗi phiên thêm 1 mục: đã làm, kiểm tra gì, còn dở gì, điều cần nhớ. Không ghi mật khẩu / khoá.

---

## 19/11/2026 (khuya) — Rà soát bảo mật + hiệu năng, tách mã, Hướng dẫn tập 3

### Rà soát (hỏi thẳng Neon, không chỉ đọc mã)
- 17 bảng đều RLS; 6 bảng không cấp quyền gì (chỉ qua hàm): pin_hs, lop_sai_pin, review, thu_gui_minh, thu_thach_lop, so_lieu_sang_kien.
  `lop.ma_lop` không đọc thẳng được (quyền theo cột). Mọi hàm security definer gọi được từ app đều có kiểm vai trò; hàm nội bộ đã thu quyền.
  Hàm gọi được mà không kiểm quyền chỉ là hàm thuần: `bo_dau`, `so_chu`, `tao_ma_lop`, `ten_hien` (không đọc dữ liệu).
- Supabase: **tắt tự đăng ký**. Edge Function kiểm người gọi bằng thẻ thật + vai trò ở Neon. Chưa có `api/` (Gemini chưa dùng → không gửi tên HS).
- Git (kho công khai): quét toàn bộ lịch sử — không có khoá, chuỗi kết nối, mật khẩu. Bảng tài khoản cũ (trước 102d8d6) chỉ có
  tên đăng nhập + email quản trị, KHÔNG có mật khẩu → rủi ro thấp (mật khẩu quản trị phải mạnh).
- Giao diện: không innerHTML / eval, không tải lại cả trang, không hỏi định kỳ. Lưu xong đều cập nhật tại chỗ; sửa `useTuSach.sauDocXong`
  (bỏ tải lại cả danh sách mượn sau khi đọc xong).
- Thêm `src/danhMucHam.test.js`: mọi hàm xuất ở domain / data / lib / scripts + mọi hàm SQL phải có tên trong ARCHITECTURE.md
  (thiếu → `npm test` đỏ). Đã bổ sung các tên còn thiếu; ghi rõ hàm đã bỏ (`chuoi_cua`, `dat_muc_tieu`).
- `vercel.json`: thêm X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy (chưa CSP — cần thử kỹ vì Supabase / Neon / Cloudinary).
- PIN: cả lớp sai 60 lần/ngày → khoá lớp (1 em nghịch làm được). "Đổi mã lớp" xoá bộ đếm → đã ghi rõ trên trang Mã lớp & PIN.

### Dữ liệu gấp 10 lần (1.200 HS, 3.000 sách, 30.000 lượt mượn, 120.000 lần ghi — trong giao dịch rồi ROLLBACK)
- `thong_ke` toàn trường **5,4 s → 0,26 s** (sách nằm im dò từng cuốn → gộp 1 lần; lọc theo mốc giờ dùng chỉ mục; theo lớp / chủ đề / tem
  gộp bằng group by). Các hàm khác ≤ 0,12 s (Lớp của tôi 0,06 s, hộ chiếu 0,1 s, tìm sách 0,04 s).

### Tách mã (giảm tải cho điện thoại)
- Mọi trang tải khi mở tới (`Trang` trong App.jsx); thư viện tách `react` / `supabase` (vite.config.js manualChunks).
  Mã app 604 kB → 38 kB (gzip 15 kB); thư viện được trình duyệt giữ lại qua các lần đưa bản mới. Đã thử bản build thật (vite preview): mọi trang 3 vai trò mở được.

### Sao lưu
- `npm run sao-luu` → `SaoLuu/neon_2026-11-19_2221`; chạy thử khôi phục (không --that-su) vào Neon chính: 17 bảng khớp số dòng, rollback. ĐÃ THỬ ĐƯỢC.

### Hướng dẫn tập 3
- `docs/huong-dan-thu-thu-3/` (html + PDF 13 trang + 12 ảnh): review, hộ chiếu, thử thách lớp, thống kê, ai xem được gì,
  phiếu dùng thử 22 việc (A. chức năng 17, B. chặn quyền 5). Ảnh chụp từ dữ liệu dựng tạm ở lớp 3THU, đã dọn.

### Kiểm tra
- `npm test` 74/74 · `npm run test:quyen` 63/63 · eslint · build.

### Còn dở
- [ ] Gắn ★ lớp thí điểm; thủ thư nhập số Trước; nhập danh mục thật có chủ đề.
- [ ] Ảnh bìa Cloudinary: KHÔNG dùng upload preset không ký từ trình duyệt (ai cũng tải lên được) → cần hàm máy chủ ký (secret API Cloudinary).
- [ ] Xuất nhật ký tiêu biểu che tên (thầy để sau). CSP. Rủi ro thấp còn lại: HS tự khai nguồn "gợi ý" khi đặt trước; đọc xong không cần đã mượn.

---

## 19/11/2026 (khuya) — Thống kê sáng kiến

- Thầy duyệt: số Trước **gộp các lớp thí điểm**; GVCN **không** xem trang Thống kê; xuất nhật ký tiêu biểu che tên **để sau**.
- `sql/2026-11-19_thong_ke.sql` đã chạy Neon 2 lần + thầy đã Refresh schema cache (lần này BẮT BUỘC). Bảng `so_lieu_sang_kien` chỉ qua hàm.
- Chỉ số theo tài liệu thư viện (Claude Docs "Chuẩn bị sáng kiến…", phần 2A, 3A, 3B). Sách nằm im tính **toàn trường**.
- Giao diện: `/thu-vien/thong-ke` (menu nhân viên "Thống kê"), `hooks/useThongKe`, `components/thongKe/` (bộ lọc, số liệu, so sánh).
  Excel: thư viện `write-excel-file@4.1.1`, tải khi bấm (`taiVeExcel` trong `data/tepExcel.js`).
- Kiểm tra: `npm test` 72/72 · `npm run test:quyen` 63/63 (`thongKe.test.js` 5, dữ liệu dựng năm 2020) · eslint · build. Thử Chrome:
  lớp 3THU 3 lượt → 66,7%; nhập Trước/Sau giờ báo cáo → -7,5 (-88,2%); chỉ số tự đo không có ô Sau; tải Excel 7 trang, quét
  cả tệp không có tên / id HS; 390px không cuộn ngang. Đã dọn, trả lại số gio_bao_cao cũ.
- **Chưa có lớp nào gắn ★ thí điểm** và kho sách thật đang trống → trang Thống kê mặc định ra 0 (đã có dòng nhắc).

### Còn dở
- [ ] Gắn ★ thí điểm cho các lớp thí điểm; thủ thư nhập số Trước (phần 2 tài liệu) trước khi HS dùng app.
- [ ] Xuất nhật ký tiêu biểu che tên (để sau). Hướng dẫn thủ thư tập 3: duyệt review, chủ đề / hộ chiếu, thử thách lớp, thống kê.
- [ ] Rà soát bảo mật toàn bộ + thử dữ liệu gấp 10 lần trước khi dùng thật; thử khôi phục sao lưu; ảnh bìa Cloudinary; giảm bundle (604 kB).

---

## 19/11/2026 (khuya) — Thử thách lớp theo số ngày ghi

- Commit hộ chiếu đã đẩy là `00d6508` nhưng **lời commit bị sai** (dùng nhầm tệp lời cũ "Giai đoạn 3…"). Thầy chọn để nguyên.
  → Viết lời commit bằng tệp mới mỗi lần, không dùng lại `msg.txt` cũ trong scratchpad.
- Thầy duyệt: (a) mỗi em đạt N ngày, lớp đếm "X/Y bạn đạt"; điều kiện thể loại **để sau**; có mốc 🏅 `thu_thach`.
- `sql/2026-11-19_thu_thach_lop.sql` đã chạy Neon 2 lần (bảng mới, không cần Refresh lần này). Dùng lại `quan_ly_lop` của tệp PIN.
- Giao diện: `components/thuThach/` — `TheThuThachEm` (trang chủ HS), `ThuThachLop` + `FormThuThach` (Lớp của tôi, cột "Thử thách").
- Kiểm tra: `npm test` 66/66 · `npm run test:quyen` 58/58 (`thuThach.test.js` 6) · eslint sạch. Thử Chrome: GVCN đặt thử thách
  trên giao diện → bảng hiện 1/3, 3/3 🏅, 0/3; HS thấy "Em 1/3 ngày · Cả lớp 1/3 bạn đã đạt" (1200px + 390px). Đã dọn.
- Lưu ý: PowerShell `Get-Content | Set-Content` làm **hỏng chữ tiếng Việt** (đọc sai bảng mã) — sửa tệp bằng Edit / sed / python.

### Còn dở
- [ ] Thống kê sáng kiến (số liệu trước – sau, xuất Excel). Hướng dẫn thủ thư: duyệt review, nhập chủ đề, thử thách lớp (cho GVCN).
- [ ] Menu HS trên điện thoại 5 mục (vuốt ngang mới thấy "Tìm sách").

---

## 19/11/2026 (tối) — Hộ chiếu thể loại

- Thầy duyệt: tem = chủ đề, có 2 mốc. `sql/2026-11-19_ho_chieu.sql` đã chạy Neon 2 lần (thay 3 hàm của tệp cay_doc_sach).
- Trang `/ho-chieu` (menu "Hộ chiếu"), hộp Đọc xong báo tem mới, cột "Tem thể loại" ở Lớp của tôi. `tests/that/hoChieu.test.js` (5).
- Kho sách thật hiện **chưa có chủ đề nào** → hộ chiếu trống cho đến khi thủ thư nhập danh mục có chủ đề.
- Kiểm tra (sau khi thầy Refresh schema cache): `npm test` 61/61 · `npm run test:quyen` 52/52 (sửa `nhatKy.test.js`: lop_tong_quan
  có thêm khoá `so_tem`) · eslint sạch. Thử Chrome 1200px + 390px: 4 chủ đề, đọc xong 1 → 1/4 tem, 3 ô gợi ý + Đặt trước. Đã dọn.

### Còn dở
- [ ] Thử thách lớp theo số ngày ghi, thống kê sáng kiến. Hướng dẫn thủ thư: thêm phần duyệt review + nhắc nhập chủ đề.
- [ ] Menu HS trên điện thoại đã 5 mục, phải vuốt ngang mới thấy "Tìm sách" — xem lại khi thêm mục mới.

---

## 19/11/2026 (tối) — Review bạn bè

### Đã làm
- Thầy duyệt thiết kế (KE-HOACH-APP.md mục 11, "Review bạn bè"). `sql/2026-11-19_review.sql` đã chạy Neon 3 lần.
  Bảng `review` không cấp quyền cho ai, mọi việc qua 5 hàm (`viet_review`, `xoa_review`, `review_cua_sach`, `review_cho_duyet`, `duyet_review`).
- Giao diện: ô "Giới thiệu sách cho bạn" trong hộp Đọc xong; mục "Các bạn nói gì" ở trang sách (`components/review/`);
  thẻ "Review chờ duyệt" thứ 5 trên trang Mượn – trả. Hook `useReviewSach`, `useReviewChoDuyet`; domain `review.js` (có test).
- Kiểm tra: `npm test` 58/58 · `npm run test:quyen` 47/47 (`review.test.js` 7: người lạ, HS, GVCN, thủ thư; gọi thẳng bảng bị chặn;
  duyệt sai bản bị chặn; ẩn tên không lộ tên) · eslint sạch · build OK. Thử Chrome (390px + 1100px): HS1 viết → thủ thư duyệt →
  HS2 thấy bài. Dữ liệu thử đã dọn (review / nhat_ky / doc_xong = 0).
- Lần review hàm mới gọi được ngay không cần Refresh — **nhưng lần hộ chiếu sau đó thì cần** (lỗi "Could not find the function").
  → Vẫn luôn nhờ thầy Refresh sau khi thêm hàm mới.
- Đã commit `865126c` + đẩy.

### Còn dở
- [ ] Hộ chiếu thể loại, thử thách lớp theo số ngày ghi, thống kê sáng kiến. Hướng dẫn thủ thư: thêm phần duyệt review.

---

## 19/11/2026 — Đặc tả mới: cây đọc sách, ghi nhanh, riêng tư, thư gửi chính mình, Góc bố mẹ, PWA

### Trạng thái
- Thầy gửi đặc tả mới → so sánh cũ / mới → thầy chốt (KE-HOACH-APP.md mục 11).
- `sql/2026-11-19_cay_doc_sach.sql` đã chạy trên Neon (2 lần), thầy đã Refresh schema cache.
- Test: `npm test` 50/50 · `npm run test:quyen` 29/29 · eslint sạch · build OK. Thử Chrome 390px: trang chủ (cây, đọc tiếp,
  Góc bố mẹ) → ghi nhanh (kéo trang, 5 phút trò chuyện, bố mẹ viết, cho cô xem) → Nhìn lại (hành trình cảm xúc) → thủ thư xem 1 em
  (chỉ thấy lần cho cô xem). Dữ liệu thử đã dọn.
- **Chưa commit / đẩy.** Bản Vercel hiện tại đọc `tq.chuoi` (đã bỏ ở máy chủ) → trang chủ HS / Lớp trên link thật **hỏng đến khi đẩy bản mới**.

### Điều cần nhớ
- Riêng tư: RLS `nhat_ky` cho GVCN / nhân viên chỉ dòng `cho_co_xem`; `doc_xong` chỉ em; `thu_gui_minh` không ai đọc thẳng
  (chỉ `mo_thu` khi đến ngày). Hàm cho người khác (`nhin_lai_nam`, `lop_tong_quan`) không trả chữ em viết.
- Chạy lại `2026-11-18_nhat_ky.sql` thì phải chạy lại `2026-11-19_cay_doc_sach.sql` (tệp 19/11 thay hàm, bỏ `chuoi_cua`, `dat_muc_tieu`).
- Lần thử đầu sau khi Neon nghỉ có vài lỗi 400 (đoán là `chua_nhan_dien` được gọi lại — các lần sau không còn).

### Đăng nhập mã lớp + PIN (19/11, chiều)
- Đã làm: `sql/2026-11-19_dang_nhap_pin.sql` (đã chạy Neon 2 lần), vai trò Neon `dang_nhap_pin` + `scripts/dat-vai-tro-pin.mjs`
  (đã chạy, NEON_PIN_URL trong .env), Edge Function `supabase/functions/dang-nhap-pin`, màn đăng nhập "Học sinh / Thầy cô",
  trang `/lop/ma-pin` (mã lớp + QR, tạo / đặt lại PIN, in phiếu). Test nhanh 53/53; `tests/that/pin.test.js` viết xong.
- Thầy đã Refresh + cho phép: đã đặt secret NEON_PIN_URL, deploy `dang-nhap-pin --no-verify-jwt`. `npm run test:quyen` 34/34.
  Thử Chrome 390px: thủ thư tạo PIN lớp 3THU → in phiếu (QR) → HS mở link ?lop= → chọn tên → PIN sai báo "còn 4 lần" → PIN đúng
  vào /hoc-sinh → thoát → "Ai đang đọc sách?" nhớ em. PIN thử đã xoá. Lỗi 400 lúc thử = `chua_nhan_dien` được gọi lại (đã đo).
- Đã commit `15cfe47` + đẩy (thầy cho phép).
- Nhập Excel có cột Số trang, Câu hỏi (`sql/2026-11-19_nhap_so_trang.sql` đã chạy; tệp mẫu `public/mau-danh-muc-sach.xlsx` có 2 cột mới).
- Tạo tài khoản GVCN thử (xem docs/TAI-KHOAN.local.md, lớp 3THU, `THU_GV` trong .env) — tạo bằng thủ thư thử qua `tao-tai-khoan` (vai trò HS) rồi đổi
  vai trò bằng SQL chủ (PAT không đọc được khoá quản trị Supabase). `tests/that/giaoVien.test.js` 5/5; tổng test thật 40/40.
- **Vercel chặn deploy ("Blocked")** vì email commit `laptrinhsangtao@gmail.com` không gắn với GitHub `laptrinhsangtaobnp`.
  Đã đặt `git config user.email` (CHỈ trong dự án này) = email noreply GitHub của `laptrinhsangtaobnp`. Kho đã chuyển Public.
  (Lúc đầu nghi dòng Co-Authored-By — bỏ thử vẫn bị chặn, nên không phải do nó.) Danh sách tài khoản: docs/TAI-KHOAN.local.md.
- **Link thật có "Vercel Security Checkpoint" (chống bot)** → curl / Chrome tự động không vào được; phải nhờ thầy mở bằng điện thoại để kiểm.

### Còn dở
- [x] Nhập số trang / câu hỏi theo sách bằng Excel.
- [ ] ~~Review bạn bè~~ (xong tối 19/11), hộ chiếu thể loại, thử thách lớp theo số ngày ghi, thống kê. Hoãn: ghi âm, nhắc giờ.

---

## 18/11/2026 (chiều) — Tài liệu thủ thư, Giai đoạn 3 (nhật ký + Nhìn lại), sửa lỗi Neon mất danh tính

### Trạng thái
- Neon đã chạy lại cả 4 tệp SQL (đổi `auth.uid()` → `public.toi()`), có thêm `2026-11-18_nhat_ky.sql`.
- Test: `npm test` 45/45 · `npm run test:quyen` 28/28 (8 tài khoản + 6 sách + 6 mượn – trả + 8 nhật ký) · eslint sạch · build OK.
- Đã thử trên Chrome (điện thoại 390px): ghi nhật ký → đọc xong (🎉 + mốc + gợi ý) → Nhìn lại → Lớp học. Dữ liệu thử đã dọn.
- 19/11: đã commit `26e25ea` + đẩy GitHub (Vercel tự cập nhật); đã deploy lại 3 Edge Function (có gọi lại); test thật 28/28 sau deploy.

### Đã làm
- Tài liệu hướng dẫn thủ thư `docs/huong-dan-thu-thu/` (PDF 15 trang, 22 ảnh chụp app thật, phiếu dùng thử 18 việc).
- Thầy duyệt "đồng ý hết" 7 đề xuất giai đoạn 3 (xem KE-HOACH-APP.md mục 9). Làm: bảng `nhat_ky`, `doc_xong`, `moc_dat`, `tuy_chon_hs`;
  HS: trang chủ (Ghi nhật ký, chuỗi tuần, mục tiêu tháng, nhắc), `/nhat-ky/ghi`, `/nhat-ky`, `/nhin-lai` (in sổ), Đọc xong;
  GVCN `/giao-vien` Lớp của tôi; nhân viên `/thu-vien/lop`; GVCN / nhân viên xem 1 em `/lop/hs/:id`.

### PHÁT HIỆN QUAN TRỌNG: Neon đôi khi không nhận thẻ đăng nhập
- Đo 18/11: lần gọi đầu trên kết nối Neon mới (lúc vừa thức dậy / nhiều người vào cùng lúc) mất danh tính tới ~44%
  (`auth.uid()` = null, không có cả `request.jwt.claims`). Lúc Neon đã chạy: ~0%. Chưa lần nào nhầm sang người khác.
  Trước khi sửa: người dùng thấy danh sách trống / "không có quyền" / bị đăng xuất ngay khi đăng nhập (test đỏ chập chờn là vì vậy).
- Sửa: mọi SQL dùng `public.toi()` (báo lỗi `chua_nhan_dien` khi null, thay vì âm thầm "không có gì");
  app gọi lại tối đa 5 lần (`src/lib/goiLai.js`, gắn vào client Neon + test thật); Edge Function `neon()` cũng gọi lại.
- **Viết SQL mới: KHÔNG dùng `auth.uid()`, dùng `public.toi()`.**

### Còn dở
- [x] Commit + đẩy giai đoạn 3; deploy lại 3 Edge Function (19/11).
- [ ] 19/11 thầy gửi ĐẶC TẢ mới (PIN, phụ huynh, cây đọc sách, ghi âm, review, hộ chiếu thể loại…) → đang thảo luận, chưa code.
- [ ] Chưa có tài khoản GVCN thử → chưa test quyền thật cho vai trò giao_vien (đã thử bằng nhân viên + HS).
- [ ] Gợi ý theo sở thích (giai đoạn sau; hiện: cùng chủ đề + hợp khối), thống kê thói quen toàn trường (giai đoạn 4),
      in sổ có che tên, GVCN viết lời khen (để sau).

---

## 18/11/2026 — Thầy duyệt lọc chức năng + Giai đoạn 2 (mượn – trả)

### Trạng thái
- Chưa commit (thầy chưa bảo). Neon đã chạy `sql/2026-11-18_muon_tra.sql` (2 lần, chạy lại được), thầy đã Refresh schema cache.
- Test: `npm test` 35/35 · `npm run test:quyen` 20/20 (8 tài khoản + 6 sách + 6 mượn – trả) · eslint sạch · build OK.

### Thầy chốt (18/11) — 4 ý trong `docs/LOC-CHUC-NANG-APP-MAU.md`
1. **Chuỗi tuần** (tuần nào ghi nhật ký ≥ 3 lần thì giữ chuỗi), không chuỗi ngày.
2. Mốc nhẹ: cuốn đầu tiên, 5 / 10 / 20 cuốn, chuỗi 4 / 8 tuần. Không bảng xếp hạng.
3. Thử thách lớp do GVCN / thủ thư đặt: **để sau** (theo tệp lọc).
4. Mượn: tối đa 2 cuốn (đặt + soạn + mượn), mượn 7 ngày, giữ sách đã soạn 3 ngày, hết bản → hàng chờ, em tự huỷ khi cô chưa soạn.

### Đã làm
- Bảng `luot_muon` (dat_truoc → da_soan → dang_muon → da_tra / mat; huy), `cai_dat.so_ngay_giu`. HS chỉ đọc lượt của mình,
  không ai ghi thẳng bảng. Hàm máy chủ: `dat_truoc`, `huy_dat_truoc`, `muon_cua_toi`, `tinh_trang_sach`, `soan_sach`, `cho_muon`,
  `cho_muon_truc_tiep`, `ghi_tra`, `bao_mat` (giảm số bản), `ds_muon`, `dem_muon`. "Hôm nay" theo giờ VN. Sách có lượt mượn không xoá được.
- HS: trang chủ `/hoc-sinh` = **Tủ sách của em** (đã đặt / đang mượn / đã mượn); trang chi tiết sách có khung **Đặt trước**
  (còn mấy bản, hàng chờ, tình trạng lượt của em, huỷ).
- Thủ thư: trang chủ `/thu-vien` = **Mượn – trả** (4 thẻ có số đếm + quá hạn, tìm theo sách / tên HS / lớp, nút theo trạng thái),
  **Cho mượn tại chỗ**, **Quy tắc mượn**. Không tự hỏi máy chủ định kỳ — có nút Làm mới.
- Test thật `tests/that/muonTra.test.js`; `_chung.js` thêm `sqlChu` (dọn dữ liệu thử bằng quyền chủ CSDL). `test:quyen` chạy lần lượt
  từng tệp (1 lần đỏ chập chờn ở sach.test khi chạy song song, chạy lại 2 lần xanh — chưa rõ nguyên nhân).
- Thầy nhờ cài **skill GSAP** (`npx skills add …gsap-skills` → `.claude/skills/gsap-*`, `skills-lock.json`) + `npm install gsap`.
  Chưa dùng gsap trong mã.

### Còn dở / tiếp theo
- **Git + Vercel (18/11):** repo `github.com/laptrinhsangtaobnp/nhat-ky-doc-sach` (remote đi kèm tên `laptrinhsangtaobnp`, tên/email
  commit đặt riêng cho dự án). Repo đang **public** → đã khuyên thầy chuyển Private (lộ email quản trị, tên TK thử, link tài liệu).
  Vercel tài khoản `phuongbui` (Hobby), link chính **https://nhat-ky-doc-sach.vercel.app** (link có mã băm / `-phuongbui` đòi đăng nhập
  Vercel — không đưa cho HS). Vercel có 3 biến VITE_; đã kiểm bản dựng chứa đúng kết nối, Neon + Supabase cho phép gọi từ domain này.
  Còn: Supabase → Authentication → URL Configuration thêm link Vercel; thầy thử đăng nhập trên điện thoại.
- [ ] Thầy thử trên máy: HS (dùng tài khoản HS thử hoặc HS thật — test xoá lượt mượn của 2 tài khoản HS thử) đặt trước → thủ thư soạn → cho mượn → trả.
- [ ] Chưa làm (chờ thầy quyết nếu cần): gia hạn mượn; chặn đặt khi em đang quá hạn; GVCN xem lượt mượn lớp mình; tự động huỷ khi quá hạn giữ
      (hiện: thủ thư thấy "quá hạn giữ" và bấm Cất lại).
- [ ] **Giai đoạn 3: nhật ký + Nhìn lại năm đọc sách** — bắt đầu bằng thảo luận màn hình với thầy (theo tệp lọc đã duyệt).
- [ ] `npm audit` báo vài lỗ hổng ở thư viện — chưa xem. Gói chính `index` ~540 kB (cảnh báo > 500 kB) — xem lại khi đưa lên Vercel.

---

## 17/11/2026 — Giai đoạn 0 chạy thật + Giai đoạn 1 (danh mục sách) phần chính

### Trạng thái hiện tại
- Commit cuối: `53ab98b` (giai đoạn 1). Trước đó `26a10c7`, `f812fd7`.
- App chạy trên máy: `npm run dev` → http://localhost:5173. **Chưa đưa lên Vercel** (thầy nói chưa cần).
- Neon đã chạy 2 tệp SQL: `2026-11-17_khoi_tao.sql`, `2026-11-18_danh_muc_sach.sql` (tên ngày 18 để xếp sau; chạy 17/11).
- Test: `npm test` 23/23 · `npm run test:quyen` 14/14 (8 hồ sơ/tài khoản + 6 danh mục sách) · eslint sạch.
- Sao lưu đầu tiên OK: `SaoLuu/neon_2026-11-17_2159` (lúc đó chưa có bảng sách).

### Tài khoản
Danh sách tài khoản (quản trị, tài khoản thử) để ở `docs/TAI-KHOAN.local.md` — chỉ trên máy, không lên Git (kho công khai).

### Đã làm trong phiên
1. Deploy 3 Edge Function (`tao-tai-khoan`, `sua-tai-khoan`, `xoa-tai-khoan`), secret `NEON_DATA_URL`.
   Người lạ gọi → 403; tự đăng ký Supabase → 422 signup_disabled.
2. Gắn vai trò ở Neon cho 5 tài khoản; thầy đăng nhập được quản trị + HS; nhập HS từ Excel chạy được.
3. Màn đăng nhập báo đúng lý do lỗi (`loiDangNhap` trong `src/domain/taiKhoan.js`).
4. Chống viết trùng hàm: `scripts/docEnv.mjs` là nơi duy nhất đọc `.env`; quy tắc trong `CLAUDE.md`;
   **danh mục hàm** trong `docs/ARCHITECTURE.md` (tra trước khi viết hàm mới, sửa cùng lúc khi thêm hàm).
5. Giai đoạn 1 — danh mục sách:
   - Bảng `chu_de`, `sach` (cột `tim` bỏ dấu + chỉ mục trigram), `sach_chu_de` (≤ 2 / sách, trigger); RLS: HS không thấy sách `an`.
   - Hàm Neon `nhap_danh_muc(p_ds)` (upsert theo mã, ô trống giữ cũ, tạo chủ đề mới, ≤ 30 chủ đề), `dat_chu_de_sach`, `bo_dau`.
   - Trang `/sach` (mọi vai trò: tìm không dấu, lọc chủ đề / khối, "Xem thêm" 30 cuốn), `/sach/:id` (chi tiết; nhân viên có Sửa).
   - Hộp: Nhập danh mục Excel (có **Tải tệp mẫu** = `public/mau-danh-muc-sach.xlsx`), Sửa sách, Chủ đề.
   - Menu: HS / GV "Tìm sách", nhân viên "Danh mục sách".
   - `scripts/khoi-phuc-neon.mjs`: thêm 3 bảng vào `THU_TU`, bỏ qua cột generated khi chèn.
   - Test quyền thật `tests/that/sach.test.js` (tự tạo + tự xoá sách `THU-QUYEN-01`), helper chung `tests/that/_chung.js`.

### Còn dở / việc tiếp theo
- [ ] Thầy thử trên máy: nhập tệp mẫu, tìm "de men", ẩn 1 cuốn rồi kiểm HS không thấy. Thủ thư điền danh mục thật 200–300 cuốn.
- [ ] Giai đoạn 1 còn: **ảnh bìa** (cần tài khoản Cloudinary — tải hàng loạt, tên tệp = mã sách),
      **AI viết nháp giới thiệu** (cần `GEMINI_API_KEY`, chạy qua Vercel `api/`, chỉ nhân viên, không gửi tên HS).
- [ ] Thử khôi phục bản sao lưu vào một nhánh Neon riêng (chưa làm).
- [ ] Đưa lên Vercel + GitHub private (khi thầy muốn; bước 5 `HUONG-DAN-CAI-DAT.md`).
- [ ] **Giai đoạn 2: mượn – trả** (không cần dịch vụ mới): bảng `luot_muon`, hàm `dat_muon` / `duyet_muon` / `ghi_tra` / `bao_mat`
      (máy chủ kiểm số cuốn tối đa, còn bản, không đặt trùng), trang HS đặt mượn, trang thủ thư duyệt / quá hạn, Cài đặt quy tắc.
      Xem `KE-HOACH-APP.md` mục 5–6.

### Thầy dặn
- **Trước khi viết chức năng người dùng (màn hình HS / GV / thủ thư): thảo luận kỹ với thầy trước.** Thầy chưa tự mô tả
  chi tiết chức năng từng vai trò; đến giờ mọi thứ suy từ tài liệu thư viện + `KE-HOACH-APP.md`, giai đoạn 1 Claude tự thiết kế
  → khi có dịp nhờ thầy xem lại màn Tìm sách / Nhập danh mục. Giai đoạn 2 (mượn – trả) bắt đầu bằng buổi thảo luận, chưa viết mã.

### Ý tưởng cốt lõi của thầy (17/11, sau khi xem app mẫu `E:\UNG DUNG\NHAT-KY-DOC-SACH` — Flutter/Firebase, THCS/THPT)
- HS dùng app để **ghi chú lại nội dung đã đọc**; **sách chỉ từ thư viện** (không Google Books / ISBN / sách ngoài).
- Muốn đọc tiếp → app **gợi ý theo sở thích cá nhân**.
- Đồng thời **giúp nhân viên thư viện chuẩn bị sách** cho học sinh (biết em nào / lớp nào sắp cần cuốn gì).
- Từ app mẫu chỉ lấy ý: 3 ngăn Muốn đọc / Đang đọc / Đã đọc, ghi chú khi đọc, đánh giá sao + nhãn, gợi ý. Bỏ: Google Books,
  "Cú đêm", thử thách tự đặt, cộng đồng tự do, ghi chú 5 loại. Chi tiết luồng: đang thảo luận (chưa chốt).
- **Thầy chốt cốt lõi:** nhật ký để **sau 1 năm em xem lại** mình đọc mấy cuốn và **cảm xúc gắn với từng đoạn** trong sách.
  → mỗi ghi chép = sách (từ danh mục thư viện) + đoạn em nhớ + cảm xúc + em nghĩ gì; có trang **"Nhìn lại năm đọc sách"**.
  **Bỏ huy hiệu** (ít nhất là bản đầu). Dữ liệu HS phải giữ qua các năm (lên lớp không mất nhật ký).
- Thầy chốt mượn: HS **đặt trước** trong app → thủ thư soạn sẵn → em lên thư viện lúc nào cũng được, cô cho mượn.
  Thiết kế tổng hợp: `KE-HOACH-APP.md` mục 10. Còn chờ thầy duyệt vài mặc định (giữ sách mấy ngày, hết bản thì sao).
- Thầy chốt **thứ tự**: mượn – trả → nhật ký + Nhìn lại → gợi ý + chuẩn bị sách → thống kê.
- Thầy nhấn mạnh: **cái chính là nhật ký → tạo thói quen ghi nhật ký và thói quen đọc sách.** Đã lọc toàn bộ chức năng app mẫu
  vào `docs/LOC-CHUC-NANG-APP-MAU.md` (giữ / sửa / bỏ / để sau) — **chờ thầy duyệt** trước khi làm nhật ký.

### Điều cần nhớ (đã vấp trong phiên này)
- **Sau khi chạy SQL có bảng / hàm mới: thầy phải vào Neon → Data API → Refresh schema cache.**
  `notify pgrst, 'reload schema'` KHÔNG có tác dụng trên Neon. Chưa refresh → lỗi PGRST205 / "Could not find the function".
- Chạy SQL: `node scripts/chay-sql.mjs sql/<tệp>.sql` (dùng `NEON_DATABASE_URL`, in trạng thái RLS).
- `SUPABASE_PAT` chỉ **đọc** được DB Supabase (UPDATE auth.users bị chặn), không có quyền đọc log (`analytics_logs_read`).
  Vẫn deploy hàm, đặt secret, đọc `auth.users` được (sao lưu dùng cái này).
- Thầy xoá rồi tạo lại user trên Supabase → id mới → phải cập nhật `ho_so.id` ở Neon, nếu không app báo "Tài khoản chưa sẵn sàng".
- Mật khẩu sai khó hiểu: nhắc tắt Unikey / Caps Lock khi gõ mật khẩu.
- Đăng nhập: ô "Tên đăng nhập" không có `@` → app tự thêm `@school.local`; có `@` → dùng nguyên email.
- Edge Function khởi động lạnh vài giây → test quyền đặt `--testTimeout 30000`.
- Script tạm cần `pg` / `@supabase/supabase-js` phải đặt trong thư mục dự án (`scripts/_tam.mjs`, xoá sau khi chạy), không chạy từ scratchpad.
- Không in giá trị bí mật trong `.env`; chỉ sửa `.env` bằng thay thế có mẫu, không hiển thị mật khẩu.
