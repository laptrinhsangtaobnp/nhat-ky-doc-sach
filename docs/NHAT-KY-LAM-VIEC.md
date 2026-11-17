# Nhật ký làm việc — đọc ĐẦU MỖI PHIÊN để biết đã làm gì, đang dở gì

Ghi mới nhất ở trên. Mỗi phiên thêm 1 mục: đã làm, kiểm tra gì, còn dở gì, điều cần nhớ. Không ghi mật khẩu / khoá.

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
