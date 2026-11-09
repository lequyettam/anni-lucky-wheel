# Bàn giao triển khai ANNI Lucky Wheel · 1.0.0-rc.1

Ngày: 09/11/2026. Đích: VPS Contabo, cPanel, MariaDB và `https://game.annicoffeecamau.com`.

Đây là mã nguồn backend và hướng dẫn để đội code triển khai. Chưa có truy cập VPS, chưa chạy migration hoặc thay DNS trên máy chủ của ANNI. Bản GitHub Pages vẫn là bản giao diện lưu trong trình duyệt; backend phải được triển khai bằng thư mục `server/` theo tài liệu này.

## 1. Cấu trúc và nguyên tắc triển khai

- `dist/`: giao diện dùng chung, giữ theme, thương hiệu, kho mã, voucher và phân quyền.
- `dist/js/api.js`: gọi API cùng tên miền; không chứa mật khẩu database; không tự quyết định kết quả quay khi chạy bản server.
- `server/`: Laravel 13, API, dịch vụ nghiệp vụ, migration, lệnh vận hành và kiểm thử.
- `server/config/database.php`: cấu hình kết nối bằng mã PHP, lấy giá trị từ `.env` của máy chủ.
- `server/.env.example`: mẫu cấu hình, không chứa thông tin kết nối thật.
- `scripts/prepare-server.mjs`: đóng gói giao diện vào `server/public` và tạo view Laravel.
- `server/composer.lock`: khóa phiên bản dependencies; khi triển khai dùng `composer install`, không dùng `composer update`.

Giao diện và API chạy cùng tên miền, ví dụ `/` và `/api/state`. Trình duyệt chỉ kết nối HTTPS đến Laravel; Laravel kết nối MariaDB bằng tài khoản riêng. Không mở cổng database ra Internet để điện thoại kết nối trực tiếp. Không có và không cần màn hình khai báo database trong quản trị.

## 2. Yêu cầu môi trường

| Thành phần | Yêu cầu |
| --- | --- |
| PHP | 8.3 trở lên, CLI và PHP-FPM cùng phiên bản tương thích Laravel 13 |
| PHP extensions | ctype, curl, dom, fileinfo, filter, hash, mbstring, openssl, pcre, PDO, pdo_mysql, session, tokenizer, xml, GD; Phar/Zip cho Composer |
| Mật khẩu | PHP có hỗ trợ Argon2id; kiểm tra bằng `password_algos()` |
| Database | MariaDB, bảng InnoDB, charset utf8mb4; đã kiểm tra với MariaDB 10.11.14 |
| Composer | Composer 2; dùng `composer.lock` của dự án |
| Node.js | Node 22 LTS hoặc phiên bản tương thích; chỉ cần ở máy build, không cần tiến trình Node chạy liên tục |
| Web server | Apache/cPanel với rewrite và PHP-FPM; Document Root chỉ trỏ vào `server/public` |
| Kết nối | HTTPS hợp lệ; PHP được phép kết nối MariaDB nội bộ |
| Quyền thao tác | SSH/Terminal của tài khoản cPanel; đội code có quyền tạo database/user và chỉnh Document Root |

Không cần Redis, queue worker, npm package hay dịch vụ Node dài hạn trong phiên bản này. Session, rate limit và khóa session dùng MariaDB. Đồng bộ giao diện bằng API khi thao tác, khi trở lại tab và polling mỗi 15 giây; không dùng WebSocket.

Trong cPanel, kiểm tra **MultiPHP Manager**, **MultiPHP INI Editor**, **Domains**, **Manage My Databases/MySQL Databases**, **SSL/TLS Status**, **Terminal/SSH Access**. Tên mục có thể khác theo phiên bản/quyền tài khoản. Không nâng PHP toàn bộ VPS nếu website khác đang dùng phiên bản khác.

## 3. Chuẩn bị mã nguồn

Nhận nhánh/commit được bàn giao trong pull request của dự án và chốt commit trước khi nghiệm thu. Ví dụ dưới đây dùng nhánh `feat/mariadb-vps`; thay `CPANEL_USER` và đường dẫn theo tài khoản thực tế.

```bash
mkdir -p /home/CPANEL_USER/apps
cd /home/CPANEL_USER/apps
git clone --branch feat/mariadb-vps https://github.com/lequyettam/anni-lucky-wheel.git
cd anni-lucky-wheel
git rev-parse HEAD
```

Chạy dưới tài khoản cPanel của ứng dụng, không dùng root để chạy Composer hay tạo file runtime. Nếu không dùng Git trên VPS, đội code có thể tải ZIP của đúng commit rồi giải nén vào thư mục ứng dụng; giữ nguyên cấu trúc `dist/`, `scripts/`, `server/`.

## 4. Chọn PHP CLI và cài Composer

Kiểm tra PHP của đúng tên miền và CLI:

```bash
php -v
php -m
command -v composer
```

Nếu PHP mặc định khác PHP-FPM của tên miền, dùng đường dẫn PHP do cPanel cung cấp. Ví dụ EasyApache PHP 8.3 thường ở đường dẫn dưới; chỉ dùng sau khi xác nhận file tồn tại:

```bash
ANNI_PHP=/opt/cpanel/ea-php83/root/usr/bin/php
"$ANNI_PHP" -v
"$ANNI_PHP" -r 'echo implode(", ", password_algos()), PHP_EOL;'
```

Nếu chưa có Composer, làm theo hướng dẫn chính thức tại https://getcomposer.org/download/ và xác minh chữ ký SHA-384 của installer theo trang đó. Cài vào thư mục riêng của tài khoản hoặc để quản trị VPS cài Composer 2 dùng chung. Không chạy một script tải từ nguồn không xác định. cPanel phiên bản mới có thể không cài sẵn Composer.

Trong các lệnh sau, đặt đường dẫn đúng tới `composer.phar` hoặc chương trình Composer PHP:

```bash
ANNI_COMPOSER=/home/CPANEL_USER/bin/composer.phar
"$ANNI_PHP" "$ANNI_COMPOSER" --version
cd /home/CPANEL_USER/apps/anni-lucky-wheel/server
mkdir -p bootstrap/cache storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs
"$ANNI_PHP" "$ANNI_COMPOSER" install --no-dev --prefer-dist --no-interaction --optimize-autoloader
"$ANNI_PHP" "$ANNI_COMPOSER" check-platform-reqs --no-dev
```

Giữ nguyên `composer.lock`. Nếu thiếu extension, bật extension cho đúng PHP trong EasyApache/MultiPHP trước khi cài lại; không dùng `--ignore-platform-reqs` để bỏ qua yêu cầu.

## 5. Tạo database và user riêng

Trong cPanel:

1. Tạo database, ví dụ `cpaneluser_anni_game`.
2. Tạo database user riêng, ví dụ `cpaneluser_anni_game`, mật khẩu ngẫu nhiên mạnh.
3. Gán user vào đúng database. Trong lần cài/migration cần quyền tạo/sửa bảng và index, đọc/ghi dữ liệu. Không cấp quyền trên database của website khác.
4. Ghi nhận đầy đủ tên có tiền tố cPanel. Dùng server address/port thực tế; nếu MariaDB ở cùng VPS, thường là `127.0.0.1:3306` hoặc socket nội bộ.
5. Với hệ thống khác đã có dữ liệu, tạo database mới cho game; không trỏ migration vào database đang vận hành của website bán hàng.

Đội code có thể tách user migration và user runtime sau khi cài. Runtime cần SELECT/INSERT/UPDATE/DELETE trên các bảng game, session và cache; user migration mới cần DDL. Mỗi lần nâng cấp phải dùng user đủ quyền chạy migration rồi trả lại cấu hình runtime.

## 6. Khai báo kết nối bằng `.env`

```bash
cd /home/CPANEL_USER/apps/anni-lucky-wheel/server
cp .env.example .env
chmod 600 .env
```

Sửa `.env` bằng trình soạn thảo trên VPS. Không đưa mật khẩu vào lệnh shell, GitHub, file frontend hoặc cuộc trò chuyện. Ví dụ cấu trúc:

```dotenv
APP_NAME="ANNI Lucky Wheel"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://game.annicoffeecamau.com
APP_KEY=

DB_CONNECTION=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cpaneluser_anni_game
DB_USERNAME=cpaneluser_anni_game
DB_PASSWORD="THAY_BANG_MAT_KHAU_THAT_TREN_VPS"
DB_SOCKET=

SESSION_DRIVER=database
SESSION_LIFETIME=480
SESSION_COOKIE=anni_game_session
SESSION_SECURE_COOKIE=true
CACHE_STORE=database
```

Mật khẩu có ký tự đặc biệt phải được đặt trong dấu nháy đúng cú pháp dotenv. File `.env` nằm **ngoài Document Root của mọi website** trên tài khoản đó. Biến môi trường hệ điều hành cũng có thể được đội code cung cấp thay cho file nếu quy trình vận hành đã có.

Nếu MariaDB ở máy khác: dùng mạng riêng/firewall chỉ cho phép VPS ứng dụng, cấu hình TLS và `MYSQL_ATTR_SSL_CA` tới CA tin cậy. Không tắt xác minh chứng chỉ. Không thêm các trường kết nối này vào quản trị game.

Tạo khóa ứng dụng **một lần**:

```bash
"$ANNI_PHP" artisan key:generate
```

Giữ và sao lưu `APP_KEY` riêng. Không tạo lại khóa mỗi lần cập nhật: khóa dùng mã hóa session và dữ liệu tạm phục hồi đăng ký.

## 7. Build giao diện

Tại thư mục gốc repository:

```bash
cd /home/CPANEL_USER/apps/anni-lucky-wheel
node --version
npm test
npm run build:server
```

Không cần `npm install` vì frontend không có package ngoài. Build tạo `server/public/js`, `server/public/assets`, `server/public/styles.css` và `server/resources/views/app.blade.php`, có mã phiên bản cache thống nhất. Không copy `dist/index.html` thành `server/public/index.html`: file đó có thể khiến Apache bỏ qua Laravel và chạy nhầm bản localStorage.

Nếu VPS không có Node, chạy các lệnh trên tại máy build/CI rồi đưa các file đã build vào đúng vị trí trên VPS. Node không cần tồn tại trên VPS sau khi build.

## 8. Chạy migration và khởi tạo quản trị viên

```bash
cd /home/CPANEL_USER/apps/anni-lucky-wheel/server
"$ANNI_PHP" artisan migrate --force
"$ANNI_PHP" artisan anni:install
```

`anni:install` hỏi tên, tên đăng nhập và mật khẩu ẩn (ít nhất 12 ký tự). Không có mật khẩu mặc định và không có endpoint web công khai để tự nhận quyền quản trị. Lệnh từ chối chạy nếu đã khởi tạo; không ghi đè dữ liệu cũ.

Khởi tạo mới gồm:

- Chiến dịch **tạm dừng**.
- Danh mục tham khảo với tồn quà bằng **0**; cần chủ quán duyệt trước khi bật.
- Không có mã cấp lượt, kho mã có giá trị thật, khách hàng, voucher hoặc nhân viên mẫu.

Không dùng `migrate:fresh`, `db:wipe` hoặc script kiểm thử trên database vận hành. Không nhập tài khoản/mã khôi phục/voucher từ localStorage vào database thật. Đội code có thể chuyển riêng cấu hình thương hiệu và danh mục quà đã duyệt sau khi kiểm tra; kho mã và số tồn cần đối soát trước khi nhập.

## 9. Cấu hình tên miền và Document Root

Trong **cPanel → Domains**, tạo/quản lý `game.annicoffeecamau.com`, không dùng chung Document Root với website chính. Cấu hình ưu tiên:

```text
/home/CPANEL_USER/apps/anni-lucky-wheel/server/public
```

Trỏ bản ghi DNS `game` về IP VPS tại nơi đang quản lý DNS thực sự. Cấp SSL bằng AutoSSL hoặc chứng chỉ sẵn có, xác nhận HTTPS hợp lệ rồi bật chuyển hướng HTTP sang HTTPS cho tên miền game. Chỉ đổi cấu hình PHP-FPM/Document Root của ứng dụng này.

Nếu cPanel giới hạn Document Root trong `public_html`, đội code giữ toàn bộ backend ở thư mục `apps` bên ngoài web, rồi copy **chỉ nội dung `server/public/`** vào `/home/CPANEL_USER/public_html/game/`. File `index.php` tại đó phải trỏ đường dẫn tuyệt đối đến backend, ví dụ:

```php
<?php
define('LARAVEL_START', microtime(true));
$backend = '/home/CPANEL_USER/apps/anni-lucky-wheel/server';
if (file_exists($maintenance = $backend.'/storage/framework/maintenance.php')) require $maintenance;
require $backend.'/vendor/autoload.php';
$app = require $backend.'/bootstrap/app.php';
$app->usePublicPath(__DIR__);
$app->handleRequest(Illuminate\Http\Request::capture());
```

Thư mục public tách riêng cần có `.htaccess`, JS/CSS và ảnh sau mỗi lần build. Không đặt `.env`, `vendor`, `storage`, `tests`, `database` hoặc mã PHP nghiệp vụ trong `public_html/game`. Khi copy release mới, giữ file entrypoint đã chỉnh đường dẫn này. Kiểm tra cả URL tên miền chính để chắc thư mục backend không truy cập được theo đường dẫn khác.

## 10. Quyền thư mục, giới hạn PHP và tối ưu

Chủ sở hữu file là tài khoản cPanel; PHP-FPM của tên miền phải có quyền ghi `storage` và `bootstrap/cache`. Thông thường file 0644, thư mục 0755 và `.env` 0600 là đủ khi PHP-FPM chạy cùng user; dùng 0775 với nhóm riêng nếu cấu hình máy chủ yêu cầu. Không dùng `chmod -R 777`.

Trong MultiPHP INI Editor của đúng domain, đảm bảo `post_max_size` đủ lớn cho JSON chứa ảnh/mã (khuyến nghị 16M), `memory_limit` ít nhất 256M; tránh giới hạn request/body nhỏ hơn ở reverse proxy. Ảnh vẫn bị API kiểm tra định dạng, dung lượng và số pixel. Các phiên bản logo tối đa 300 KB/ảnh sau tối ưu, ảnh quà tối đa 600 KB/ảnh; không nhận SVG.

```bash
cd /home/CPANEL_USER/apps/anni-lucky-wheel/server
"$ANNI_PHP" artisan config:cache
"$ANNI_PHP" artisan route:cache
"$ANNI_PHP" artisan view:cache
"$ANNI_PHP" artisan anni:doctor
```

Sau khi đổi `.env`, chạy lại `config:cache`; không đọc `env()` trực tiếp trong controller/service. Kiểm tra `anni:doctor` thành công; lệnh không in mật khẩu database.

## 11. Cron và sao lưu

Thêm một Cron Job của tài khoản cPanel, chạy mỗi phút:

```cron
* * * * * /opt/cpanel/ea-php83/root/usr/bin/php /home/CPANEL_USER/apps/anni-lucky-wheel/server/artisan schedule:run >> /home/CPANEL_USER/apps/anni-lucky-wheel/server/storage/logs/scheduler.log 2>&1
```

Thay đường dẫn PHP/thư mục theo thực tế. Scheduler dọn session/cache hết hạn và dữ liệu đăng ký tạm; **không xóa voucher, lịch sử cấp mã hoặc nhật ký sử dụng**. Trạng thái hết hạn voucher và lượt quay được tính theo thời gian máy chủ khi đọc/thao tác, không phụ thuộc cron chạy đúng phút. Giới hạn lượt miễn phí tính theo ngày Việt Nam; timestamp lưu UTC.

Thiết lập sao lưu tự động database, `.env`/`APP_KEY`, mã nguồn release và cấu hình ứng dụng. Dữ liệu logo/ảnh đang lưu trong database nên bản sao lưu database chứa cả hình. Giữ bản sao ngoài VPS, hạn chế người đọc và kiểm tra khôi phục vào database riêng trước ngày mở chương trình. Có thể dùng cơ chế backup cPanel; đội code xác nhận bản backup có đủ database mới này.

## 12. Nghiệm thu trên staging và thiết bị thật

Tạo database staging riêng; không chạy kiểm thử phá dữ liệu trên production. Tài liệu API: [SERVER-API.md](SERVER-API.md). Kiểm thử tự động của server chỉ cho phép database `anni_game_test` hoặc SQLite `:memory:`.

```bash
# Máy phát triển/CI với dependencies dev, database kiểm thử riêng.
cd server
composer install
composer test
# Khi đã cấu hình DB_CONNECTION=mariadb, DB_DATABASE=anni_game_test,
# APP_ENV=testing và thông tin kết nối database kiểm thử:
php tests/concurrency.php
```

Đội code xác nhận trên VPS:

1. `/up` trả 200; `/api/state` trả JSON; trang chơi tải JS/CSS/ảnh, không báo lỗi kết nối.
2. Chưa đăng nhập không nhận danh sách khách, mã chưa cấp, tài khoản hoặc mật khẩu.
3. Quản trị sửa theme/logo/nội dung trên laptop; điện thoại khác cập nhật qua API. Bản nháp đang sửa không bị tự ghi đè.
4. Tạo quà, tỷ lệ đúng 100%, nhập 5 mã; 5 lượt trúng nhận 5 mã riêng, tồn về 0 và chia lại tỷ lệ đúng quy tắc.
5. Đăng nhập ví ở điện thoại khác bằng số điện thoại + mã khôi phục thấy cùng voucher. Mã khôi phục được cấp ngay khi tạo ví để tránh ví chưa trúng quà không có cách đăng nhập lại.
6. Khách/thu ngân xác nhận cùng voucher: chỉ một lần thành công; các thiết bị cập nhật trạng thái đã dùng. Kiểm tra cả mã nhập sẵn lẫn mã theo dõi nội bộ.
7. Nhân viên chỉ xem không được xác nhận, sửa quà hoặc xuất báo cáo. Thay quyền/khóa tài khoản chặn thao tác từ phiên cũ.
8. Ngắt mạng sau bấm quay rồi thử lại: không mất thêm lượt hoặc cấp thêm mã. Thử ranh giới 00:00 giờ Việt Nam và voucher hết hạn.
9. CSV đúng khách/mã/trạng thái; quà đã cấp giữ nguyên điều kiện và lời nhắn sau khi sửa danh mục.
10. Đường dẫn `.env`, `/vendor/`, `/storage/`, `/tests/` không tải được qua web; APP_DEBUG=false; cookie HTTPS/HttpOnly; chứng chỉ đúng tên miền.
11. Kiểm tra iPhone/Android và laptop, âm thanh sau chạm, bàn phím nhập mã, màn hình nhỏ và mạng yếu.
12. Khôi phục backup thành công, ghi nhận commit/schema đang chạy. Chủ quán duyệt quà thật và chỉ sau đó bật chiến dịch.

Không có OTP theo phạm vi đã thống nhất: kiểm tra định dạng số điện thoại không chứng minh người dùng sở hữu số đó. Mã khôi phục là bí mật truy cập ví; không cấp lại chỉ vì một người biết số điện thoại. Kết nối trạng thái mã với app mua hàng bên ngoài chưa nằm trong bản này.

## 13. Quy trình cập nhật sau này

1. Chốt commit, chạy test và build trên staging; đọc migration mới.
2. Backup database và cấu hình; ghi nhận commit cũ để quay lại.
3. `php artisan down` khi cập nhật có thay đổi schema hoặc không bảo đảm tương thích.
4. Lấy đúng commit/release; `composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader`.
5. Build/copy frontend, giữ `.env` và `APP_KEY`; chạy `php artisan migrate --force`.
6. Chạy lại `config:cache`, `route:cache`, `view:cache`, `anni:doctor`.
7. `php artisan up`; kiểm tra đăng nhập, cấu hình, vòng quay và ví trên hai thiết bị.

Nếu lỗi, đóng chiến dịch/đưa ứng dụng về maintenance trước khi sửa. Chỉ quay code về commit cũ khi schema vẫn tương thích; migration rollback hoặc phục hồi backup cần đội code đánh giá dữ liệu phát sinh. Không tự chạy `migrate:rollback` trên dữ liệu đang vận hành.

Quên mật khẩu quản trị: người có quyền SSH hợp lệ chạy `php artisan anni:staff-password TEN_DANG_NHAP`; lệnh nhập mật khẩu ẩn và thu hồi phiên cũ. Không có endpoint khôi phục quản trị công khai.

## 14. Lỗi thường gặp

| Lỗi | Kiểm tra |
| --- | --- |
| Trang vẫn chạy localStorage | Có `index.html` ghi đè `index.php`? Đã build:server và dùng view có `anni-api=/api`? |
| 500 | Đọc `storage/logs/laravel.log` trên VPS; PHP CLI/FPM/extensions, APP_KEY, migration, quyền ghi; không bật debug công khai |
| SQLSTATE Access denied | Tên user/database có đúng tiền tố cPanel, user đã gán database, mật khẩu và host đúng |
| Could not find driver | Bật pdo_mysql cho cả PHP-FPM và PHP CLI đang chạy |
| 419 | Tải lại trang; kiểm tra HTTPS, cookie, reverse proxy, origin, domain/path; không tắt CSRF để sửa |
| 403 | Đúng tài khoản/quyền? Quyền máy chủ mới nhất là quyết định cuối cùng |
| 409 khi lưu quà | Tồn/mã thay đổi do lượt quay hoặc tab khác; tải lại bản đang dùng rồi sửa |
| 413/ảnh không lưu | post_max_size, memory_limit và request limit tại proxy; giới hạn ảnh của API vẫn giữ |
| Hết phiên trên trình duyệt khác | Đăng nhập bằng số điện thoại + mã khôi phục hoặc tài khoản nhân viên; không copy session/localStorage |
| Không đồng bộ trạng thái app mua hàng | Cần tích hợp API/webhook của hệ thống đó; import mã không tự tạo kết nối |

## Nguồn kỹ thuật

- Laravel 13 deployment: https://laravel.com/framework/docs/deployment
- Laravel database configuration: https://laravel.com/framework/docs/database
- cPanel Composer: https://docs.cpanel.net/knowledge-base/web-services/how-to-set-up-php-composer/
- cPanel Domains: https://docs.cpanel.net/cpanel/domains/domains/manage-the-domain/
- Composer installation/signature: https://getcomposer.org/download/
