# Triển khai ANNI COFFEE trên cPanel

Hướng dẫn hiện hành cho phiên bản Laravel + MariaDB: **[DEPLOY-VPS-MARIADB.md](DEPLOY-VPS-MARIADB.md)**.

Áp dụng cho VPS Contabo/cPanel và tên miền `game.annicoffeecamau.com`. Đội code cấu hình DB bằng `server/.env` hoặc biến môi trường, không qua giao diện quản trị.

Không tải riêng `dist/` lên VPS rồi coi đó là bản đồng bộ. Bản vận hành cần toàn bộ backend, Composer dependencies, migration, APP_KEY, HTTPS và DocumentRoot trỏ vào `server/public` sau `npm run build:server`. Các bước kiểm tra, cron, backup và cập nhật được ghi trong hướng dẫn trên.
