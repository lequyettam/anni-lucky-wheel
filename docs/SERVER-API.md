# Hợp đồng backend và dữ liệu · 1.0.0-rc.1

Tài liệu dành cho đội code. Backend nằm trong `server/`, dùng Laravel 13 và MariaDB/InnoDB. Cài đặt: [DEPLOY-VPS-MARIADB.md](DEPLOY-VPS-MARIADB.md). Trạng thái bàn giao: [SERVER-READINESS.md](SERVER-READINESS.md).

## Cấu hình và ranh giới

`server/config/database.php` đọc `DB_*` từ môi trường hoặc `server/.env`. Không có màn hình, API hay bảng quản trị để nhập host/user/password DB. Trình duyệt chỉ gọi `/api` cùng origin; không kết nối trực tiếp MariaDB. Giữ `.env`, mã nguồn PHP, `vendor` và bản sao lưu ngoài mọi DocumentRoot.

`npm run build:server` sinh assets vào `server/public` và view `server/resources/views/app.blade.php`. Build cũng sinh `resources/game` từ schema giao diện và bộ khởi tạo tạm dừng/tồn 0; không ghi DB đã triển khai. View có meta `anni-api=/api`; `App` nhận `ApiRepository`, `ApiGameService`, `ApiStaffService` qua dependency injection. Khi API lỗi, giao diện báo lỗi, không tạo thưởng hoặc chuyển sang dữ liệu localStorage.

Bản `dist/`, GitHub Pages và HTML đóng gói vẫn dùng `LocalRepository`, chỉ để xem/kiểm tra giao diện độc lập. Không nhập tài khoản, lượt hoặc voucher từ trình duyệt vào DB sản xuất. Khách đã dùng bản tĩnh phải tạo ví trên tên miền máy chủ. Không có công cụ tự động di trú localStorage.

## HTTP, phiên và CSRF

- `GET /api/state`: `{ "state": {...}, "csrfToken": "..." }`.
- Các POST dưới đây nhận JSON và trả `{ "result": ..., "state": {...}, "csrfToken": "..." }`.
- Gửi `Accept: application/json`, `Content-Type: application/json`, cookie cùng origin và `X-CSRF-TOKEN` lấy từ state. Laravel kiểm tra CSRF/origin; không tắt middleware để xử lý lỗi 419.
- Cookie phiên mã hóa, HttpOnly, Secure khi production, SameSite=Lax, host-only; phiên và cache lưu DB. Đăng nhập xoay ID phiên; không lưu bearer token hay mật khẩu trong localStorage.
- Phiên nhân viên hết hạn tuyệt đối sau 8 giờ. Phiên khách tối đa 30 ngày, đồng thời chịu thời gian không hoạt động `SESSION_LIFETIME=480` phút và chính sách cookie của trình duyệt. Hai vai trò có thể cùng tồn tại trong một phiên; các tab cùng trình duyệt chia sẻ cookie.
- API state được lọc trên server: khách chỉ nhận ví mình; nhân viên chỉ nhận dữ liệu đúng quyền. `prizes.view` được xem kho mã chưa cấp; `codes.view` được xem mã cấp lượt; `vouchers.view`/`reports.view` được xem voucher và thông tin người nhận. Chỉ `staff.manage` thấy danh sách nhân viên và 500 nhật ký gần nhất. Không trả hash mật khẩu, mã khôi phục hoặc session payload.
- Lỗi: 401 hết/chưa có phiên, 403 thiếu quyền, 404 không tìm thấy/không thuộc ví, 409 xung đột revision hoặc voucher đã dùng, 419 CSRF, 422 đầu vào/nghiệp vụ, 429 giới hạn yêu cầu, 503 chưa cài đặt. 422 có `errors`; frontend hiển thị thông báo, không coi HTTP 200 là kết quả nếu parse JSON thất bại.

## Các thao tác

| Endpoint POST | Nội dung chính | Quyền |
| --- | --- | --- |
| `/api/customer-login` | `phone`, `recovery` tùy chọn, `enrollmentKey` tùy chọn | Công khai, giới hạn tần suất |
| `/api/customer-logout` | `{}` | Xóa phiên khách |
| `/api/customer-name` | `name` | Khách hiện tại |
| `/api/staff-login` | `username`, `password` | Công khai, giới hạn tần suất |
| `/api/staff-logout` | `{}` | Xóa phiên nhân viên |
| `/api/staff-save` | `id` khi sửa, `revision`, `name`, `username`, `role`, `permissions[]`, `active`, `password` | `staff.manage` |
| `/api/staff-password` | `currentPassword`, `password` | Nhân viên đang đăng nhập |
| `/api/spin` | `source`: `free`/`earned`, `requestId` | Khách hiện tại |
| `/api/activate` | `code`, `requestId` | Khách hiện tại |
| `/api/use-voucher` | `code` nội bộ hoặc nhập sẵn | Khách sở hữu voucher |
| `/api/redeem` | `code` nội bộ hoặc nhập sẵn | `vouchers.redeem` |
| `/api/prizes` | `prizes[]`, `revision` = `state.prizesRevision` | `prizes.edit` |
| `/api/settings` | `title`, `branch`, `dailyFree`, `active`, `mode`, `start`, `end` | `settings.edit` |
| `/api/appearance` | `theme`, `decorations` | `themes.edit` |
| `/api/content` | `content`, `revision` = `settings.contentRevision` | `content.edit` |
| `/api/code` | `id` tùy chọn, `code`, `turns`, `maxUses`, `perPhone`, `period`, `creditDays`, `starts`, `ends`, `active`, `branch` | `codes.edit` |

`GET /api/reports/export?q=...&status=all|active|used|expired` yêu cầu `reports.export`, xuất CSV UTF-8 có BOM, trích dẫn ô và chặn tiền tố công thức `= + - @`. `/up` kiểm tra ứng dụng khởi động được, không thay thế `anni:doctor` và giám sát DB.

`source`, `code` là yêu cầu của người dùng; kết quả, user ID, actor, số lượt, giá trị thưởng và thời gian đều do server xác định. Không có POST để ghi nguyên snapshot state hay API khởi tạo quản trị viên công khai.

## Đăng nhập và khôi phục

Số Việt Nam được chuẩn hóa về 10 chữ số, chấp nhận dạng +84. Chưa xác minh sở hữu số bằng OTP theo yêu cầu hiện tại. Đăng ký mới trả mã ngẫu nhiên 128 bit có tiền tố ANNI; mã được cấp ngay khi tạo ví để khách vẫn khôi phục được ngay cả khi chưa trúng quà. Mật khẩu nhân viên và mã khôi phục lưu hash Argon2id. Mật khẩu nhân viên mới tối thiểu 12, tối đa 128 ký tự.

Frontend giữ `enrollmentKey` ngẫu nhiên 256 bit trong sessionStorage trước đăng ký. Để xử lý phản hồi đăng ký bị mất, server giữ bản mã khôi phục **đã mã hóa bằng APP_KEY trong tối đa 5 phút sử dụng**, kèm hash enrollmentKey. Chỉ cùng khóa và trong cửa sổ đó được nhận lại mã; endpoint state không trả khóa/mã. `anni:prune` xóa dữ liệu tạm hết hạn trong đợt chạy hằng ngày. Không có enrollmentKey thì không giữ bản mã tạm. Sau khi người dùng xác nhận đã lưu, giao diện xóa mã khỏi sessionStorage. Không sao chép mã vào nhật ký hoặc Git.

Mất mã và mất phiên không thể khôi phục chỉ bằng số điện thoại. Chưa có luồng cấp lại mã khách; đội vận hành cần xác minh độc lập nếu xây dựng chức năng hỗ trợ sau này. Quản trị viên mất mật khẩu dùng lệnh CLI `anni:staff-password <username>` trên VPS.

Đăng nhập hiện giới hạn 10 yêu cầu / 5 phút theo cả IP và định danh; nhập mã cấp lượt 20 yêu cầu/phút/khách. Đội vận hành cần đánh giá ngưỡng IP nếu nhiều khách dùng chung Wi-Fi/quầy, và cấu hình proxy tin cậy nếu VPS nằm sau reverse proxy. Không tin toàn bộ `X-Forwarded-For` từ Internet.

## Tính nhất quán

`Store::transaction()` khóa hàng chiến dịch `id=1` bằng `FOR UPDATE` trước mọi thay đổi nghiệp vụ và kiểm tra quyền lại trong transaction. Có retry transaction khi deadlock. Bản đọc Snapshot lấy shared lock cùng hàng. V1 chủ động tuần tự hóa thao tác ghi của **một chiến dịch** để tránh vượt kho/quota hoặc ghi quyền cũ; đây không phải thiết kế nhiều chiến dịch hay tải lớn.

- Quay: kiểm tra phiên, tra idempotency, trạng thái chiến dịch, lượt còn lại; tính tỷ lệ và dùng `random_int` trên server; trừ lượt, trừ kho, cấp mã, ghi spin/voucher trong **một transaction**. Nếu không phân bổ được, rollback toàn bộ.
- Tổng tỷ lệ gốc đúng 10.000 basis points = 100%. Chia phần tỷ lệ hết quà đều cho ô còn hiệu lực có tỷ lệ gốc > 100 basis points, kể cả ô may mắn lần sau. Không sửa tỷ lệ gốc.
- Mã nhập sẵn cấp FIFO; số quà bằng số mã chưa cấp. Một quà tối đa 1.000 mã chưa cấp; mã 1–64 ký tự. Kiểm tra trùng không phân biệt hoa/thường trong kho, giữa các quà, mã nội bộ và lịch sử đã cấp. Hiển thị giữ nguyên chữ/số 0 đầu.
- `voucher_keys` là namespace chung. Mã đã cấp không xóa/recycle khi voucher hết hạn/đã dùng hoặc bỏ phần thưởng. Lưu danh mục chỉ thay kho **chưa cấp**, giữ phần thưởng cũ dạng inactive để bảo toàn khóa ngoại.
- Dùng voucher: khóa voucher, kiểm tra đúng ví/quyền, chưa dùng, chưa hết hạn theo giờ server; ghi trạng thái, redemption và audit cùng transaction. Unique `redemptions.voucher_id` là lớp bảo vệ thêm. Hai mã của cùng quà trỏ đến một voucher; không có chức năng phục hồi đã dùng về chưa dùng.
- Sửa quà yêu cầu `prizesRevision`; quay trúng cũng tăng revision để bản nháp cũ không phục hồi tồn/mã. Sửa nội dung dùng revision riêng và lưu một bản trước. Các thiết lập/theme/mã cấp lượt dùng giá trị của lần lưu sau cùng; UI không tự lưu bản nháp.
- Mỗi spin/activation có unique `(customer_id, request_id)`. Frontend giữ request đang chờ trong sessionStorage để gửi lại sau lỗi mạng/reload; không được đổi payload khi chưa đối chiếu. Server trả cùng kết quả với cùng request; dùng request đó cho nguồn/mã khác bị 409. Retry spin không trừ thêm lượt/kho. Không gửi requestId mới khi chưa biết lần trước đã commit hay chưa.
- Snapshot voucher giữ tên, điều kiện, hạn, chi nhánh, mã ngoài và lời hướng dẫn tại lúc cấp. Thay danh mục hoặc thương hiệu không sửa nội dung quyền lợi đã cấp.
- Lưu UTC; ngày cấp lượt miễn phí dùng `Asia/Ho_Chi_Minh`. Khách đang mở trang đồng bộ mỗi 15 giây và khi focus/đổi trang/có mạng; thao tác luôn được xác nhận ngay bởi server. Đây là polling, không phải WebSocket. Không ghi đè bản nháp đang sửa khi polling.

## Các bảng

| Nhóm | Bảng | Mục đích |
| --- | --- | --- |
| Chương trình | `campaigns`, `prizes` | Thiết lập, nội dung/logo/theme, tỷ lệ và tồn |
| Danh tính | `customers`, `staff_accounts` | Ví, hash đăng nhập, quyền và version thu hồi phiên |
| Lượt quay | `turn_codes`, `credits`, `spins` | Mã cấp lượt, quota, kết quả và idempotency |
| Quà | `vouchers`, `voucher_keys`, `redemptions` | Quyền lợi đã cấp, kho mã, sử dụng một lần |
| Vận hành | `audit_logs`, `sessions`, `cache`, `cache_locks` | Nhật ký, phiên, rate limit và khóa phiên |

Ảnh quà/logo được xác thực định dạng PNG/JPG/WebP, dung lượng, pixel và giải mã GD trên server. Lưu dạng data URL trong JSON DB; hiện chưa dùng object storage. Không nhận SVG/HTML/URL ảnh từ endpoint này. Backup DB gồm ảnh/logo; phải sao lưu riêng `.env`/APP_KEY trong kho bí mật để giải mã phiên và dữ liệu đăng ký tạm khi phục hồi.

## Giới hạn và việc đội code tiếp quản

- Một chiến dịch hoạt động. Snapshot hiện tải toàn bộ voucher được phép xem; UI nhân viên hiển thị tối đa 100 kết quả nhưng tìm trên dữ liệu đã tải. Không có phân trang server; báo cáo CSV dựng trong RAM; tổng quan tính phân bố từ lịch sử spin. Trước chiến dịch quy mô lớn, bổ sung phân trang/truy vấn lọc phía DB, tổng hợp báo cáo và load test; không tăng giới hạn PHP vô hạn để che vấn đề.
- Có mã dùng ở app mua hàng không đồng nghĩa đồng bộ app đó. Chưa có API/webhook đối tác; sử dụng ở ANNI không tự vô hiệu hóa trên app mua hàng và ngược lại.
- Mã hóa đơn do quản trị tạo là mã cấp lượt, chưa xác minh hóa đơn POS. Không OTP nên không bảo đảm một người chỉ có một số điện thoại.
- Quyền đọc dữ liệu nhạy cảm được thực thi ở server; audit ứng dụng không phải nhật ký chống sửa bởi người có quyền DB/root.
- Khi mở rộng, giữ transaction/idempotency/unique constraints, kiểm thử song song trước khi tách khóa chiến dịch. Cần thay schema bằng migration mới sau khi đã có dữ liệu; không sửa migration cũ rồi chạy `migrate:fresh` trên production.

## Lệnh phát triển

```bash
# Tại thư mục gốc, Node 22
npm test
npm run build:server
cd server
composer install
composer test                    # SQLite memory mặc định; cần pdo_sqlite
vendor/bin/pint --test
```

Để kiểm thử MariaDB, tạo **DB riêng tên chính xác `anni_game_test`**, user có quyền trên DB này; cấu hình môi trường test (không dùng `.env` production), gồm `APP_ENV=testing`, `DB_CONNECTION=mariadb`, `DB_DATABASE=anni_game_test`, APP_KEY dùng riêng. Xem `.github/workflows/server.yml` cho cấu hình đầy đủ.

```bash
vendor/bin/phpunit
php tests/concurrency.php
```

Concurrency test tạo lại schema DB kiểm thử để kiểm tra 6 khách tranh quà cuối và 2 yêu cầu đổi cùng voucher. Script từ chối chạy nếu tên DB/môi trường không khớp. **Không chạy kiểm thử với user/database production**. Fixture, tài khoản và route hỗ trợ kiểm tra trình duyệt không được đưa vào production.
