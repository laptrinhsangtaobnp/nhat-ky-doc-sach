# Lọc chức năng từ app mẫu (E:\UNG DUNG\NHAT-KY-DOC-SACH) — 17/11/2026

App mẫu: Flutter + Firebase, cho HS THCS/THPT, "Strava cho đọc sách". Đã đọc: README, FEATURE_ROADMAP, bản tổng quan PDF,
mô hình dữ liệu, chữ hiển thị của 16 màn hình. **Cái chính của app trường: nhật ký đọc sách → tạo thói quen ghi nhật ký
và thói quen đọc sách.** Lọc theo 3 câu: có giúp thói quen không? hợp HS lớp 3–4 không? an toàn dữ liệu trẻ em không?

Ký hiệu: ✅ giữ · ✏️ giữ nhưng sửa · ❌ bỏ · ⏳ để sau. **(TQ)** = giúp tạo thói quen.

## 1. Trang chủ của em
| App mẫu | Quyết định | Ở app trường |
|---|---|---|
| Lời chào theo buổi ("Chào buổi sáng") + "Hãy tiếp tục hành trình đọc sách" | ✅ | "Chào buổi sáng, An! Hôm nay em đọc gì?" |
| Khu "Đang đọc" (sách đang đọc, thanh %) | ✏️ (TQ) | Sách đang mượn + đang đọc; bấm là **ghi nhật ký ngay** |
| Hành động nhanh | ✏️ (TQ) | Nút to: **✍️ Ghi nhật ký** · 🔍 Tìm sách · 📖 Nhìn lại |
| Chuỗi đọc liên tiếp (ngày) | ✏️ (TQ) | **Chuỗi tuần**: tuần nào cũng ghi nhật ký ≥ N lần (cuối tuần, ốm không bị mất chuỗi như chuỗi ngày) |
| Mục tiêu năm nay: sách/năm, trang/tuần, phút/ngày | ✏️ (TQ) | 1 mục tiêu dễ hiểu: **"Mỗi tuần ghi 3 lần"** + **"Tháng này đọc xong 2 cuốn"** — em chọn mức (gợi ý sẵn) |
| Thống kê nhanh: tổng sách, tổng trang, giờ đọc | ✏️ | Số cuốn đã đọc xong · số trang nhật ký đã viết |
| Đánh giá gần đây của cộng đồng | ✏️ | "Bạn bè giới thiệu" (đã duyệt), 3 cái mới nhất |

## 2. Tủ sách của em (app mẫu: Thư viện cá nhân)
| App mẫu | Quyết định | Ở app trường |
|---|---|---|
| 3 ngăn Muốn đọc / Đang đọc / Đã đọc | ✏️ | **Đặt trước** (đang chờ / đã soạn) · **Đang đọc** · **Đã đọc** |
| Thêm sách: Google Books, quét ISBN, nhập tay | ❌ | Sách chỉ từ danh mục thư viện |
| Cập nhật tiến độ: trang hiện tại, % | ✏️ | "Em đọc đến trang…" (tuỳ chọn, ngay trong lần ghi nhật ký) → thanh % |
| Phiên đọc: số trang + **số phút** | ✏️ | Bỏ số phút (HS nhỏ ước sai, dễ khai khống); mỗi lần ghi nhật ký = 1 lần đọc |
| Đổi trạng thái, xoá sách khỏi thư viện | ✏️ | Trạng thái mượn do thủ thư / máy chủ; em chỉ bấm "Em đọc xong rồi" |
| **Màn chúc mừng khi đọc xong** + "Hãy chia sẻ cảm nhận" + **"Sách đọc tiếp theo"** | ✅ (TQ) | Giữ nguyên ý: 🎉 → chọn mức thích → viết cảm nhận cuối → **gợi ý 3 cuốn tiếp** → đặt trước luôn |
| Quyền riêng tư Public / Friends / Private | ❌ | Cố định: em + GVCN + thủ thư (trẻ em, không cho em tự chọn công khai) |

## 3. Nhật ký (app mẫu: Ghi chú & Highlights) — TRỌNG TÂM
| App mẫu | Quyết định | Ở app trường |
|---|---|---|
| Nội dung ghi chú | ✅ (TQ) | **Em nghĩ gì** |
| Trích dẫn (highlight đoạn trong sách) | ✅ (TQ) | **Đoạn em nhớ** (chép câu hay / kể ngắn) |
| Trang, chương | ✏️ | Trang (tuỳ chọn); bỏ chương |
| Loại ghi chú: suy nghĩ / câu hỏi / ý tưởng / tóm tắt / trích dẫn | ✏️ | Thay bằng **cảm xúc** (hình): vui, buồn, bất ngờ, hồi hộp, xúc động, suy nghĩ, buồn cười |
| Màu highlight, tag tự do | ❌ | Rườm rà với lớp 3–4 |
| Danh sách ghi chú: tìm kiếm, lọc | ✅ | Trong "Nhìn lại": tìm trong nhật ký của em, lọc theo cuốn / cảm xúc |
| Sửa / xoá ghi chú | ✅ | Em sửa / xoá được ghi chép của mình |
| (không có) | ➕ (TQ) | **Câu hỏi gợi ý** khi em bí: "Nhân vật em thích là ai? Vì sao?", "Nếu là nhân vật, em sẽ làm gì?" |
| (không có) | ➕ (TQ) | Ô "Em đọc cùng bố mẹ" (đếm phụ huynh cho sáng kiến) |

## 4. Đánh giá & cộng đồng
| App mẫu | Quyết định | Ở app trường |
|---|---|---|
| Đánh giá 1–5 sao | ✏️ | Mức thích bằng mặt cười 1–5 (khi đọc xong) |
| Review chữ + tag ("hay, cảm động, nên đọc") | ✏️ | **Câu giới thiệu cho bạn** + nhãn chọn sẵn; **thủ thư duyệt** mới hiện |
| Like, comment, sắp xếp theo like | ❌ | Tránh so bì, bình luận không kiểm soát giữa trẻ em |
| Tab Khám phá / Review gần đây | ✏️ | Trang "Bạn bè giới thiệu sách" (đã duyệt, hiện tên + lớp) |
| Thống kê sách: sao TB, số người đang đọc / đã đọc | ✅ (TQ) | Ở chi tiết sách: "12 bạn đã đọc · 😄 bạn bè rất thích" (số đếm, không lộ tên) |
| Kết bạn, follow, feed bạn bè | ❌ | |

## 5. Thống kê, thành tựu, thử thách
| App mẫu | Quyết định | Ở app trường |
|---|---|---|
| Thống kê tổng quan + biểu đồ | ✏️ | **Nhìn lại năm đọc sách**: số cuốn / tháng, số lần ghi / tháng, cảm xúc nhiều nhất, dòng thời gian, in sổ |
| 15 huy hiệu (sách 1–100, giờ 10–500, chuỗi 3–100 ngày, Cú đêm, Chim sớm) | ✏️ **bỏ bớt** | Giữ vài **mốc** nhẹ nhàng: cuốn đầu tiên, 5 / 10 / 20 cuốn, chuỗi 4 / 8 tuần ghi nhật ký. Bỏ giờ đọc, Cú đêm (khuyến khích thức khuya), Chim sớm, 50–100 cuốn. Không bảng xếp hạng |
| Popup "Đã mở khoá thành tựu!" | ✅ (TQ) | Khi đạt mốc |
| Thử thách tự tạo (số sách / trang / giờ / thể loại / chuỗi; ngày–năm; chia sẻ cộng đồng) | ⏳ ✏️ | Sau: **thử thách lớp do GVCN / thủ thư đặt** (vd "Tháng 3: mỗi em đọc 1 cuốn cổ tích") |

## 6. Gợi ý sách
| App mẫu | Quyết định | Ở app trường |
|---|---|---|
| Gợi ý theo tag → cùng tác giả → sách phổ biến | ✅ | Theo **chủ đề** sách em thích (mức thích cao) → cùng tác giả → sách bạn cùng khối thích; chỉ sách hợp khối, em chưa đọc, còn bản |

## 7. Tài khoản
| App mẫu | Quyết định | Ở app trường |
|---|---|---|
| Ảnh đại diện (chụp / tải lên) | ❌ | Không lưu ảnh trẻ em; có thể chọn 1 **hình con vật** làm đại diện |
| Đổi tên hiển thị | ❌ | Tên do trường nhập |
| Thông báo đẩy | ❌ | App web; thay bằng **dòng nhắc trên trang chủ** ("Đã 5 ngày em chưa ghi nhật ký") |
| Đăng nhập Google / email tự đăng ký | ❌ | Thủ thư tạo tài khoản (đã làm) |

## 8. Thêm cho sáng kiến (app mẫu không có)
- **GVCN – lớp của tôi:** ai ghi đều, **ai lâu chưa ghi** (để nhắc), đọc nhật ký của HS lớp mình (chỉ đọc).
- **Thống kê thói quen** (máy chủ tính): % HS ghi nhật ký ≥ 1 lần / tuần, số lần ghi TB / HS / tháng, số HS giữ chuỗi ≥ 4 tuần,
  số cuốn đọc xong / HS, lượt mượn từ gợi ý, số lần "đọc cùng bố mẹ" → so sánh trước – sau.
- **Xuất nhật ký tiêu biểu đã che tên** làm minh chứng.

## Chống khai khống (vì có chuỗi, mốc, thống kê)
- 1 lần ghi chỉ được tính vào chuỗi khi có "đoạn em nhớ" hoặc "em nghĩ gì" đủ dài (máy chủ kiểm), tối đa 1 lần / ngày được tính.
- "Đọc xong" chỉ tính vào mốc khi cuốn đó có ≥ 1 lần ghi nhật ký.
- Mốc, chuỗi, thống kê do **máy chủ tính**; giao diện chỉ hiển thị.
