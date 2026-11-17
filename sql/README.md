# Thay đổi cơ sở dữ liệu

- Mọi tệp chạy trên **Neon** (Neon → SQL Editor, hoặc Claude chạy bằng `NEON_DATABASE_URL`), trừ tệp ghi rõ khác.
- Tên `NĂM-THÁNG-NGÀY_ten.sql` → đọc theo thứ tự tên là đúng thứ tự đã chạy. Đầu tệp ghi: để làm gì, chạy lại được không.
- Viết để chạy lại nhiều lần không hỏng (`if not exists`, `create or replace`, `drop policy if exists`).
- Sau khi chạy tệp có bảng / hàm mới: Neon → Data API → **Refresh schema cache**.
- Tệp `*.local.sql` (có mật khẩu) không đưa lên Git.

| Tệp | Nội dung | Đã chạy |
|---|---|---|
| `2026-11-17_khoi_tao.sql` | ho_so, lop, cai_dat, RLS, hàm tài khoản | 17/11 trên Neon |
| `2026-11-18_danh_muc_sach.sql` | chu_de, sach, sach_chu_de, RLS, nhap_danh_muc, tìm không dấu | 17/11 trên Neon (đặt tên ngày 18 để xếp sau tệp khởi tạo) |
