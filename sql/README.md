# Thay đổi cơ sở dữ liệu

- Mọi tệp chạy trên **Neon** (Neon → SQL Editor, hoặc Claude chạy bằng `NEON_DATABASE_URL`), trừ tệp ghi rõ khác.
- Tên `NĂM-THÁNG-NGÀY_ten.sql` → đọc theo thứ tự tên là đúng thứ tự đã chạy. Đầu tệp ghi: để làm gì, chạy lại được không.
- Viết để chạy lại nhiều lần không hỏng (`if not exists`, `create or replace`, `drop policy if exists`).
- Sau khi chạy tệp có bảng / hàm mới: Neon → Data API → **Refresh schema cache**.
- Tệp `*.local.sql` (có mật khẩu) không đưa lên Git.
- **Không dùng `auth.uid()`** trong SQL mới — dùng `public.toi()` (báo lỗi `chua_nhan_dien` khi Neon chưa nhận thẻ; app tự gọi lại).
  18/11: đã sửa cả 4 tệp và chạy lại theo thứ tự.

| Tệp | Nội dung | Đã chạy |
|---|---|---|
| `2026-11-17_khoi_tao.sql` | ho_so, lop, cai_dat, RLS, hàm tài khoản | 17/11 trên Neon |
| `2026-11-18_danh_muc_sach.sql` | chu_de, sach, sach_chu_de, RLS, nhap_danh_muc, tìm không dấu | 17/11 trên Neon (đặt tên ngày 18 để xếp sau tệp khởi tạo) |
| `2026-11-18_muon_tra.sql` | luot_muon, cai_dat.so_ngay_giu, RLS, hàm đặt trước / soạn / cho mượn / trả / báo mất / danh sách / đếm | 18/11 trên Neon |
| `2026-11-18_nhat_ky.sql` | nhat_ky, doc_xong, moc_dat, tuy_chon_hs, cai_dat (ngưỡng chuỗi), RLS, hàm ghi / chuỗi / mốc / Nhìn lại / Lớp | 18/11 trên Neon |
| `2026-11-19_cay_doc_sach.sql` | cây đọc sách thay chuỗi tuần (ngưỡng 3 chữ), mốc ngày / gia đình, riêng tư "Cho cô xem", bố mẹ viết, thư gửi chính mình (`thu_gui_minh`), sach.so_trang / cau_hoi, đọc tiếp. **Thay một số hàm của tệp 18/11** → chạy lại tệp 18/11 thì chạy lại tệp này | 19/11 trên Neon (chạy 2 lần) |
| `2026-11-19_nhap_so_trang.sql` | `nhap_danh_muc` nhận thêm `so_trang`, `cau_hoi` (ô trống giữ cũ). **Thay hàm của tệp 18/11** → chạy lại tệp 18/11 thì chạy lại tệp này | 19/11 trên Neon (chạy 2 lần) |
| `2026-11-19_dang_nhap_pin.sql` | mã lớp (`lop.ma_lop`, ẩn cột với người dùng), `pin_hs`, `lop_sai_pin`, hàm PIN, vai trò `dang_nhap_pin` (mật khẩu đặt bằng `scripts/dat-vai-tro-pin.mjs`). **Chạy lại tệp 17/11 thì chạy lại tệp này** (tệp 17/11 cấp lại quyền xem cả bảng lop) | 19/11 trên Neon (chạy 2 lần) |
| `2026-11-19_ho_chieu.sql` | hộ chiếu thể loại (tem tính từ doc_xong + chủ đề), mốc `tham_hiem` / `ho_chieu_day`, `ho_chieu_cua_toi`. **Thay `cap_nhat_moc`, `danh_dau_doc_xong`, `lop_tong_quan` của tệp cay_doc_sach** → chạy lại tệp đó thì chạy lại tệp này | 19/11 trên Neon (chạy 2 lần) |
| `2026-11-19_thu_thach_lop.sql` | thử thách lớp theo số ngày ghi (bảng `thu_thach_lop`, chỉ qua hàm), mốc `thu_thach`. **Thay `cap_nhat_moc` của tệp ho_chieu** → chạy lại tệp đó thì chạy lại tệp này | 19/11 trên Neon (chạy 2 lần) |
| `2026-11-19_thong_ke.sql` | thống kê sáng kiến (chỉ nhân viên): `thong_ke`, bảng `so_lieu_sang_kien` (số Trước / Sau nhập tay, chỉ qua hàm), chỉ mục `luot_muon(ngay_muon)` | 19/11 trên Neon (chạy 2 lần) |
| `2026-11-19_review.sql` | review của bạn bè (`review`, không cấp quyền bảng), hàm viết / xoá / xem theo sách / hàng chờ / duyệt | 19/11 trên Neon (chạy 3 lần) |
