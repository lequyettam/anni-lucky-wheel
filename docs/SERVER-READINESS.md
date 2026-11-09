# Trạng thái bàn giao VPS · 1.0.0-rc.1

Backend Laravel/MariaDB đã được viết và kiểm thử trong môi trường riêng. **Chưa cài trên VPS Contabo của ANNI, chưa đổi DNS, chưa xác minh PHP/cPanel/cấu hình MariaDB thực tế của VPS.** Đây là bản để đội code triển khai staging, nghiệm thu rồi mở chiến dịch.

## Đã có trong mã nguồn

- Kết nối MariaDB qua config/env, migration và khởi tạo quản trị viên bằng CLI kín.
- RNG, quota, tồn kho, kho mã nhập sẵn, quyền truy cập, ví và đổi quà chạy trên server.
- Transaction, khóa hàng, idempotency và unique constraints; kiểm thử tranh chấp quà cuối/đổi cùng voucher trên MariaDB.
- Phiên DB qua cookie HttpOnly/Secure, CSRF, Argon2id, giới hạn đăng nhập và thu hồi phiên khi đổi quyền.
- Frontend API cùng tên miền, polling nhiều thiết bị, báo mất kết nối, không ghi thưởng offline.
- Theme, nội dung, logo sáng/tối, nhân viên, báo cáo và audit lưu chung trong DB.
- Hướng dẫn cPanel, dependencies, môi trường, HTTPS, cron, backup/restore, cập nhật, lệnh chẩn đoán và CI.

## Đội code cần nghiệm thu trên VPS

1. Xác nhận PHP CLI và PHP-FPM >= 8.3 có đủ extension, Argon2id; MariaDB có InnoDB/utf8mb4 và user riêng.
2. Cài theo [DEPLOY-VPS-MARIADB.md](DEPLOY-VPS-MARIADB.md), dùng staging/DB riêng trước. Chạy `anni:doctor`, bảo đảm `.env` không truy cập qua web và APP_DEBUG=false.
3. Tạo quà/mã kiểm tra trên staging, thử laptop + hai điện thoại thật, mạng yếu, đăng nhập lại bằng mã khôi phục, thu hồi quyền và cập nhật theme/logo.
4. Xác nhận mã đã dùng ở một thiết bị không dùng được ở thiết bị khác; kiểm tra thời gian VN, hết kho, hết mã và hết hạn.
5. Đo tải theo lượng khách dự kiến; snapshot/báo cáo hiện chưa phân trang. Kiểm tra ngưỡng đăng nhập theo IP khi khách dùng chung Wi-Fi.
6. Sao lưu và **phục hồi thử** vào DB khác; ghi người phụ trách, lịch backup, thời gian giữ bản và quy trình rollback.
7. Duyệt điều kiện/quà thật, tồn thật, ngày chạy và thông tin cửa hàng. Bản cài mới mặc định tạm dừng, tồn quà 0, không có mã cấp lượt hay khách mẫu. Chỉ mở chiến dịch sau nghiệm thu.

Bản GitHub Pages vẫn chạy độc lập bằng dữ liệu trình duyệt; không thay thế bản VPS. Chưa tự nhập dữ liệu localStorage cũ. Không OTP theo yêu cầu, chưa kết nối POS/app mua hàng. Xem [SERVER-API.md](SERVER-API.md) để hiểu ranh giới và giới hạn kỹ thuật.
