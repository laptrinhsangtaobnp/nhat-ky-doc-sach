# Nhật ký làm việc — đọc ĐẦU MỖI PHIÊN để biết đã làm gì, đang dở gì

Ghi mới nhất ở trên. Mỗi phiên thêm 1 mục: đã làm, kiểm tra gì, còn dở gì, điều cần nhớ. Không ghi mật khẩu / khoá.

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
- [ ] Thầy thử trên máy: HS (dùng `thu.hs3` hoặc HS thật — test xoá lượt mượn của thu.hs1/hs2) đặt trước → thủ thư soạn → cho mượn → trả.
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

### Tài khoản trên Supabase (dự án NHAT_KY_DOC_SACH, ref kfwcjkmghfahsbbcctdt)
| Đăng nhập | Vai trò (ở Neon `ho_so`) | Ghi chú |
|---|---|---|
| `phuongtt179@gmail.com` | quan_tri (ten_dang_nhap `phuongtt179`) | email thật → phải gõ **email đầy đủ** khi đăng nhập |
| `thu.hs1@gmail.com`, `thu.hs2@gmail.com`, `thu.hs3@gmail.com` | hoc_sinh, lớp `3THU` (2026-2027) | tài khoản thử; tạo nhầm đuôi @gmail |
| `thu.thu_thu@gmail.com` | thu_thu | tài khoản thử |
| (3 HS thầy nhập thử từ Excel) | hoc_sinh | đuôi `@school.local`, gõ tên ngắn |

`.env` có `THU_HS1`, `THU_HS2`, `THU_THU_THU` dạng `email:matkhau` cho test quyền thật.
Nên dọn sau: tạo lại 4 tài khoản thử với `@school.local` (thầy phải làm trên Supabase, rồi gắn lại `ho_so`).

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
