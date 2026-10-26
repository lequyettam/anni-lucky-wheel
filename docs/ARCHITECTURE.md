# Quyết định kiến trúc · ANNI COFFEE Lucky Wheel

## Phạm vi đã thống nhất

Khách chơi trên điện thoại; quản trị chủ yếu trên laptop. V1 dùng quà mẫu và kiểm tra định dạng số điện thoại, chưa OTP. Lượt miễn phí/ngày và mã cấp lượt do quản trị cấu hình. Thu ngân cung cấp mã. Khôi phục bằng số điện thoại + mã khôi phục. Voucher dùng tại cửa hàng.

## Tổ chức code

Ưu tiên composition và dependency injection: GameService nhận repository, clock và random từ bên ngoài. Domain không đọc DOM hoặc localStorage. UI gọi service; repository quản lý commit. ProbabilityPolicy tính trọng số từ tỷ lệ gốc; số nguyên basis points tránh so sánh phần trăm bằng số thập phân không chính xác.

Hướng thủ tục không đồng nghĩa với tái sử dụng bằng hàm. Hàm là công cụ dùng trong cả hướng thủ tục, hướng đối tượng và hướng hàm. Ở dự án này, hàm thuần dành cho validation, định dạng và tính toán; lớp dành cho các đối tượng có trạng thái, phụ thuộc hoặc vòng đời. Không tạo framework hay tầng trừu tượng không cần thiết.

## Các bất biến được kiểm thử

- Tổng tỷ lệ gốc 10000 basis points, mỗi ô 0–10000.
- Quà hết nhận tỷ lệ 0; tổng tỷ lệ gốc của các quà hết được chia đều cho ô còn hiệu lực có tỷ lệ gốc >100 basis points. Ô không trúng tham gia cùng điều kiện và có tồn vô hạn.
- Không có đích phân bổ thì không trừ lượt.
- Tỷ lệ gốc không đổi khi tồn thay đổi. Phân bổ lại luôn tính từ dữ liệu gốc, không cộng dồn sai các lần phân bổ trước.
- Mã cấp lượt có giới hạn toàn bộ và mỗi SĐT tách biệt với số lượt được cấp.
- Mỗi spin có requestId để gửi lại không tạo thêm thưởng.
- Trừ tồn ngay lúc cấp quà; đổi voucher không trừ tồn lần nữa.
- Voucher lưu snapshot tên, điều kiện, hạn dùng và chi nhánh tại lúc cấp.
- Khách tự dùng chỉ được thao tác voucher thuộc ví của mình. Khách và nhân viên cùng gọi một chuyển trạng thái nguyên tử; chỉ một bên thành công, kể cả khi bấm đồng thời. Không ghi đè người/thời gian đã dùng và không trừ tồn thêm khi dùng voucher.
- Voucher đã dùng và lịch sử xác nhận lưu loại người thao tác (khách/nhân viên), định danh khi có, tên và thời gian. Bản ghi 0.1 thiếu loại người thao tác được hiển thị là nhân viên, vẫn giữ trạng thái đã dùng.
- Nhập số điện thoại không chứng minh quyền sở hữu số. Mã khôi phục bảo vệ truy cập ví đã tạo, không thay thế xác thực danh tính.

## Giai đoạn máy chủ: Laravel + MySQL

Tái sử dụng HTML/CSS và renderer vòng quay. Thay các lời gọi service trong controller bằng API client; triển khai nghiệp vụ tương đương ở backend. Không chuyển kết quả ngẫu nhiên hoặc quota ở trình duyệt thành nguồn dữ liệu chính thức.

Các service đề xuất: SpinService, ProbabilityPolicy, CodeActivationService, VoucherService, RecoveryService. Eloquent models: Campaign, Prize, Customer, SpinCredit, AccessCode, CodeActivation, Spin, Voucher, Redemption, StaffUser, AuditEvent. Controllers mỏng, FormRequest kiểm tra đầu vào và Policy phân quyền.

API dự kiến (hợp đồng cần hoàn thiện lúc triển khai):

- POST /api/customer/sessions — mở/khôi phục phiên.
- GET /api/campaign — cấu hình công khai, không lộ kho mã cấp lượt.
- GET /api/me/balance, GET /api/me/vouchers.
- POST /api/me/vouchers/{id}/redeem — xác nhận sử dụng voucher thuộc khách đã đăng nhập; actor được lấy từ session phía máy chủ, không tin userId/role do trình duyệt gửi.
- POST /api/code-activations — kích hoạt mã, giữ quota trong transaction.
- POST /api/spins — idempotency key; chọn kết quả ngẫu nhiên phía máy chủ; giữ tồn và trừ lượt cùng transaction.
- POST /api/staff/redemptions — xác nhận từ danh sách hoặc tra cứu mã; lấy nhân viên từ phiên đã phân quyền. Dùng cùng VoucherService với luồng khách, khóa voucher, kiểm tra hạn và chưa đổi, ghi nguồn/người/chi nhánh trong cùng transaction.
- CRUD /api/admin/prizes, access-codes, campaign; báo cáo và audit.

Dùng khóa hàng hoặc conditional update để tránh vượt tồn khi nhiều người quay. Unique constraints cho mã voucher, requestId theo khách và voucher_id trong redemptions. Với sử dụng voucher, chỉ ghi thành công khi redeemed_at IS NULL và expires_at > thời gian máy chủ; chuyển trạng thái và audit phải cùng transaction. Client tải lại trạng thái từ API khi mở ví/chi tiết hoặc sau xác nhận; có thể dùng polling/SSE để cập nhật thiết bị khác. Sự kiện localStorage trong demo chỉ cập nhật các tab cùng nguồn, không đồng bộ thiết bị. Thời gian máy chủ là nguồn chuẩn, lưu UTC và quy đổi ngày bằng Asia/Ho_Chi_Minh.

Đăng nhập nhân viên thật, cookie HttpOnly/Secure, CSRF, phân quyền admin/thu ngân, rate limit đăng nhập và mã, sao lưu, HTTPS và audit là phần bắt buộc trước khi chạy quà thật. Mã khôi phục tạo ngẫu nhiên đủ mạnh; chỉ trả lúc cấp, lưu hash phía máy chủ; quy trình hỗ trợ khi mất mã cần được chốt. localStorage không phải nguồn quyền truy cập chính thức.

Giới hạn không OTP được giữ theo yêu cầu hiện tại. Khi phát hành thật cần kiểm thử rủi ro dùng số người khác và cấp lại mã dựa vào thông tin không đủ tin cậy; tuyệt đối không reset ví chỉ vì người dùng biết số điện thoại.

## Chuyển đổi dữ liệu

Chỉ chuyển cấu hình chiến dịch và danh mục quà đã duyệt. Không nhập tài khoản, lượt quay hoặc voucher mẫu vào dữ liệu sản xuất. Xác nhận lại giá trị quà và điều kiện, đặc biệt mức giảm 5.000.000đ vốn chỉ là ví dụ.

## Nghiệm thu trước vận hành thật

Kiểm thử tích hợp API với MySQL thật: tranh chấp phần quà cuối, kích hoạt đồng thời mã gần hết quota, retry sau mất mạng, đổi voucher đồng thời tại hai quầy, giới hạn ngày VN và hết hạn. Kiểm tra trên điện thoại thật, điều kiện mạng yếu, quyền truy cập từng vai trò và phục hồi bản sao lưu. Các kiểm thử unit của demo chưa chứng minh an toàn hệ thống nhiều thiết bị.


## Chủ đề giao diện

`settings.appearance = {theme, decorations}` là cấu hình trình bày riêng. `GameService.saveAppearance` kiểm tra ID từ danh mục tĩnh và chỉ ghi trường này trong transaction. `saveSettings` không nhận ghi đè appearance từ bản chụp cấu hình chiến dịch cũ. Dữ liệu chưa có appearance dùng ANNI nguyên bản; không cần reset/migration.

`themes.js` chứa preset và hàm tạo bản sao màu cho renderer. Không đổi dữ liệu prizes, thứ tự ô, trọng số, RNG, stock hoặc snapshot voucher. Admin chọn bản nháp trong controller; chỉ gọi lưu khi áp dụng. Xem trước dùng cùng `WheelRenderer` và bảng token CSS với trang khách. CSS mặc định trong quản trị luôn trung tính; các ô preview tự đặt theme riêng.

Ở bản máy chủ, lưu appearance theo Campaign, trả trong GET /api/campaign, chỉ admin được sửa và ghi audit. Thông báo/poll cấu hình ở client để các thiết bị cập nhật. Không ghi lựa chọn theme của một trình duyệt vào mã nguồn GitHub để giả lập cấu hình chung.
