# Kiểm tra bản demo 0.2

Ngày: 26/10/2026.

## Cập nhật sử dụng voucher

- 30/30 kiểm thử nghiệp vụ tự động đạt (`npm test`). Bảy kiểm thử mới bao gồm: khách dùng voucher thuộc ví, chặn dùng lại từ cả hai luồng, khách chưa đăng nhập/sai chủ sở hữu, hết hạn đúng thời điểm, khách và thu ngân xác nhận đồng thời theo cả hai thứ tự, lưu trạng thái qua lần nạp repository và tương thích voucher đã dùng từ bản 0.1.
- Kiểm tra giao diện 390px qua iframe cùng nguồn: nút Sử dụng voucher, hộp xác nhận, Để sau giữ nguyên trạng thái, xác nhận chuyển sang nhóm Đã sử dụng, biên nhận ghi người/thời gian, nút dùng lại bị khóa, voucher hết hạn bị khóa. Đây chưa phải kiểm thử iPhone/Android thật.
- Kiểm tra quản trị desktop: đánh dấu trực tiếp từ dòng voucher trong Danh sách trúng; hiển thị phân biệt khách tự xác nhận/nhân viên xác nhận; bấm mã để tra cứu tại quầy và thấy trạng thái đã dùng.
- Kiểm tra hai tab cùng trình duyệt: khi hộp xác nhận của khách đang mở, thu ngân dùng voucher ở tab quản trị; hộp khách tự cập nhật thành đã dùng và mất nút xác nhận. Tải lại trang vẫn giữ trạng thái.
- Kiểm tra cú pháp mô-đun và gói HTML độc lập sinh từ cùng nguồn (`npm run package`, `node --check release/bundle-check.js`). Trang chuẩn bị dữ liệu QA được loại khỏi mã nguồn xuất bản.

## Kiểm tra nền tảng đã hoàn tất ở 0.1

Số điện thoại, tổng/độ chính xác tỷ lệ, phân bổ hết quà và ngưỡng >1%, ô 0%, chọn đều, biên ngẫu nhiên, quota miễn phí/mã, ngày Việt Nam, hết hạn lượt, idempotency, tranh chấp tồn/quota trong repository mô phỏng, khôi phục và snapshot quyền lợi. Kiểm tra giao diện quay, cấp lượt bằng ANNI2026, lưu tên/khôi phục ví, chặn tổng tỷ lệ sai. Bản 0.1 đã xuất bản thành công qua GitHub Actions.

## Giới hạn

Chưa có backend, MySQL hoặc dữ liệu dùng chung nhiều thiết bị; quản trị là giao diện mô phỏng mở. Chống dùng lại ở bản demo chỉ áp dụng trong dữ liệu của trình duyệt. Các kiểm thử này không chứng minh an toàn khi vận hành quà thật. Chưa có OTP hoặc camera quét QR; thu ngân nhập mã voucher.
