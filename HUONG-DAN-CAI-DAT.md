# Hướng dẫn tạo tài khoản dịch vụ (làm 1 lần, khoảng 30 phút)

Thầy tạo tài khoản và dán các giá trị vào tệp `.env` trong thư mục dự án (chép từ `.env.example`, đổi tên thành `.env`).
**Không dán khoá bí mật vào khung chat** — chỉ dán vào `.env`. Tệp `.env` không bao giờ được đưa lên Git.
Xong bước 1–3, báo Claude: Claude sẽ tự chạy SQL trên Neon, đưa 3 hàm tài khoản lên Supabase và chạy kiểm tra quyền.

## 1. Supabase (chỉ để đăng nhập)
1. Vào supabase.com → **New project**. Tên: `nhat-ky-doc-sach`. Region: **Southeast Asia (Singapore)**. Đặt mật khẩu database (lưu riêng).
2. **Authentication → Sign In / Providers**:
   - Tắt **Allow new users to sign up** (học sinh không tự đăng ký; thủ thư tạo tài khoản).
   - Tắt **Confirm email**.
3. **Project Settings → JWT Keys**: kiểm tra đang dùng khoá kiểu **ECC (P-256)** hoặc **RSA** (dự án mới mặc định là vậy).
   Nếu chỉ có "Legacy JWT secret" → bấm chuyển sang khoá mới (Neon cần khoá kiểu này để nhận thẻ đăng nhập).
4. **Project Settings → API Keys**: chép vào `.env`
   - `VITE_SUPABASE_URL` = Project URL (dạng `https://abcxyz.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` = khoá **publishable** (hoặc `anon`) — khoá này công khai, được phép nằm trong trang web.
   - ⚠ KHÔNG chép khoá `service_role` / `secret` vào `.env` — nó chỉ nằm trên máy chủ Supabase (tự có sẵn trong Edge Function).
5. Avatar góc phải → **Account → Access Tokens → Generate new token** → chép vào `.env`: `SUPABASE_PAT=...`
   (dùng để Claude đưa hàm lên và để sao lưu tài khoản).

## 2. Neon (lưu dữ liệu)
1. Vào neon.tech → **New project**. Tên: `nhat-ky-doc-sach`. Region: **AWS Asia Pacific (Singapore)**.
2. **Connect** → chép chuỗi kết nối (dạng `postgresql://neondb_owner:...@ep-...neon.tech/neondb?sslmode=require`)
   → `.env`: `NEON_DATABASE_URL=...` (bí mật: dùng cho Claude chạy SQL và sao lưu).
3. **Data API** → **Enable**. Ở phần **Authentication provider** chọn loại khác / tự cấu hình (Other / Custom JWKS), dán:
   `https://<mã-dự-án-supabase>.supabase.co/auth/v1/.well-known/jwks.json`
   (mã dự án là phần `abcxyz` trong Project URL ở bước 1.4).
4. Chép **Data API URL** (dạng `https://ep-....apirest....neon.tech/neondb`) → `.env`: `VITE_NEON_DATA_URL=...`

## 3. Gemini (AI hỗ trợ thủ thư — dùng từ giai đoạn 1)
1. Vào aistudio.google.com bằng tài khoản Google mới của dự án → **Get API key → Create API key**.
2. Chép vào `.env`: `GEMINI_API_KEY=...`
Ghi chú: app chỉ gửi cho Gemini thông tin **sách** (tên, tác giả) và nháp review **không kèm tên học sinh**.
Học sinh không dùng AI trực tiếp (điều khoản Gemini không cho người dưới 18 tuổi).

## 4. Tạo tài khoản quản trị đầu tiên (Claude làm cùng thầy)
1. Supabase → **Authentication → Users → Add user → Create new user**: email `<tên-đăng-nhập>@school.local`
   (ví dụ `thayphuong@school.local`), mật khẩu mạnh, tích **Auto confirm**.
2. Báo Claude tên đăng nhập → Claude thêm hồ sơ quản trị cho tài khoản đó ở Neon.
3. Từ đây thầy đăng nhập app, tạo tài khoản thủ thư và nhập học sinh từ Excel ngay trong app.

## 5. GitHub + Vercel (đưa app lên mạng — làm sau khi chạy thử trên máy được)
1. GitHub → **New repository** (Private) tên `nhat-ky-doc-sach`. Claude sẽ đẩy mã lên.
2. vercel.com → **Add New → Project** → chọn repo đó → **Environment Variables**: thêm 3 biến
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_NEON_DATA_URL` (từ giai đoạn 1 thêm `GEMINI_API_KEY`).
   Không thêm `NEON_DATABASE_URL`, `SUPABASE_PAT` lên Vercel — 2 khoá này chỉ ở máy thầy.
3. **Deploy**.

## Giới hạn gói miễn phí cần nhớ
- Supabase **tạm dừng dự án nếu 7 ngày không ai đăng nhập** → nghỉ Tết / hè: vào supabase.com bấm Restore.
- Neon tự ngủ sau 5 phút không dùng → lần mở đầu chậm khoảng 1 giây (bình thường).
- Sao lưu: chạy `npm run sao-luu` **mỗi tuần** (Claude có thể đặt lịch tự chạy trên máy thầy).
