# Kiến trúc — cập nhật 17/11/2026 (giai đoạn 1: danh mục sách)

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
| | `mauTim(s)` | chữ ô tìm → mẫu không dấu cho cột `sach.tim` |

**src/data/** (chỉ nơi gọi Supabase / Neon)
| Tệp | Hàm | Việc |
|---|---|---|
| `dangNhap.js` | `dangNhap`, `dangXuat`, `layPhien`, `theoDoiDangNhap`, `doiMatKhauCuaToi` | Supabase Auth |
| `hoSo.js` | `layHoSo(id)` | hồ sơ 1 người |
| | `layNguoiDung({lopId, vaiTro, tuKhoa, trang})` | danh sách có lọc, 50 dòng/trang + tổng |
| | `layTenDangNhapDaCo(ds)` | tên đăng nhập nào đã có (chống trùng khi nhập Excel) |
| | `suaHoSo({...})` | rpc `sua_ho_so` |
| `lop.js` | `layCacLop(namHoc)`, `damBaoCoLop(ten, namHoc)`, `taoLop`, `datThiDiem`, `xoaLop` | bảng `lop` |
| `taiKhoan.js` | `taoTaiKhoan(ds, moiLan)`, `datLaiMatKhau(id, mk)`, `xoaTaiKhoan(id)` | Edge Functions tài khoản (lô 40 người) |
| `sach.js` | `timSach({tuKhoa, chuDeId, khoi, trang})` | tìm không dấu, lọc chủ đề / khối, 30 cuốn/trang + tổng |
| | `laySach(id)`, `suaSach(id, {...chuDeIds})`, `xoaSach(id)` | chi tiết / sửa (cột được phép + rpc `dat_chu_de_sach`) / xoá |
| | `nhapDanhMuc(ds, moiLan)` | rpc `nhap_danh_muc`, lô 200 cuốn |
| `chuDe.js` | `layChuDe`, `themChuDe`, `suaChuDe`, `xoaChuDe` | bảng `chu_de` |
| `tepExcel.js` | `docTepExcel(tep)`, `taiVeTep(noiDung, tenTep)` | đọc .xlsx (≤ 5MB), tải tệp về máy |
| `cauHinh.js` | `THIEU_CAU_HINH` | đã đủ biến kết nối chưa |

**src/hooks/**: `useTaiKhoan()` — trang Tài khoản · `useTimSach()` — trang Tìm sách (lọc, "Xem thêm", cập nhật tại chỗ).

**Edge Functions** `supabase/functions/_shared/chung.ts`: `json`, `laOptions`, `quanTriSupabase()`, `neon(duong, token)`,
`nguoiGoi(req, sb)` (chỉ trả về nếu là nhân viên đang hoạt động), `vaiTroCua(id, token)`.

**Hàm Neon (SQL)**: `vai_tro_cua_toi()`, `lop_cua_toi()`, `la_nhan_vien()`, `tao_ho_so`, `sua_ho_so`, `xoa_ho_so`,
`bo_dau(t)` (bỏ dấu, dùng cho cột `sach.tim`), `nhap_danh_muc(p_ds)`, `dat_chu_de_sach(p_sach_id, p_chu_de_ids)`,
trigger `kiem_toi_da_chu_de` (≤ 2 chủ đề / sách).

**scripts/**: `docEnv.mjs` → `docEnv()` (đọc .env — mọi script và test thật dùng chung), `GOC_DU_AN`.
`sao-luu-neon.mjs`, `khoi-phuc-neon.mjs`, `chay-sql.mjs` (chạy 1 tệp SQL trên Neon).

## Cơ sở dữ liệu (Neon) — `sql/2026-11-17_khoi_tao.sql`, `sql/2026-11-18_danh_muc_sach.sql`
| Bảng | Ai đọc | Ai ghi |
|---|---|---|
| `ho_so` | tự mình; nhân viên: tất cả; GVCN: HS lớp mình | chỉ qua hàm `tao_ho_so` / `sua_ho_so` (nhân viên; thủ thư chỉ với HS) / `xoa_ho_so` (quản trị) |
| `lop` | mọi người đã đăng nhập | nhân viên |
| `cai_dat` (1 dòng: số sách tối đa, số ngày mượn) | mọi người đã đăng nhập | nhân viên |
| `chu_de` | mọi người đã đăng nhập | nhân viên |
| `sach` (`tim` = tên + tác giả + mã bỏ dấu, chỉ mục trigram) | nhân viên: tất cả; người khác: sách không ẩn | nhân viên: sửa đúng các cột được cấp; thêm qua `nhap_danh_muc` |
| `sach_chu_de` (≤ 2 / sách) | mọi người đã đăng nhập | nhân viên |

Hàm hỏi quyền: `vai_tro_cua_toi()`, `lop_cua_toi()`, `la_nhan_vien()` — STABLE, security definer, gọi trong RLS dạng
`(select ...)` để chỉ tính 1 lần mỗi câu lệnh. Tài khoản bị khoá (`hoat_dong=false`) → các hàm trả null → không đọc được gì.

## Kiểm tra
- `npm test`: domain + quy tắc tầng / độ dài tệp.
- `npm run test:quyen` (`tests/that/`, dùng chung `_chung.js`): `quyen.test.js` hồ sơ / tài khoản, `sach.test.js` danh mục
  (HS không ghi được, không thấy sách ẩn, nhập lại không trùng, ≤ 2 chủ đề) — người lạ, HS, thủ thư thật trên Neon / Edge Function.
