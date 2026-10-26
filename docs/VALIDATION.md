# Kiểm tra bản demo 0.1

Ngày: 26/10/2026.

- 23 kiểm thử nghiệp vụ tự động đều đạt (`node --test tests/*.test.mjs`). Phạm vi: số điện thoại, tổng/độ chính xác tỷ lệ, phân bổ khi hết quà, ngưỡng >1%, ô 0%, chọn đều, biên ngẫu nhiên, quota miễn phí và mã, reset ngày Việt Nam, hết hạn lượt/voucher, idempotency, tranh chấp tồn/quota trong repository mô phỏng, khôi phục và snapshot quyền lợi.
- Kiểm tra trực tiếp bằng trình duyệt: đăng nhập số mẫu, mã ANNI2026 cộng đúng 2 lượt, quay không trúng, quay trúng bằng cấu hình thử rõ ràng, cấp mã khôi phục, lưu tên và ví, mở voucher, thu ngân tra cứu và xác nhận dùng, nút đổi lại bị khóa.
- Kiểm tra quản trị chặn lưu tổng 60% và chấp nhận tổng 100%.
- Kiểm tra desktop và viewport điện thoại 390px qua iframe cùng nguồn. Nút quay cố định hiển thị trong vùng nhìn thấy; đây chưa phải kiểm thử thiết bị iPhone/Android thật.
- Kiểm tra bản HTML độc lập được sinh từ mô-đun tải và hiển thị đúng. Đã khôi phục dữ liệu test về bộ mẫu; các dữ liệu thao tác trong trình duyệt không nằm trong mã nguồn xuất bản.

Giới hạn: chưa có backend, chưa kiểm thử MySQL hoặc nhiều máy khách; tài khoản quản trị là giao diện mô phỏng mở. Không có OTP. Camera quét QR chưa thuộc bản này; thu ngân nhập mã voucher. GitHub Actions workflow đã chuẩn bị nhưng chưa được chạy trên GitHub trong phiên này.
