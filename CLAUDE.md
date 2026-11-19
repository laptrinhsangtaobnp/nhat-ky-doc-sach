# Nhật ký đọc sách — sáng kiến thư viện 2026

App thư viện trường tiểu học: danh mục sách, mượn – trả, nhật ký đọc, review, gợi ý sách, thống kê trước – sau cho sáng kiến.
Người dùng: thủ thư, giáo viên Tin (quản trị), GVCN lớp thí điểm, **học sinh khối 3–5 (trẻ em)**. Chưa có tài khoản phụ huynh.
HS dùng PC, laptop hoặc điện thoại ở nhà → giao diện phải dùng tốt trên điện thoại.
**Đầu mỗi phiên đọc `docs/NHAT-KY-LAM-VIEC.md`** (đã làm gì, đang dở gì, điều cần nhớ); cuối phiên ghi thêm 1 mục.
Kế hoạch & các quyết định: `KE-HOACH-APP.md`. Danh sách tài khoản: `docs/TAI-KHOAN.local.md` (chỉ trên máy, không lên Git — kho công khai). Yêu cầu nghiệp vụ gốc: tài liệu thư viện (link trong kế hoạch).

## Stack
React 19 + Vite 7 + Tailwind 4 · Supabase **chỉ đăng nhập** + Edge Function tài khoản · Neon **dữ liệu** (Data API + RLS,
nhận thẻ Supabase, `auth.uid()`) · Gemini qua Vercel `api/` (chỉ phía thủ thư) · Cloudinary ảnh bìa (giai đoạn 1) · Vercel.
Dự án Supabase / Neon / Gemini **mới hoàn toàn**, không dùng chung với Ôn Tập Tin (chỉ tham khảo mã của app đó).

## Quy tắc bắt buộc
- **3 tầng**: giao diện (`pages`, `components`, `hooks`) → `src/data/` (CHỈ nơi gọi `supabase.from/rpc/auth/functions`)
  → `src/domain/` (hàm thuần, có test). `src/khongGoiThangDb.test.js` đỏ nếu vi phạm, nếu tệp > 400 dòng.
- **Không viết 2 hàm cùng việc**: trước khi viết hàm mới, tra "Danh mục hàm" trong `docs/ARCHITECTURE.md` và grep
  `src/domain`, `src/data`, `scripts`; có rồi thì dùng lại, thấy bản chép thì gộp. Thêm / đổi hàm → sửa danh mục cùng lúc
  (`src/danhMucHam.test.js` đỏ nếu hàm xuất ra / hàm SQL chưa có tên trong ARCHITECTURE.md).
  Đọc `.env` trong script / test: chỉ dùng `scripts/docEnv.mjs`.
- Vai trò: `quan_tri` · `thu_thu` · `giao_vien` · `hoc_sinh`. Nhân viên = quan_tri + thu_thu (`la_nhan_vien()`).
- Ghi hồ sơ CHỈ qua hàm Neon (`tao_ho_so`, `sua_ho_so`, `xoa_ho_so`) — không có quyền ghi thẳng bảng `ho_so`.
- Trạng thái mượn, trạng thái review, thống kê: **máy chủ** quyết (hàm Neon có kiểm vai trò), không nhận từ trình duyệt.
- Học sinh không dùng AI tạo sinh trực tiếp; không gửi tên học sinh cho Gemini.
- SQL: `sql/NĂM-THÁNG-NGÀY_ten.sql`, ghi "CHẠY TRÊN NEON", chạy lại được. Sau khi chạy: Neon → Data API → Refresh schema cache.
- Bảng mới → thêm vào `THU_TU` trong `scripts/khoi-phuc-neon.mjs` + bảng trong `docs/ARCHITECTURE.md` + test quyền `tests/that/`.

## Lệnh
- `npm run dev` · `npm test` (nhanh, không mạng) · `npm run test:quyen` (thử quyền thật, cần tài khoản thử trong .env) · `npx eslint .`
- `npm run sao-luu` → `SaoLuu/` (không lên Git) · khôi phục: `node scripts/khoi-phuc-neon.mjs <thư mục> <neon đích> [--that-su]`
- Đưa Edge Function: `npx supabase functions deploy <ten> --project-ref <ref>` (cần SUPABASE_ACCESS_TOKEN = SUPABASE_PAT),
  secret `NEON_DATA_URL` đặt bằng `npx supabase secrets set`.
