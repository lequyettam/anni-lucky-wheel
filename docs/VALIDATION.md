# Kiểm tra bản demo 0.4

## Cập nhật lễ hội 0.5

- 35/35 kiểm thử nghiệp vụ đạt; vòng lặp catalog kiểm tra tất cả tám theme giữ nguyên lượt, quà, voucher, lịch sử và thứ tự 2–12 ô.
- Kiểm tra quản trị: tám thẻ có hình minh họa, preview bản nháp, áp dụng, bật/tắt hình nền; thay đổi đã lưu cập nhật tab chơi cùng nguồn.
- Kiểm tra thực tế trong iframe 320×568, 360×640, 390×740 và 412×760. Cả hai nguồn lượt vẫn có chỗ; đã sửa khoảng trống ở màn hình thấp để chú thích nằm trên dock. Đã xem từng cảnh Halloween, Giáng sinh, năm mới, Tết, 30/4, 8/3, 20/11.
- Quay thật ở giao diện Tết: dừng đúng ô giảm 10%, hiện thẻ nhận thưởng có cảnh Tết và nội dung voucher động, mở ví thấy voucher. Thông tin khôi phục và luồng lưu tên giữ nguyên.
- Bản HTML độc lập mở thành công trong trình duyệt; ảnh lấy từ data URL nhúng và giải mã đủ 768×1152. Kiểm tra giao diện chơi laptop; sửa độ tương phản nút tài khoản trên nền tối.
- Giới hạn: đây là kiểm tra trình duyệt/iframe, chưa phải kiểm tra iPhone hoặc Android thật; demo vẫn lưu dữ liệu cục bộ.


Ngày: 26/10/2026.

## Chủ đề theo mùa 0.4

- 35/35 kiểm thử đạt. Năm kiểm thử bổ sung: cấu hình cũ/ID không biết dùng ANNI mặc định mà không sửa dữ liệu; áp dụng và tải lại cả bốn theme không đổi tồn/quota/voucher/lịch sử dùng; đầu vào sai không ghi dữ liệu; lưu thiết lập chiến dịch cũ không ghi đè theme mới; bảng màu 2–12 ô giữ thứ tự và toàn bộ trường nghiệp vụ, trả lại màu tùy chỉnh khi chọn ANNI.
- Kiểm tra quản trị desktop: bốn thẻ theme, xem trước chưa áp dụng, hủy bản nháp, bật/tắt họa tiết, áp dụng và tải lại vẫn giữ theme/tùy chọn. Khi thử Giáng sinh ở bản nháp, tab khách vẫn dùng Halloween cho đến khi bấm áp dụng.
- Kiểm tra giao diện khách bằng iframe 390×740 và 320×568, giữ hai nguồn lượt để kiểm tra chiều cao thanh dưới. Theo dõi đổi theme giữa hai tab cùng nguồn; nội dung, màu và họa tiết cập nhật. Không tràn ngang, vòng quay và chú thích không bị thanh dưới che.
- Đóng gói bản HTML độc lập từ cùng nguồn, kiểm tra cú pháp và chạy trong trình duyệt. Các trang phục vụ QA được loại khỏi `dist` trước triển khai.
- Họa tiết là SVG tĩnh; hiệu ứng trúng thưởng giữ tùy chọn giảm chuyển động của hệ điều hành. Chưa kiểm tra trên thiết bị di động thật.

## Cập nhật mobile 0.3

- Kiểm tra bằng khung trình duyệt cùng nguồn ở 320×568, 360×640, 390×740, 412×760 và 768×1024: không tràn ngang, thẻ thao tác lớn ẩn, vòng quay và dòng chú thích nằm trên thanh điều khiển; không còn nhãn đè lên ô thưởng. Đối chiếu bố cục desktop 1363px vẫn đầy đủ.
- Thử chọn lượt hóa đơn khi có cả hai nguồn, quay một lượt mẫu: chỉ số lượt hóa đơn giảm 2 → 1, lượt miễn phí giữ 1. Khi chỉ còn hóa đơn, tự chọn hóa đơn và ẩn nhóm chọn nguồn.
- Hết lượt: nút quay khóa, nhập mã ANNI2026 từ nút mobile vẫn cộng 2 lượt và mở lại nút quay. Chiến dịch tạm dừng: hiển thị trạng thái và khóa quay.
- Kiểm tra điều hướng Vòng quay / Quà của tôi / Thể lệ / Tài khoản; các hộp thoại dùng lại luồng hiện có.
- 30/30 kiểm thử nghiệp vụ đạt; kiểm tra cú pháp mô-đun và bản HTML đóng gói đạt. Trang tạo dữ liệu QA chỉ dùng cục bộ, không đưa vào bản triển khai.
- Kiểm tra responsive qua iframe, chưa kiểm tra trực tiếp trên iPhone/Android thật hoặc bàn phím ảo của thiết bị. Chưa xác nhận hành vi vùng an toàn trên thiết bị có tai thỏ.

## Cập nhật sử dụng voucher 0.2

- 30/30 kiểm thử nghiệp vụ tự động đạt (`npm test`). Bảy kiểm thử mới bao gồm: khách dùng voucher thuộc ví, chặn dùng lại từ cả hai luồng, khách chưa đăng nhập/sai chủ sở hữu, hết hạn đúng thời điểm, khách và thu ngân xác nhận đồng thời theo cả hai thứ tự, lưu trạng thái qua lần nạp repository và tương thích voucher đã dùng từ bản 0.1.
- Kiểm tra giao diện 390px qua iframe cùng nguồn: nút Sử dụng voucher, hộp xác nhận, Để sau giữ nguyên trạng thái, xác nhận chuyển sang nhóm Đã sử dụng, biên nhận ghi người/thời gian, nút dùng lại bị khóa, voucher hết hạn bị khóa. Đây chưa phải kiểm thử iPhone/Android thật.
- Kiểm tra quản trị desktop: đánh dấu trực tiếp từ dòng voucher trong Danh sách trúng; hiển thị phân biệt khách tự xác nhận/nhân viên xác nhận; bấm mã để tra cứu tại quầy và thấy trạng thái đã dùng.
- Kiểm tra hai tab cùng trình duyệt: khi hộp xác nhận của khách đang mở, thu ngân dùng voucher ở tab quản trị; hộp khách tự cập nhật thành đã dùng và mất nút xác nhận. Tải lại trang vẫn giữ trạng thái.
- Kiểm tra cú pháp mô-đun và gói HTML độc lập sinh từ cùng nguồn (`npm run package`, `node --check release/bundle-check.js`). Trang chuẩn bị dữ liệu QA được loại khỏi mã nguồn xuất bản.

## Kiểm tra nền tảng đã hoàn tất ở 0.1

Số điện thoại, tổng/độ chính xác tỷ lệ, phân bổ hết quà và ngưỡng >1%, ô 0%, chọn đều, biên ngẫu nhiên, quota miễn phí/mã, ngày Việt Nam, hết hạn lượt, idempotency, tranh chấp tồn/quota trong repository mô phỏng, khôi phục và snapshot quyền lợi. Kiểm tra giao diện quay, cấp lượt bằng ANNI2026, lưu tên/khôi phục ví, chặn tổng tỷ lệ sai. Bản 0.1 đã xuất bản thành công qua GitHub Actions.

## Giới hạn

Chưa có backend, MySQL hoặc dữ liệu dùng chung nhiều thiết bị; quản trị là giao diện mô phỏng mở. Chống dùng lại ở bản demo chỉ áp dụng trong dữ liệu của trình duyệt. Các kiểm thử này không chứng minh an toàn khi vận hành quà thật. Chưa có OTP hoặc camera quét QR; thu ngân nhập mã voucher.
