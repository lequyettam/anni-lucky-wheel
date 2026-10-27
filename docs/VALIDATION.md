# Kiểm tra bản demo 0.7.0

## Nhân viên & phân quyền 0.7.0

- 66 kiểm thử: giữ 53 kiểm thử cũ và thêm 13 trường hợp về khởi tạo tài khoản, quyền mặc định/tùy chỉnh, chặn ghi, thu hồi/hết hạn phiên, mật khẩu, hạn chế đăng nhập, quản trị viên cuối cùng, stale edit, tranh chấp đổi quyền/xác nhận voucher, reset giữ nhân viên và escape dữ liệu.
- Browser QA dùng dữ liệu và phiên mẫu riêng, không nhập tài khoản của chủ website: nhân viên chỉ thấy Voucher; mở trực tiếp Nội dung bị chặn; tìm bằng SĐT và xem chi tiết không có nút xác nhận; thu ngân xác nhận quà mẫu và thấy đúng tên người thao tác, không dùng lại.
- Hai tab thử nghiệm: quản trị đổi thu ngân sang quyền xem khi hộp thoại voucher đang mở ở tab kia; phiên cũ kết thúc, hộp thoại đóng và hiện đăng nhập.
- Quyền xem nội dung tùy chỉnh: chuyển được nhóm/theme xem trước, các trường và nút lưu bị khóa. Trình bày voucher kiểm tra ở 390px và 320px, không cuộn ngang toàn trang tại 320px. Trang quản trị kiểm tra trên laptop.
- `npm run build` tạo asset version cho CSS và toàn bộ chuỗi import; `npm run package` và kiểm tra cú pháp bundle HTML độc lập.
- Mọi tài khoản và voucher của browser QA là fixture tách khỏi dữ liệu demo gốc; các file QA không được đưa vào bản xuất bản.
- Đây vẫn là mô phỏng localStorage, không phải kiểm chứng an toàn xác thực máy chủ hoặc dùng nhiều thiết bị. Đăng ký/đăng nhập/mật khẩu được kiểm thử ở service; browser QA không sử dụng credential thật.

## Hai phiên bản logo 0.6.2

- 53/53 kiểm thử đạt. Sáu kiểm thử bổ sung bao gồm logo cũ, chọn ảnh và dùng chung hai chiều, lưu/tải lại/khôi phục hai ảnh, xóa riêng từng ảnh, validation ảnh nền tối và xử lý tải ảnh đồng thời/hủy kết quả cũ.
- Kiểm thử preview cho cả tám theme, bật/tắt hình nền: đầu trang chọn ảnh theo nền theme, tâm vòng quay luôn chọn ảnh cho nền sáng. Preview ví quà dùng nền sáng.
- Trình duyệt: tải hai PNG trong suốt qua hai file input, kiểm tra thông báo dùng chung khi chỉ tải một ảnh; lưu cả hai với tên trống; áp dụng Halloween và xác nhận header/hub dùng hai ảnh khác nhau. Xóa lần lượt mỗi phiên bản, lưu và kiểm tra ảnh còn lại dùng cho cả hai nền; lấy bản lưu trước phục hồi được cả hai ảnh.
- Kiểm tra iframe 390×740 và 320×568: ảnh tải được, không tràn ngang, chú thích vòng quay ở trên dock. Admin 320px có hai ô tải xếp dọc, không tràn ngang. Chưa kiểm tra trên thiết bị thật.
- Bản HTML độc lập: đầu trang Halloween dùng ảnh nền tối, tâm vòng quay dùng ảnh nền sáng; chuyển sang ví quà đổi về ảnh nền sáng. Các trang QA và ảnh thử không xuất bản.

## Logo và tên thương hiệu 0.6.1

- 47/47 kiểm thử đạt. Ba kiểm thử bổ sung bao gồm lưu/tải lại/khôi phục logo với tên trống, chặn bỏ cả tên lẫn logo và bảo toàn bản đang dùng, tương thích dữ liệu cũ, lời chào trung tính, tên rút gọn và escape nhãn ảnh.
- Kiểm tra trình duyệt: xóa tên khi có logo và lưu thành công; tải lại vẫn chỉ có logo, tiêu đề tab không có dấu phân cách thừa. Bỏ logo khi tên trống bị chặn, logo đang dùng vẫn còn. Lấy bản lưu trước và về toàn bộ nội dung gốc hoạt động.
- Đo tên cạnh logo: 18px trên laptop và 16px trên điện thoại. Kiểm tra iframe 390×740 và 320×568; không tràn ngang, chú thích nằm trên thanh điều khiển. Logo đứng riêng giữ tỷ lệ, không có khung chữ trống. Không kiểm tra trên thiết bị di động thật.
- Bản HTML độc lập mở được với cấu hình chỉ logo. Đóng gói Pages dùng mã phiên bản mới cho tài nguyên; trang chuẩn bị dữ liệu QA không đưa lên GitHub.

## Nội dung & thương hiệu 0.6

- 44/44 kiểm thử tự động đạt. Chín kiểm thử mới bao gồm tương thích nội dung cũ/tám theme, bảo toàn nghiệp vụ, phục hồi qua tải lại repository, tranh chấp revision, bản thiết lập cũ, dữ liệu/logo sai, bản nháp và reset theo phạm vi, escape HTML/biến một lượt, lỗi quota và lưu không thay đổi.
- Kiểm tra trình duyệt: đổi tên/khẩu hiệu, tải logo WebP 768×1152 và thu gọn thành 341×512, sửa lời chào Halloween, lưu và cập nhật trang khách cùng nguồn. Bản nháp/reset chưa lưu không đổi header khách.
- Kiểm tra phục hồi bản lưu trước lấy lại cả tên và logo; đưa tất cả về gốc trả logo chữ/nội dung gốc. Reset một trường giữ thay đổi ở trường khác; reset nhóm ví quà áp dụng đúng phạm vi. Tên ví đã sửa hiển thị ở trang, điều hướng và tiêu đề tab.
- Tên thương hiệu trống bị chặn, hiện thông báo và giữ nội dung đang dùng. Bản nháp giữ nhóm và theme đang chọn sau khi lưu.
- Kiểm tra responsive qua iframe 320×568 và 390×740: không tràn ngang, chú thích vòng quay trên dock; tâm vòng quay co chữ theo kích thước thực. Chưa kiểm tra trực tiếp trên điện thoại thật.
- Bản HTML độc lập được đóng gói từ cùng nguồn, kiểm tra cú pháp và mở trong trình duyệt: trình biên tập tải được, lưu tên rồi khôi phục về ANNI COFFEE thành công. Các trang QA không đưa vào bản triển khai.
- Bản GitHub Pages có mã phiên bản tài nguyên từ nội dung CSS/JS; toàn bộ import dùng chung mã để trình duyệt tải đồng bộ sau khi phát hành.

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
