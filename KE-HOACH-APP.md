# Kế hoạch viết ứng dụng "Nhật ký đọc sách" (sáng kiến thư viện 2026)

Lập ngày 17/11/2026. Căn cứ: tài liệu thư viện "Chuẩn bị sáng kiến Nhật ký đọc sách – việc của thư viện"
(https://claude.ai/artifact/7jXpQxbGDZoo8MdjpmLazH) và cách làm của app Ôn Tập Tin (Supabase đăng nhập + Neon dữ liệu + Gemini).

## 1. App phải làm được gì (rút từ tài liệu thư viện)

| Tài liệu thư viện nói | Chức năng trong app |
|---|---|
| Danh mục sách Excel (mã, tên, tác giả, NXB-năm, chủ đề, khối, số bản, vị trí, giới thiệu), 8–12 chủ đề, ảnh bìa đặt tên theo mã | Nhập danh mục từ Excel (xem trước, báo dòng lỗi, nhập lại không bị trùng theo mã sách), quản lý chủ đề, tải ảnh bìa hàng loạt ghép theo tên tệp = mã sách |
| Quy trình mượn – trả (tối đa mấy cuốn, giữ bao lâu, trễ / mất) | Học sinh **đặt mượn** → thủ thư **duyệt / giao sách / ghi trả / báo mất**; danh sách quá hạn; quy tắc số cuốn tối đa + số ngày mượn chỉnh trong Cài đặt |
| Học sinh có nhật ký đọc sách | Mỗi lần đọc ghi: sách, ngày, số trang, mức thích, câu em thích, cảm nhận ngắn, ô "đọc cùng bố mẹ" |
| Review được duyệt đăng | Học sinh viết review → thủ thư duyệt / từ chối có lý do → bảng "Bạn bè giới thiệu sách" |
| Lượt mượn đến từ gợi ý của app | Gợi ý sách theo chủ đề em thích + khối + còn bản; đặt mượn từ gợi ý được đánh dấu nguồn |
| Phụ huynh cùng con ghi nhật ký | Đếm qua ô "đọc cùng bố mẹ" (bản 1 chưa làm tài khoản phụ huynh riêng — xem câu hỏi) |
| Phần 2 + 3: số liệu trước – sau | Trang Thống kê do **máy chủ tự tính**: lượt mượn/tháng, tỉ lệ HS có mượn, theo khối/lớp, top 10, sách "nằm im", trễ/mất, chủ đề yêu thích, số nhật ký, review, phụ huynh. Trang **So sánh trước – sau**: thủ thư nhập số liệu đo từ sổ, app điền cột "Sau". Xuất Excel làm minh chứng |
| Minh chứng ẩn họ tên | Nút xuất trang nhật ký tiêu biểu đã che tên |

## 2. Người dùng và quyền

| Vai trò | Ai | Làm được |
|---|---|---|
| `quan_tri` | Giáo viên Tin | Mọi thứ + tạo tài khoản, lớp |
| `thu_thu` | Thủ thư | Danh mục, mượn trả, duyệt review, thống kê, dùng AI hỗ trợ |
| `giao_vien` | GVCN lớp thí điểm | Xem nhật ký / thống kê **lớp mình** (chỉ đọc) |
| `hoc_sinh` | HS khối 3–4 | Tìm sách, đặt mượn, nhật ký **của mình**, review của mình |

Tài khoản học sinh do giáo viên tạo hàng loạt (`tendangnhap@school.local`), tắt tự đăng ký — giống Ôn Tập Tin.
Học sinh là trẻ em → chỉ lưu họ tên + lớp, không lưu email / số điện thoại / ngày sinh; review công khai chỉ hiện tên + lớp.

## 3. Kiến trúc (theo mẫu Ôn Tập Tin)

```
Trình duyệt (React + Vite + Tailwind, Vercel)
  ├─ Đăng nhập ─────────► Supabase Auth (chỉ tài khoản)
  ├─ Đọc / ghi dữ liệu ─► Neon Data API — nhận thẻ đăng nhập Supabase, RLS dùng auth.uid()
  ├─ Tạo tài khoản ─────► Supabase Edge Functions create-user / update-user / delete-user (kiểm tra người gọi là quản trị)
  ├─ AI (Gemini) ───────► Vercel Functions api/*.js — kiểm tra người gọi bằng api/_auth.js
  └─ Ảnh bìa ───────────► Cloudinary
```
Lấy lại từ Ôn Tập Tin (chép rồi gọn lại, không chép phần không dùng): `src/lib/supabase.js` (chỉ Neon, bỏ công tắc),
`AuthContext`, `ProtectedRoute`, `api/_auth.js`, `api/_gemini.js`, 3 Edge Function tài khoản, `scripts/sao-luu-neon.mjs`,
các test giữ chuẩn mã (`khongGoiThangDb.test.js`, danh mục hàm, mã trùng).

**Gemini chỉ dùng phía thủ thư / giáo viên** (điều khoản Gemini không cho người dưới 18 dùng trực tiếp — Ôn Tập Tin đã tắt từ 27/10):
- Viết nháp "giới thiệu ngắn 1–2 câu" và đề xuất chủ đề cho sách khi nhập danh mục → thủ thư sửa / duyệt.
- Soát nháp review của học sinh (nội dung không phù hợp, chép nguyên văn) → chỉ gợi ý, thủ thư quyết.
Học sinh không bao giờ nhận chữ do AI viết mà chưa qua người duyệt.

## 4. Ba tầng mã

```
src/pages, src/components, src/hooks   Giao diện — chỉ hiển thị, gọi hàm có tên ở src/data
src/data/        Dữ liệu — CHỈ nơi gọi from()/rpc(), chọn đúng cột, có giới hạn dòng
src/domain/      Nghiệp vụ — hàm thuần, có test
api/             Máy chủ Vercel (Gemini)
sql/             Thay đổi CSDL: NGÀY_ten.sql, ghi "chạy trên Neon", chạy lại được
```

| src/domain/ | Quy tắc |
|---|---|
| `muonTra.js` | tính hạn trả, quá hạn mấy ngày, còn được mượn thêm không (hiển thị; máy chủ kiểm lại) |
| `danhMuc.js` | đọc bảng Excel, chuẩn hoá mã sách, kiểm tra cột / chủ đề hợp lệ, tách "Kim Đồng, 2020" |
| `goiY.js` | chấm điểm sách để gợi ý (chủ đề em thích, khối, còn bản, chưa đọc) |
| `nhatKy.js`, `review.js` | kiểm tra nội dung hợp lệ, độ dài, che tên khi xuất |
| `thongKe.js` | định dạng số liệu, ghép bảng trước – sau, tính chênh lệch % |

| src/data/ | Bảng / hàm máy chủ |
|---|---|
| `hoSo.js`, `lop.js`, `taiKhoan.js` | ho_so, lop, Edge Functions |
| `sach.js`, `chuDe.js` | sach, sach_chu_de, chu_de, (rpc `nhap_danh_muc`) |
| `muonTra.js` | luot_muon (rpc `dat_muon`, `duyet_muon`, `ghi_tra`, `bao_mat`) |
| `nhatKy.js`, `review.js` | nhat_ky, review (rpc `duyet_review`) |
| `thongKe.js`, `caiDat.js` | rpc `thong_ke_*`, so_lieu_truoc, cai_dat |

## 5. Cơ sở dữ liệu (Neon) — bản nháp

| Bảng | Cột chính | Ghi chú |
|---|---|---|
| `ho_so` | id (= auth uid), ho_ten, vai_tro, lop_id, hoat_dong | vai trò chỉ máy chủ đặt; trigger chặn tự sửa |
| `lop` | id, ten, khoi, nam_hoc, thi_diem | |
| `chu_de` | id, ten, thu_tu | 8–12 dòng |
| `sach` | id, ma_sach (duy nhất), ten, tac_gia, nxb, nam, khoi_tu, khoi_den, so_ban, vi_tri, gioi_thieu, anh_bia, an | |
| `sach_chu_de` | sach_id, chu_de_id | tối đa 2 chủ đề / sách (máy chủ kiểm) |
| `luot_muon` | id, sach_id, hoc_sinh_id, trang_thai, nguon, ngay_dat, ngay_muon, han_tra, ngay_tra, nguoi_xu_ly | trạng thái: cho_duyet / dang_muon / da_tra / mat / tu_choi / huy. Quá hạn tính ra, không lưu |
| `nhat_ky` | id, hoc_sinh_id, sach_id, ngay, so_trang, muc_thich, cau_thich, cam_nhan, cung_phu_huynh | |
| `review` | id, hoc_sinh_id, sach_id, noi_dung, so_sao, trang_thai, ly_do, nguoi_duyet, luc_duyet | |
| `so_lieu_truoc` | chi_so, ky, lop_id, gia_tri | thủ thư nhập từ sổ mượn + khảo sát |
| `cai_dat` | so_sach_toi_da, so_ngay_muon | |

**Bảo mật (máy chủ tự kiểm, không tin trình duyệt):**
- RLS bật cho mọi bảng ngay khi tạo. HS chỉ đọc / ghi nhật ký, review, lượt mượn **của mình**; đọc sách, chủ đề, review đã đăng.
- HS **không** được sửa trạng thái mượn, hạn trả, trạng thái review — mọi thay đổi trạng thái qua hàm máy chủ có kiểm vai trò.
- `dat_muon` kiểm ở máy chủ: số cuốn đang mượn + đang chờ < tối đa, sách còn bản, không đặt trùng.
- Thống kê là hàm máy chủ, chỉ thủ thư / quản trị / GVCN (lớp mình) gọi được; không bao giờ tính từ số trình duyệt gửi.
- Nếu sau này có huy hiệu: tính từ dữ liệu đã được thủ thư xác nhận (sách đã trả, review đã duyệt), không theo số trang HS tự khai.
- Khoá Gemini, khoá quản trị Supabase chỉ ở biến môi trường máy chủ, không nằm trong mã trang, không lên Git.

**Hiệu năng (thiết kế cho cả trường ~1.000 HS, 3.000 đầu sách, vài chục nghìn lượt mượn):**
- Chỉ mục: luot_muon(hoc_sinh_id, trang_thai), luot_muon(sach_id, trang_thai), luot_muon(trang_thai, han_tra),
  nhat_ky(hoc_sinh_id, ngay), review(trang_thai, sach_id), sach(ma_sach), tìm tên sách bằng pg_trgm.
- RLS viết dạng `(select auth.uid())` + hàm vai trò STABLE để không tính lại từng dòng.
- Danh sách luôn phân trang (30–50 dòng); thống kê gộp 1 lần gọi; không dùng Realtime — trang duyệt mượn có nút Làm mới
  (nếu cần tự hỏi lại thì 60 giây/lần, dừng khi tab ẩn).
- Lưu xong cập nhật tại chỗ, không tải lại cả danh sách.

## 6. Giai đoạn làm (khớp lịch thư viện: làm & thử tháng 11–12, áp dụng tháng 1)

| # | Thời gian | Việc | Xong khi |
|---|---|---|---|
| 0 | 17–23/11 | Chốt câu hỏi ở mục 8; tạo Supabase, Neon, Vercel, Git; khung app 3 tầng; đăng nhập 4 vai trò; bảng ho_so, lop + RLS; tạo tài khoản HS hàng loạt; lệnh sao lưu + thử khôi phục | Đăng nhập được 4 vai trò; HS thử không đọc được hồ sơ bạn |
| 1 | 24–30/11 | Danh mục: chủ đề, nhập Excel, ảnh bìa, tìm sách / lọc chủ đề / khối, trang chi tiết sách; AI viết nháp giới thiệu | Thủ thư nhập 200–300 sách thật từ Excel |
| 2 | 1–10/12 | Mượn trả: đặt mượn, duyệt, giao, ghi trả, báo mất, quá hạn, cài đặt quy tắc | Thử đủ vòng mượn → trả; HS không tự đổi trạng thái được |
| 3 | 11–20/12 | Nhật ký, review + duyệt review (AI soát nháp), gợi ý sách | Thủ thư duyệt review thật trên điện thoại |
| 4 | 21–31/12 | Thống kê, so sánh trước – sau, xuất Excel, xuất nhật ký ẩn tên; **rà soát bảo mật toàn bộ**, thử với dữ liệu gấp 10 lần; thủ thư + 1 lớp dùng thử | Danh sách rủi ro đã báo; test quyền xanh |
| 5 | Tháng 1 | Áp dụng lớp thí điểm, sửa lỗi theo góp ý | |

Mỗi giai đoạn: test cho domain + test quyền thật trên Neon (HS A cố đọc / sửa dữ liệu HS B, HS cố tự duyệt review,
tự đổi trạng thái mượn, gọi thống kê → phải bị chặn), cập nhật `docs/ARCHITECTURE.md`, báo 5 mục kiểm tra trong CLAUDE.md chung.

## 7. Giới hạn gói miễn phí cần nhớ
- Supabase free: tối đa 2 dự án; **tạm dừng nếu 7 ngày không ai đăng nhập** (nghỉ Tết phải vào bật lại).
- Neon free: 0,5 GB / dự án, giới hạn giờ máy (CU-giờ) mỗi tháng, tự ngủ sau 5 phút → lần mở đầu chậm ~1 giây.
  Dữ liệu chữ của app này nhỏ (ước vài chục MB / năm); ảnh bìa để ở Cloudinary, nén ~100 KB / ảnh.
- Vercel Hobby: dùng cho trường học phi thương mại được; hàm AI có giới hạn thời gian chạy.
- Gemini free: giới hạn lượt / ngày → AI chỉ chạy khi thủ thư bấm, xoay vòng khoá như Ôn Tập Tin.

## 8. Các quyết định đã chốt (17/11/2026)
1. Supabase, Neon, Gemini: **tạo mới hoàn toàn**, không dùng chung với Ôn Tập Tin.
2. Danh sách học sinh **mới**, nhập từ Excel ngay trong app (cột Họ và tên + Lớp; app tự tạo tên đăng nhập + mật khẩu 6 số,
   tải về danh sách để in phát). Không lấy từ Ôn Tập Tin.
3. **Chưa làm tài khoản phụ huynh**; đếm phụ huynh qua ô "đọc cùng bố mẹ" trong nhật ký.
4. Học sinh dùng **PC, laptop hoặc điện thoại ở nhà** → giao diện phải dùng tốt trên điện thoại.
5. Số liệu "trước": thủ thư **nhập số tổng** từ sổ mượn + khảo sát (không nhập từng lượt mượn cũ).
6. Sao lưu Neon **mỗi tuần** ra `SaoLuu/` trên máy thầy (`npm run sao-luu`), thử khôi phục vào nhánh Neon riêng.

## 9. Tiến độ
- 17/11: Giai đoạn 0 — xong phần mã (khung app 3 tầng, đăng nhập 4 vai trò, SQL hồ sơ / lớp / cài đặt + RLS,
  3 Edge Function tài khoản, nhập học sinh từ Excel, sao lưu / khôi phục, test quyền thật).
  Chờ thầy tạo tài khoản dịch vụ theo `HUONG-DAN-CAI-DAT.md` để chạy SQL, đưa hàm lên và thử thật.
- 17/11 (tối): Giai đoạn 0 chạy thật — Supabase + Neon + 3 Edge Function, đăng nhập quản trị / HS, nhập HS từ Excel,
  sao lưu lần đầu OK, test quyền thật 8/8. Còn: thử khôi phục vào nhánh Neon; đưa lên Vercel (chưa cần).
- 17/11 (tối): Giai đoạn 1 phần chính — chủ đề, nhập danh mục Excel (tệp mẫu), tìm sách không dấu / lọc chủ đề / khối,
  chi tiết + sửa sách; test quyền sách 6/6. Còn: ảnh bìa (cần Cloudinary), AI nháp giới thiệu (cần khoá Gemini).
- 18/11: Thầy duyệt lọc chức năng app mẫu (`docs/LOC-CHUC-NANG-APP-MAU.md`): **chuỗi tuần** (≥ 3 lần ghi / tuần), mốc nhẹ
  (cuốn đầu, 5 / 10 / 20 cuốn, chuỗi 4 / 8 tuần), thử thách lớp **để sau**, mặc định mượn: tối đa 2 cuốn, mượn 7 ngày,
  giữ sách đã soạn 3 ngày, hết bản → hàng chờ, em tự huỷ khi chưa soạn.
- 18/11: Giai đoạn 2 mượn – trả — bảng `luot_muon` + hàm máy chủ; HS: đặt trước ở trang sách, Tủ sách của em;
  thủ thư: Mượn – trả (Cần soạn / Chờ em đến nhận / Đang mượn / Lịch sử), cho mượn tại chỗ, quy tắc mượn. Test quyền thật 6/6.

## 10. Thiết kế chức năng người dùng — thầy chốt 17/11/2026 (thay phần tương ứng ở mục 1, 5, 6)

**Cốt lõi** (lấy từ app mẫu `E:\UNG DUNG\NHAT-KY-DOC-SACH`): HS ghi **nhật ký đọc sách** để **sau 1 năm xem lại** mình đọc
mấy cuốn và **cảm xúc gắn với từng đoạn** trong sách. Sách **chỉ từ thư viện**. **Bỏ huy hiệu**, bỏ Google Books / ISBN,
thử thách tự đặt, cộng đồng tự do.

**Nhật ký (HS):** mỗi lần ghi = sách (chọn từ danh mục; sách đang mượn hiện đầu) + **đoạn em nhớ** (chép câu / kể ngắn, trang tuỳ chọn)
+ **cảm xúc** (chọn hình: vui, buồn, bất ngờ, hồi hộp, xúc động, suy nghĩ, buồn cười) + **em nghĩ gì**. Một cuốn ghi nhiều lần.
"Đọc xong" → mức thích 1–5. Ai xem: em, GVCN lớp em, thủ thư. Giới thiệu sách cho bạn = câu riêng, thủ thư duyệt mới hiện.
Nhật ký giữ qua các năm (lên lớp không mất).

**Nhìn lại năm đọc sách (HS):** số cuốn đọc xong, số đoạn đã ghi, cảm xúc nhiều nhất, dòng thời gian theo tháng (bìa sách),
bấm cuốn → các đoạn + cảm xúc; in / lưu sổ đọc sách (tuỳ chọn che tên để làm minh chứng).

**Gợi ý (HS):** theo chủ đề + mức thích trong nhật ký (và chủ đề em chọn lúc đầu), hợp khối, em chưa đọc, còn bản.

**Mượn sách:** HS **đặt trước** trong app → thủ thư thấy danh sách đặt trước, **soạn sẵn** → em **lên thư viện lúc nào cũng được**,
cô thư viện bấm **cho mượn** → hạn trả → ghi trả / báo mất. Thủ thư cũng cho mượn trực tiếp không cần đặt trước.
Máy chủ kiểm: số cuốn (đặt + đang mượn) ≤ tối đa, không đặt trùng.

**Chuẩn bị sách (thủ thư):** danh sách đặt trước cần soạn; sách nhiều em chờ mà ít bản; nhu cầu theo lớp.
