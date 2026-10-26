# ANNI COFFEE · Vòng quay may mắn

Bản demo 0.3 để duyệt giao diện và quy trình. Quà mẫu không có giá trị sử dụng.

Chơi thử: https://lequyettam.github.io/anni-lucky-wheel/

## Chạy thử

- Mở bản `ANNI-COFFEE-Demo.html` trong Chrome, Edge hoặc Safari. Bản này được sinh tự động từ cùng mã nguồn, không phải một bản code riêng.
- Hoặc phục vụ thư mục `dist` bằng máy chủ tĩnh. Ví dụ: `python3 -m http.server 8080 --directory dist`, rồi mở `http://localhost:8080`.
- Số mẫu: `0900000001`. Mã cấp lượt mẫu: `ANNI2026` (2 lượt, mỗi SĐT 1 lần).
- Trên laptop, nút **Quản trị demo** mở tất cả thiết lập. Trên điện thoại, nhân viên dùng đường dẫn `/#admin` (GitHub Pages: https://lequyettam.github.io/anni-lucky-wheel/#admin). Chưa có xác thực nhân viên thật.

## Giao diện mobile 0.3

- Mở trang là thấy vòng quay với tiêu đề gọn; ẩn phần giới thiệu dài và thẻ lượt quay trùng thao tác trên màn hình rộng tối đa 800px.
- Thanh dưới có một nút quay, số lượt của nguồn đang chọn và nút **Nhập mã** có nhãn rõ ràng. Có cả hai nguồn thì hiện hai nút chọn; nguồn đang chọn hết lượt thì tự chọn nguồn còn lượt, không tự tiêu hao lượt.
- Hết lượt hoặc tạm dừng: nút quay bị khóa, vẫn nhập mã được. Khách có thể mở **Vòng quay / Quà của tôi / Thể lệ / Tài khoản** từ điều hướng dưới.
- Kích thước vòng quay và khoảng trống dưới nội dung dựa trên chiều cao màn hình, chiều cao thực của thanh điều khiển và vùng an toàn thiết bị. Màn hình quá thấp vẫn cho cuộn nội dung.
- Quà mẫu nằm phía dưới màn hình chơi; nhãn trang trí không che các ô thưởng. Giao diện laptop giữ bố cục đầy đủ.

## Tính năng

- Vòng quay responsive, âm thanh tổng hợp, hiệu ứng chúc mừng, tắt âm và giảm chuyển động theo hệ điều hành.
- Số lượt miễn phí hằng ngày; reset theo giờ Việt Nam.
- Nhiều mã do quản trị tạo: hạn mã, giới hạn tổng, mỗi SĐT theo ngày/toàn kỳ, lượt mỗi lần và hạn dùng lượt.
- Quà có tên, tên ngắn, ảnh, màu, biểu tượng, điều kiện, hạn dùng, tồn kho, tỷ lệ.
- Tổng tỷ lệ gốc đúng 100%; chia lại phần hết hàng cho các ô còn hiệu lực có tỷ lệ gốc > 1%, bao gồm ô không trúng. 0% bị tắt.
- Chế độ chia đều hoặc ngẫu nhiên có trọng số; nếu không phân bổ được thì tạm dừng và không mất lượt.
- Ví voucher, lưu tên, mã khôi phục; khách tự xác nhận sử dụng tại quầy; nhân viên có thể đánh dấu trực tiếp trong danh sách trúng hoặc tra cứu mã.
- Hai cách xác nhận dùng chung trạng thái: chỉ chuyển một lần sang “Đã sử dụng”, lưu người xác nhận, nguồn khách/nhân viên và thời gian; báo cáo có lọc và xuất CSV.
- Giữ nguyên điều kiện voucher đã cấp khi sửa danh mục quà.

## Giới hạn demo

Dữ liệu lưu trong `localStorage` của trình duyệt, không phải máy chủ. Điện thoại và laptop không chia sẻ dữ liệu; mã khôi phục không thể khôi phục sau khi xóa dữ liệu trình duyệt. Code phía khách và quản trị demo có thể bị sửa. Không dùng để trao quà thật hay thu thập thông tin thật.

Mã chi nhánh trên mã cấp lượt hiện là nhãn đối soát, không xác minh hóa đơn hay vị trí cửa hàng. Tài khoản hiện chưa OTP. Voucher dùng mã văn bản tại quầy; camera quét QR sẽ bổ sung khi triển khai máy chủ.

Kho lưu trữ và lịch sử Git không chứa dữ liệu người chơi, mã khôi phục hay phiên đăng nhập. Google Fonts là tùy chọn trang trí; nếu không tải được, app dùng font hệ thống.

## Thử sử dụng voucher

1. Khách vào **Quà của tôi → Sử dụng voucher**, kiểm tra điều kiện, bấm **Xác nhận sử dụng** tại quầy. Bấm **Để sau** sẽ giữ nguyên voucher.
2. Voucher chuyển sang **Đã sử dụng**, hiển thị thời gian và người xác nhận; không còn nút dùng lại. Voucher hết hạn không thể sử dụng.
3. Nếu khách quên bấm: nhân viên vào **Quản trị → Danh sách trúng → Đánh dấu đã sử dụng** ngay trên dòng voucher, kiểm tra khách/mã/quà rồi xác nhận. Hoặc nhập mã ở **Đổi voucher**.
4. Trên cùng trình duyệt, khách và nhân viên dùng chung dữ liệu; các tab cùng nguồn cập nhật trạng thái qua sự kiện lưu trữ. Dữ liệu đã lưu từ bản 0.1 vẫn dùng được.

Để điện thoại khách và laptop thu ngân cùng biết voucher đã dùng, cần triển khai máy chủ và cơ sở dữ liệu chung. Bản GitHub Pages chưa làm được việc đó; chống dùng lại trong demo chỉ có hiệu lực trong dữ liệu của trình duyệt hiện tại.

## Kiến trúc

- `dist/js/domain.js`: các lớp `GameService`, `ProbabilityPolicy`, `MemoryRepository`; hàm thuần kiểm tra dữ liệu, thời gian, tỷ lệ.
- `dist/js/storage.js`: adapter `LocalRepository`, tuần tự hóa thao tác và dùng Web Locks khi trình duyệt hỗ trợ.
- `dist/js/visuals.js`: `WheelRenderer`, `SoundController`, icon và định dạng.
- `dist/js/app.js`: controller giao diện và các màn hình, không tự tính kết quả ngoài `GameService`.
- `tests/domain.test.mjs`: kiểm thử nghiệp vụ.
- `scripts/package.mjs`: sinh bản HTML độc lập từ các mô-đun.
- `docs/ARCHITECTURE.md`: định hướng chuyển sang Laravel + MySQL.

Dùng hướng đối tượng ở các thành phần có trách nhiệm/trạng thái; dùng hàm thuần cho tác vụ độc lập, dễ tái sử dụng. Không dùng kế thừa nhiều tầng hoặc một lớp cho mỗi hàm.

## Kiểm tra và đóng gói

Node.js 20 trở lên, không cần cài thư viện JavaScript:

```bash
npm test
npm run package
```

## Đưa lên GitHub Pages

1. Tạo repository cho bản demo. Với GitHub Free, repository dùng Pages cần công khai.
2. Đưa toàn bộ mã nguồn vào nhánh `main`.
3. Vào **Settings → Pages → Source: GitHub Actions**.
4. Workflow `.github/workflows/pages.yml` chạy kiểm thử rồi xuất bản thư mục `dist`.
5. Mở URL mà bước deploy trả về; không đoán URL nếu repository dùng tên hoặc miền khác.

Chỉ dùng Pages làm bản trình diễn quà mẫu. Bản phục vụ khách thật cần backend và nơi lưu dữ liệu tập trung.

## Tài liệu nền tảng

- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
