# ANNI backend

Laravel 13, PHP >=8.3, MariaDB/InnoDB. Đọc [hướng dẫn VPS/cPanel](../docs/DEPLOY-VPS-MARIADB.md) và [hợp đồng API](../docs/SERVER-API.md) trước khi cài.

DB được cấu hình trong `config/database.php` và `.env` riêng. Không commit `.env`, `vendor`, log, backup hay dữ liệu khách. DocumentRoot chỉ trỏ vào `public/`; chạy `npm run build:server` từ thư mục gốc để sinh frontend.

Khởi tạo: `php artisan migrate --force`, `php artisan anni:install`, `php artisan anni:doctor`. Không có tài khoản mặc định hoặc trang cài đặt công khai. Không dùng `migrate:fresh` trên dữ liệu vận hành.
