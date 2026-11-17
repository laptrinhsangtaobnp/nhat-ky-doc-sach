# Kiến trúc — cập nhật 17/11/2026 (giai đoạn 0)

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

| src/data/ | Nguồn |
|---|---|
| `dangNhap.js` | Supabase Auth |
| `hoSo.js` | ho_so (+ rpc sua_ho_so) |
| `lop.js` | lop |
| `taiKhoan.js` | Edge Functions tài khoản |
| `tepExcel.js` | đọc tệp .xlsx trong trình duyệt, tải tệp CSV về |
| `cauHinh.js` | đã đủ biến kết nối chưa |

| src/domain/ | Quy tắc |
|---|---|
| `taiKhoan.js` | vai trò, trang chủ theo vai trò, tên đăng nhập → email, gợi ý tên đăng nhập, mật khẩu 6 số |
| `nhapHocSinh.js` | đọc bảng học sinh từ Excel, chuẩn hoá lớp, chống trùng tên đăng nhập, CSV tài khoản |
| `namHoc.js` | năm học hiện tại (đổi từ tháng 8) |

## Cơ sở dữ liệu (Neon) — `sql/2026-11-17_khoi_tao.sql`
| Bảng | Ai đọc | Ai ghi |
|---|---|---|
| `ho_so` | tự mình; nhân viên: tất cả; GVCN: HS lớp mình | chỉ qua hàm `tao_ho_so` / `sua_ho_so` (nhân viên; thủ thư chỉ với HS) / `xoa_ho_so` (quản trị) |
| `lop` | mọi người đã đăng nhập | nhân viên |
| `cai_dat` (1 dòng: số sách tối đa, số ngày mượn) | mọi người đã đăng nhập | nhân viên |

Hàm hỏi quyền: `vai_tro_cua_toi()`, `lop_cua_toi()`, `la_nhan_vien()` — STABLE, security definer, gọi trong RLS dạng
`(select ...)` để chỉ tính 1 lần mỗi câu lệnh. Tài khoản bị khoá (`hoat_dong=false`) → các hàm trả null → không đọc được gì.

## Kiểm tra
- `npm test`: domain + quy tắc tầng / độ dài tệp.
- `npm run test:quyen` (`tests/that/quyen.test.js`): người lạ, HS, thủ thư cố vượt quyền trên Neon / Edge Function thật.
