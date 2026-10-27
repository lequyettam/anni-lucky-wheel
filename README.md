# ANNI COFFEE · Vòng quay may mắn

Bản demo 0.6.2 để duyệt giao diện và quy trình. Quà mẫu không có giá trị sử dụng.

Chơi thử: https://lequyettam.github.io/anni-lucky-wheel/

## Chạy thử

- Mở bản `ANNI-COFFEE-Demo.html` trong Chrome, Edge hoặc Safari. Bản này được sinh tự động từ cùng mã nguồn, không phải một bản code riêng.
- Hoặc phục vụ thư mục `dist` bằng máy chủ tĩnh. Ví dụ: `python3 -m http.server 8080 --directory dist`, rồi mở `http://localhost:8080`.
- Số mẫu: `0900000001`. Mã cấp lượt mẫu: `ANNI2026` (2 lượt, mỗi SĐT 1 lần).
- Trên laptop, nút **Quản trị demo** mở tất cả thiết lập. Trên điện thoại, nhân viên dùng đường dẫn `/#admin` (GitHub Pages: https://lequyettam.github.io/anni-lucky-wheel/#admin). Chưa có xác thực nhân viên thật.

## Nội dung & thương hiệu 0.6

Vào **Quản trị → Nội dung & thương hiệu** (`#admin/content`):

1. Chọn nhóm **Thương hiệu**, **Lời chào theo theme**, **Trang chơi**, **Ví quà**, **Nhận thưởng** hoặc **Thể lệ**.
2. Sửa tên, tên rút gọn, khẩu hiệu; tải ảnh vào **Logo dùng trên nền sáng** và **Logo dùng trên nền tối**. Mỗi ảnh PNG/JPG/WebP tối đa 2 MB, cạnh dài sau xử lý tối đa 512px và dung lượng tối đa 300 KB. Ưu tiên PNG/WebP trong suốt. Logo cũ được giữ ở ô nền sáng. Bấm **Xóa phiên bản này** để bỏ riêng một ảnh.
3. Sửa nội dung và xem trước ngay. Lời chào lưu riêng cho từng theme; chọn theme trong trình biên tập chỉ đổi bản xem trước. Muốn đổi theme đang dùng, vào **Giao diện & chủ đề**.
4. Bấm **Lưu nội dung** để áp dụng. Bản nháp được giữ khi đổi nhóm hoặc chuyển màn hình trong ứng dụng; tải lại/đóng trang sẽ bỏ bản nháp sau cảnh báo của trình duyệt. **Tải bản đang dùng** bỏ các chỉnh sửa chưa lưu.

Logo được chọn theo **nền tại vị trí hiển thị**: đầu trang chơi của theme lễ hội dùng ảnh dành cho nền tối; tâm vòng quay, khu quản trị và voucher vẫn dùng ảnh dành cho nền sáng. Bản xem trước sử dụng cùng quy tắc, kể cả khi tắt hình nền lễ hội. Nếu chỉ có một ảnh, cả hai loại nền dùng chung ảnh đó; hệ thống không tự đổi màu logo. Biểu tượng tab trình duyệt chọn theo chế độ sáng/tối của hệ thống.

Có ít nhất một logo thì **Tên thương hiệu** có thể để trống để chỉ hiện logo. Nếu xóa hết logo, cần nhập tên trước khi lưu. Tên rút gọn có thể giữ để dùng trong lời chào mà không hiện cạnh logo; nếu cả hai tên trống, các biến tên dùng “quán” và lời chào đăng nhập mặc định chuyển thành lời chào trung tính. Tên cạnh logo là 18px trên laptop, 16px trên điện thoại; tên dài tự xuống dòng. Logo giữ tỷ lệ ảnh.

Các nút **Về gốc** bên từng trường, **Về gốc nhóm này**, **Đưa tất cả nội dung về gốc** và **Lấy bản lưu trước** đều đưa nội dung vào bản nháp trước. Kiểm tra rồi bấm **Lưu nội dung**. Hệ thống giữ **một bản lưu trước**, gồm cả hai phiên bản logo; lưu lại bản phục hồi cũng có thể quay lại phiên bản vừa thay thế. Không ảnh hưởng phần thưởng, tỷ lệ, lượt quay, tài khoản hoặc trạng thái voucher.

Biến có sẵn: `{brand}`, `{shortBrand}`, `{customer}`, `{dailyFree}`. Nội dung hỗ trợ chữ và xuống dòng, không chèn mã HTML. Nên dùng tiêu đề ngắn trên điện thoại, tên rút gọn cho tâm vòng quay. Các thông báo trạng thái, lỗi và cảnh báo demo là nội dung hệ thống. Tên/điều kiện/ảnh phần thưởng sửa tại **Phần thưởng**; tên cửa hàng đổi quà tại **Thiết lập**. Điều kiện trên voucher đã cấp giữ nguyên.

Cấu hình chỉ lưu trong trình duyệt hiện tại, đồng bộ giữa các tab cùng nguồn; **chưa áp dụng chung cho thiết bị của khách**. Nếu hai tab sửa cùng lúc, bản cũ bị chặn lưu và cần tải bản đang dùng. Không cần xóa dữ liệu demo cũ để sử dụng tính năng mới.

## Chủ đề lễ hội 0.5

Vào **Quản trị → Giao diện & chủ đề** (`#admin/themes`):

1. Chọn một trong tám chủ đề: **ANNI nguyên bản**, **Halloween**, **Giáng sinh**, **Tết Dương lịch**, **Tết Nguyên đán**, **Ngày Thống nhất 30/4**, **Quốc tế Phụ nữ 8/3**, **Ngày Nhà giáo 20/11**.
2. Xem hình nền, vòng quay và lời chào trong khung điện thoại; bật/tắt **Hiện hình nền minh họa lễ hội**.
3. Bấm **Áp dụng chủ đề** để lưu. **Hủy thay đổi** hoặc rời trang trước khi áp dụng sẽ bỏ bản nháp.
4. Chọn **ANNI nguyên bản** để dùng lại màu phần thưởng đã cấu hình. Chủ đề lễ hội chỉ thay màu hiển thị, không ghi đè màu trong danh mục quà.

Mỗi lễ hội có cảnh minh họa riêng, bảng màu, tiêu đề, vòng quay viền ánh kim, nút quay và thẻ nhận thưởng theo chủ đề. Tết dùng mai, đào, bánh chưng/bánh tét và lì xì; 30/4 dùng cờ đỏ sao vàng và hoa sen; 8/3 là vườn hoa; 20/11 là góc sách tri ân. Hình nền không bắt tương tác. Tên quà, điều kiện, ảnh quà và kết quả vẫn lấy từ dữ liệu động. Ảnh WebP 768×1152 khoảng 88–130 KB mỗi chủ đề; trang chơi chỉ tải cảnh đang dùng, ảnh thẻ quản trị tải lười. Bản HTML đóng gói nhúng toàn bộ ảnh nên dùng được khi không có máy chủ ảnh. Không tự đổi theo lịch; không thay đổi tỷ lệ, tồn quà, lượt quay hoặc voucher đã cấp. Quản trị giữ giao diện trung tính để dễ thao tác.

**Phạm vi demo:** cấu hình lưu trong trình duyệt hiện tại và cập nhật giữa các tab cùng nguồn khi không có thao tác/hộp thoại đang mở. Không áp dụng chung cho điện thoại của khách khác. Cần lưu cấu hình chiến dịch qua máy chủ để đồng bộ toàn bộ thiết bị.

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

- `dist/js/themes.js`: danh mục chủ đề, tương thích cấu hình cũ và bản sao màu hiển thị; không có phụ thuộc DOM.
- `dist/js/content.js`: danh mục nội dung gốc, kiểm tra dữ liệu, biến thương hiệu và tương thích cấu hình cũ.
- `dist/js/content-editor.js`: lớp `ContentEditor` quản lý bản nháp, logo, xem trước và khôi phục.
- `dist/js/domain.js`: các lớp `GameService`, `ProbabilityPolicy`, `MemoryRepository`; hàm thuần kiểm tra dữ liệu, thời gian, tỷ lệ.
- `dist/js/storage.js`: adapter `LocalRepository`, tuần tự hóa thao tác và dùng Web Locks khi trình duyệt hỗ trợ.
- `dist/js/visuals.js`: `WheelRenderer`, `SoundController`, icon và định dạng.
- `dist/js/app.js`: controller giao diện và các màn hình, không tự tính kết quả ngoài `GameService`.
- `tests/`: 53 kiểm thử nghiệp vụ, chủ đề, nội dung, phục hồi và tranh chấp lưu.
- `scripts/package.mjs`: sinh bản HTML độc lập từ các mô-đun.
- `scripts/prepare-pages.mjs`: tạo bản xuất bản `release/pages`, gắn cùng mã phiên bản theo nội dung cho CSS và mọi mô-đun JavaScript để tránh bộ nhớ đệm trộn mã cũ/mới.
- `docs/ARCHITECTURE.md`: định hướng chuyển sang Laravel + MySQL.

Dùng hướng đối tượng ở các thành phần có trách nhiệm/trạng thái; dùng hàm thuần cho tác vụ độc lập, dễ tái sử dụng. Không dùng kế thừa nhiều tầng hoặc một lớp cho mỗi hàm.

## Kiểm tra và đóng gói

Node.js 20 trở lên, không cần cài thư viện JavaScript:

```bash
npm test
npm run build
npm run package
```

## Đưa lên GitHub Pages

1. Tạo repository cho bản demo. Với GitHub Free, repository dùng Pages cần công khai.
2. Đưa toàn bộ mã nguồn vào nhánh `main`.
3. Vào **Settings → Pages → Source: GitHub Actions**.
4. Workflow `.github/workflows/pages.yml` chạy kiểm thử rồi đóng gói và xuất bản thư mục `release/pages`.
5. Mở URL mà bước deploy trả về; không đoán URL nếu repository dùng tên hoặc miền khác.

Chỉ dùng Pages làm bản trình diễn quà mẫu. Bản phục vụ khách thật cần backend và nơi lưu dữ liệu tập trung.

## Tài liệu nền tảng

- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
