# ANNI COFFEE · Vòng quay may mắn

**1.0.0-rc.1: backend Laravel + MariaDB để đội code triển khai trên VPS riêng.** Giữ giao diện mobile, theme lễ hội, logo sáng/tối, nhân viên và kho mã voucher. Mã nguồn đã kiểm thử trong môi trường riêng; đội code cần cài đặt và nghiệm thu trên VPS trước khi mở chiến dịch thật.

- [Hướng dẫn đầy đủ VPS Contabo / cPanel / MariaDB](docs/DEPLOY-VPS-MARIADB.md)
- [Hợp đồng API, cấu trúc dữ liệu và giới hạn](docs/SERVER-API.md)
- [Trạng thái bàn giao và việc cần nghiệm thu](docs/SERVER-READINESS.md)
- [Kết quả kiểm thử](docs/VALIDATION.md)

## Chạy bản đồng bộ trên VPS

PHP >=8.3, Composer 2, MariaDB/InnoDB, HTTPS; Node 22 chỉ cần lúc build. Đội code cấu hình kết nối tại `server/config/database.php` và `.env` riêng trên máy chủ. **Không có màn hình khai báo database trong quản trị.**

```bash
# Thư mục gốc dự án
npm test
npm run build:server
cd server
mkdir -p bootstrap/cache storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs
composer install --no-dev --prefer-dist --optimize-autoloader
cp .env.example .env
# Sửa .env riêng trên VPS trước các lệnh sau
php artisan key:generate
php artisan migrate --force
php artisan anni:install
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan anni:doctor
```

Đây là tóm tắt, **đọc hướng dẫn cPanel trước khi chạy**. DocumentRoot phải là `server/public`, không phải gốc repository. `.env`, vendor và backup phải nằm ngoài web. Bản cài mới tạm dừng, tồn quà 0, không có khách hay mã mẫu. Không chạy `migrate:fresh` trên DB vận hành.

## Tính năng

- Vòng quay phù hợp điện thoại, âm thanh, hiệu ứng chúc mừng, giảm chuyển động theo hệ điều hành; quản trị trên laptop.
- Lượt miễn phí theo số điện thoại/ngày Việt Nam; mã do quản trị cấp có hạn, quota tổng, quota mỗi số và số lượt nhận.
- Quà có ảnh, nội dung, điều kiện, hạn sử dụng, tồn và tỷ lệ; chế độ chia đều hoặc theo trọng số. Tổng tỷ lệ gốc bắt buộc 100%; phần hết quà chia cho ô còn hiệu lực có tỷ lệ gốc >1%, kể cả ô may mắn lần sau.
- Ví quà bằng số điện thoại + mã khôi phục; khách và thu ngân cùng xác nhận một trạng thái sử dụng duy nhất, lưu nguồn/người/thời gian. Quà hết hạn hoặc đã dùng không dùng lại.
- Mã voucher nhập sẵn từng quà, FIFO, không cấp trùng; nội dung hướng dẫn thay biến theo mã được cấp. Điều kiện/mã/lời hướng dẫn của voucher cũ giữ nguyên khi sửa danh mục.
- Tám theme: ANNI, Halloween, Giáng sinh, Tết Dương lịch, Tết Nguyên đán, 30/4, 8/3, 20/11; minh họa và lời chào riêng.
- Sửa/khôi phục nội dung thương hiệu, tên, logo nền sáng/nền tối; chỉ một logo thì dùng cho cả hai, có logo thì tên có thể để trống. Giữ một bản nội dung trước.
- Nhân viên chỉ xem voucher, thu ngân hoặc quản trị; cấp quyền xem/chỉnh sửa theo mục, tách quyền đổi voucher và xuất báo cáo. Server kiểm tra quyền từng thao tác, không chỉ ẩn menu.
- Báo cáo lọc/tìm và xuất CSV, audit, thu hồi phiên khi đổi mật khẩu/quyền hoặc khóa nhân viên; không khóa quản trị viên hoạt động cuối cùng.

## Nhập kho mã nhận quà

1. Vào **Quản trị → Phần thưởng → Chỉnh phần thưởng**, chọn **Dùng mã voucher nhập sẵn**.
2. Dán danh sách `AU79j090, SI9806, Q0O808, SA92U0, GA9H00` hoặc nhập TXT/CSV UTF-8 không tiêu đề. Mã giữ chữ hoa/thường và số 0 đầu; kiểm tra trùng không phân biệt hoa/thường.
3. Số quà tự bằng số mã chưa cấp. Nhập 5 mã nghĩa là 5 phần quà; có thể bổ sung về sau. Mỗi loại tối đa 1.000 mã chưa cấp, mã dài 1–64 ký tự chữ/số/`.`/`_`/`-`, tệp tối đa 100 KB.
4. Nhập lời hướng dẫn tùy chọn: `Vui lòng sử dụng mã Voucher #mã tại quầy hoặc app mua hàng`. `#mã` hoặc `{code}` thay bằng mã đã cấp; để trống thì không hiển thị.
5. Bấm **Áp dụng vào bản nháp → Lưu phần thưởng**. Tổng tỷ lệ phải đúng 100%. Bản nháp cũ bị chặn nếu tồn/mã thay đổi; hủy thay đổi và tải lại trước khi sửa.

Mã đã cấp không thể nhập lại, kể cả voucher hết hạn/đã dùng hoặc quà bị bỏ. Mã theo dõi `AC-…` và mã nhập sẵn tra về cùng voucher. Cấp mã dùng trên app mua hàng **chưa đồng bộ trạng thái với app đó**; mã phải được tạo/hợp lệ ở hệ thống đối tác trước.

## Nhân viên, nội dung và đổi voucher

- Quản trị viên đầu tiên được tạo bằng `php artisan anni:install` trên máy chủ, không có mật khẩu mặc định. Sau đó vào **Nhân viên & phân quyền** để thêm/sửa/khóa nhân viên. Mật khẩu mới tối thiểu 12 ký tự. Quên mật khẩu quản trị dùng lệnh CLI trong hướng dẫn VPS.
- Nhân viên chỉ xem được tìm theo tên/SĐT/mã và xem chi tiết; thu ngân có thêm xác nhận đã dùng, không được sửa quyền lợi/hạn hoặc phục hồi voucher.
- **Nội dung & thương hiệu** có nhóm thương hiệu, lời chào theo theme, trang chơi, ví, nhận thưởng và thể lệ. Các nút khôi phục đưa nội dung vào bản nháp; bấm lưu mới áp dụng. Biến: `{brand}`, `{shortBrand}`, `{customer}`, `{dailyFree}`; không chèn HTML.
- Logo nhận PNG/JPG/WebP tối đa 2 MB đầu vào, tối ưu còn tối đa 300 KB/ảnh; phiên bản sáng/tối chọn theo nền tại vị trí hiển thị. Tên cạnh logo gọn và tự xuống dòng; ảnh giữ tỷ lệ.
- **Giao diện & chủ đề** chọn theme, xem trước, bật/tắt hình nền rồi áp dụng. Không thay tỷ lệ, tồn hoặc quyền lợi voucher.
- Khách vào **Quà của tôi → Sử dụng voucher → Xác nhận sử dụng** tại quầy. Thu ngân dùng **Voucher → Đánh dấu đã sử dụng** hoặc tra mã ở **Đổi voucher**. API kiểm tra cùng trạng thái trong transaction; hai yêu cầu đồng thời chỉ một yêu cầu thành công.

Trên VPS, các thiết bị dùng chung MariaDB. Thao tác nhận kết quả ngay; thiết bị khác cập nhật khi mở lại trang/tab hoặc polling 15 giây. Không cấp thưởng offline. Mã khôi phục cấp ngay khi tạo ví, cần lưu riêng; chưa có OTP theo yêu cầu hiện tại.

## Bản giao diện độc lập

GitHub Pages: https://lequyettam.github.io/anni-lucky-wheel/ vẫn dùng localStorage, không đồng bộ với VPS. `npm run build` tạo Pages; `npm run package` tạo HTML độc lập từ cùng nguồn. Có thể phục vụ `dist/` bằng máy chủ tĩnh để xem giao diện. Những bản này không có backend hay bảo mật nhiều thiết bị; dữ liệu trình duyệt cũ không tự nhập vào MariaDB.

## Cấu trúc và phát triển

- `dist/js/app.js`: controller giao diện, nhận service qua dependency injection.
- `dist/js/api.js`: adapter API cùng origin, CSRF, giữ request đang chờ để retry không cấp trùng.
- `dist/js/domain.js`, `storage.js`: nghiệp vụ/repository cho bản tĩnh.
- `dist/js/themes.js`, `content.js`, `content-editor.js`: theme, thương hiệu, logo và bản nháp.
- `dist/js/access-policy.js`, `staff.js`, `staff-ui.js`: quyền và giao diện nhân viên.
- `dist/js/reward-codes.js`, `reward-code-ui.js`: parser, kho mã và hiển thị mã quà.
- `server/app/Domain`: IdentityService, GameService, CampaignService, Probability, Snapshot, Access, Validation và Store.
- `server/database/migrations`: schema, khóa ngoại và unique constraints.
- `server/app/Console/Commands`: cài đặt, chẩn đoán, dọn phiên và đặt lại mật khẩu qua CLI.
- `tests/`, `server/tests/`: kiểm thử frontend/domain/API và tranh chấp MariaDB.
- `.github/workflows/server.yml`: CI trên MariaDB tách biệt; không tự triển khai VPS.

Luồng quà: server xác thực → khóa transaction → trừ lượt/kho, cấp mã → commit → trình duyệt diễn hoạt. Chạy `npm test`; backend dùng `composer test`, định dạng bằng `vendor/bin/pint --test`. Các kiểm thử DB chỉ dùng `anni_game_test`, không dùng user/database sản xuất.

Chưa tích hợp POS/app mua hàng. Một chiến dịch; snapshot/báo cáo hiện chưa phân trang server, cần đo tải theo lượng khách dự kiến. Xem [SERVER-API.md](docs/SERVER-API.md) và [ARCHITECTURE.md](docs/ARCHITECTURE.md).
