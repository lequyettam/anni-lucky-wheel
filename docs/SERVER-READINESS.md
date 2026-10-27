# Chuẩn bị triển khai máy chủ riêng · 0.8.0

## Bản hiện tại

Giao diện đã bỏ các nhãn demo, quà mẫu và cảnh báo thử nghiệm ở trang chơi, ví quà, kết quả, thể lệ và quản trị. Đã bỏ điền sẵn số điện thoại, điền mã thử và nút nạp lại dữ liệu mẫu. Các chức năng khôi phục nội dung/nhận diện thương hiệu vẫn có đầy đủ.

Đây là mốc hoàn thiện giao diện để duyệt trước khi triển khai máy chủ, chưa phải hệ thống đã sẵn sàng trao quà thật. Mã chạy trên GitHub Pages vẫn sử dụng localStorage; cấu hình, lượt quay, tài khoản và voucher chưa dùng chung giữa các thiết bị. Mã khôi phục không cứu được dữ liệu sau khi xóa bộ nhớ trình duyệt. Kiểm tra quyền và trạng thái voucher phía trình duyệt có thể bị can thiệp. Mật khẩu nhân viên dùng SHA-256 có salt để mô phỏng, cần thay hoàn toàn khi chuyển backend.

Không chuyển các tài khoản, mã cấp lượt, lịch sử quay hoặc voucher hiện tại sang dữ liệu vận hành thật. Mã ANNI2026 trong bộ khởi tạo vẫn là dữ liệu kiểm tra, không phải mã phát hành cho cửa hàng. Chỉ nhập cấu hình thương hiệu, nội dung, theme và danh mục quà đã được duyệt; tạo lại tài khoản, mã cấp lượt và số lượng quà trên hệ thống mới.

## Bảo toàn dữ liệu khi nâng cấp giao diện

- Không đổi khóa lưu trữ; không xóa dữ liệu hoặc tạo lại tài khoản.
- Không thay tỷ lệ, số lượng quà, lượt quay, quyền nhân viên hoặc trạng thái voucher.
- Các câu mặc định cũ được đổi cách hiển thị theo bảng đối chiếu chính xác. Nội dung do chủ quán tự sửa được giữ nguyên, kể cả có từ “mẫu” hoặc “thử nghiệm”.
- Điều kiện trên voucher đã cấp không bị ghi lại. Bộ hiển thị chỉ bỏ cách gọi mẫu ở những chuỗi mặc định đã phát hành, giữ hạn mức và điều kiện mua hàng. Cấu hình xuất ra vẫn phản ánh dữ liệu đang lưu.
- Giữ `noindex,nofollow` trong giai đoạn duyệt; quyết định cho công cụ tìm kiếm lập chỉ mục khi có tên miền và bản vận hành.

## Các phần cần làm trên Laravel + MariaDB

1. Chuyển repository sang API có cơ sở dữ liệu tập trung. Khách và quầy đều đọc trạng thái voucher mới nhất từ máy chủ.
2. Xác thực nhân viên bằng cơ chế chuẩn của framework, mật khẩu Argon2id/bcrypt, phiên an toàn, giới hạn đăng nhập và kiểm tra quyền tại mọi API. Không dùng dữ liệu localStorage làm bằng chứng quyền.
3. Tạo ví khách với số điện thoại và mã khôi phục; lưu bản băm mã khôi phục, giới hạn số lần dò. Chưa OTP theo phạm vi đã thống nhất; cần giải thích đúng mức xác minh số điện thoại.
4. Máy chủ quyết định kết quả, kiểm tra giờ Việt Nam, quota và tồn quà. Dùng giao dịch cơ sở dữ liệu, khóa/conditional update và khóa idempotency cho quay, nhập mã, sử dụng voucher.
5. Chuyển voucher sang đã dùng và ghi người/thời điểm xác nhận trong cùng giao dịch. Kiểm thử đồng thời từ hai thiết bị: chỉ một xác nhận thành công.
6. Triển khai HTTPS, biến môi trường riêng, sao lưu và kiểm tra phục hồi, ghi lỗi, phân tách môi trường kiểm tra/vận hành. Không đưa khóa bí mật hoặc dữ liệu khách vào GitHub.

## Điều kiện duyệt trước khi mở cho khách

- Chủ quán xác nhận quà thật, tồn kho, hạn dùng, tỷ lệ đủ 100%, cửa hàng áp dụng và điều kiện đổi quà. Giải 5.000.000đ hiện chỉ có hướng dẫn liên hệ cửa hàng, cần bổ sung điều kiện cụ thể hoặc tắt trước khi mở chiến dịch.
- Xác nhận tên miền, logo sáng/tối, nội dung từng theme; kiểm tra iPhone/Android thật, laptop và mạng yếu.
- Kiểm thử API với MariaDB: quà cuối, hết quota, retry mất mạng, ranh giới ngày Việt Nam, voucher hết hạn, hai quầy đổi đồng thời, đổi quyền khi nhân viên đang thao tác.
- Kiểm tra khách không xem được ví người khác; nhân viên chỉ xem không được đổi voucher; thu ngân không truy cập cấu hình; quản trị có thể khóa tài khoản và thu hồi phiên.
- Chạy kiểm tra sao lưu/khôi phục và có phương án quay lại bản trước. Chỉ mở chương trình sau khi các mục trên đạt.

Chi tiết bất biến nghiệp vụ và cấu trúc đề xuất: [ARCHITECTURE.md](ARCHITECTURE.md). Bằng chứng kiểm tra giao diện và mã hiện tại: [VALIDATION.md](VALIDATION.md).
