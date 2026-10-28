# Triển khai ANNI Lucky Wheel trên Contabo + cPanel

Ngày chuẩn bị: 28/10/2026. Đây là hồ sơ triển khai, chưa phải xác nhận máy chủ đã sẵn sàng hoặc backend đã hoàn tất.

## Thông tin chủ ứng dụng đã xác nhận

| Hạng mục | Giá trị |
| --- | --- |
| Hạ tầng | VPS Contabo |
| Bảng điều khiển | cPanel |
| Tên miền ứng dụng | game.annicoffeecamau.com |
| Mã nguồn | lequyettam/anni-lucky-wheel |
| Phiên bản giao diện | 0.8.0 |
| Hướng backend | Laravel; cơ sở dữ liệu quan hệ dùng chung, ưu tiên MariaDB |

Tên miền ở trên là đích do chủ ứng dụng chọn. Chưa kiểm tra DNS, chứng chỉ, tài nguyên, hệ điều hành hoặc cấu hình cPanel thực tế; chưa có truy cập VPS. Nếu máy chủ đang dùng MySQL, cần kiểm tra tương thích trước, không thay hệ quản trị cơ sở dữ liệu chỉ để khớp tên công nghệ.

## Kiểm tra trước khi chọn cấu hình

1. Trong **MultiPHP Manager**, xem phiên bản PHP đang có và phiên bản gán cho tên miền game nếu đã tạo. Laravel 13 hỗ trợ PHP 8.3–8.5. PHP chạy website và PHP chạy Composer/Artisan ở Terminal đều cần tương thích.
2. Trong **Advanced**, kiểm tra có **Terminal** hoặc SSH được cấp cho tài khoản cPanel không. Ghi nhận có Composer hay chưa; không cài hay nâng cấp toàn VPS trong bước kiểm tra.
3. Xem loại/phiên bản máy chủ cơ sở dữ liệu ở **Server Information** hoặc trang chủ **phpMyAdmin**. Không nhầm phiên bản chương trình mysql client với phiên bản database server.
4. Trong **Domains**, xem tên miền game đã tồn tại chưa và Document Root hiện tại. Kiểm tra website khác đang dùng cùng tài khoản/thư mục hay không.
5. Xác định nơi quản lý DNS thực sự (cPanel, Cloudflare hoặc nhà cung cấp tên miền), dung lượng trống và khả năng cấp HTTPS. Không yêu cầu gửi mật khẩu, khóa SSH, file .env hoặc dữ liệu khách qua cuộc trò chuyện.

Gửi thông tin hoặc ảnh đúng các mục trên là đủ cho bước xác định môi trường; che thông tin tài khoản không cần thiết.

## Cấu trúc triển khai dự kiến

| Thành phần | Vị trí hoặc quy tắc |
| --- | --- |
| Giao diện + API | Cùng tên miền game.annicoffeecamau.com |
| Mã Laravel | Một thư mục riêng của tài khoản cPanel |
| Document Root | Chỉ thư mục `public` của ứng dụng |
| Cấu hình bí mật | `.env` nằm ngoài mọi thư mục web có thể truy cập |
| Database | Database và user riêng cho game; không dùng tài khoản database của website khác |
| Phiên đăng nhập | Cookie HTTPS, HttpOnly; phạm vi tên miền game |
| Dữ liệu vận hành | Lưu trên database, không lấy localStorage làm nguồn chính thức |
| GitHub Pages | Giữ bản giao diện hiện có trong thời gian xây dựng backend |

Đường dẫn thật cần lấy từ cPanel. Không tự đặt `/home/username/...` như đường dẫn đã tồn tại. Nếu cPanel giới hạn Document Root trong `public_html`, cần thiết kế cách đặt phần public và phần ứng dụng riêng theo giới hạn đó, tránh để mã Laravel hoặc `.env` truy cập được qua tên miền chính. Không đưa toàn bộ dự án vào thư mục web rồi chỉ dựa vào tên file ẩn để bảo vệ cấu hình.

Không chọn **Share document root** với website chính. Cấu hình PHP chỉ cho tên miền game; không đổi PHP mặc định hoặc thư mục của website khác. Chỉ thêm/chỉnh bản ghi DNS dành cho game sau khi xác nhận địa chỉ đích và bản ghi hiện hữu.

## Thứ tự thực hiện

1. Xác minh môi trường ở trên, chốt phiên bản PHP/database và cách triển khai qua cPanel.
2. Xây dựng backend theo [ARCHITECTURE.md](ARCHITECTURE.md): khách hàng, mã khôi phục, nhân viên/phân quyền, chiến dịch, lượt quay, mã cấp lượt, tồn quà, voucher, báo cáo và nhật ký.
3. Kết nối giao diện hiện tại với API. Máy chủ quyết định kết quả quay, kiểm tra quota/quyền và xác nhận dùng voucher trong giao dịch nguyên tử. Giữ nguyên theme, nội dung thương hiệu và quy trình thao tác đã duyệt.
4. Kiểm thử với database thật trước khi đóng gói: hai lần xác nhận voucher đồng thời, phần quà cuối, mã hết giới hạn, gửi lại yêu cầu sau mất mạng, hết hạn, đổi quyền nhân viên và khôi phục ví trên thiết bị khác.
5. Triển khai bản kiểm tra với database riêng; thiết lập HTTPS, cấu hình bí mật, quyền ghi cần thiết và sao lưu. Khi kiểm tra dữ liệu chưa dùng thật, giới hạn quyền vào môi trường kiểm tra; `noindex` không phải kiểm soát truy cập.
6. Nghiệm thu trên Samsung Android và laptop, duyệt quà/điều kiện/mã thực tế, tạo tài khoản nhân viên mới; sau đó mở chiến dịch.

Không nhập tài khoản, phiên, mã cấp lượt, lượt quay hoặc voucher của bản localStorage vào dữ liệu vận hành. Chỉ chuyển cấu hình trình bày và danh mục quà đã được kiểm tra. Không tự chạy lệnh xóa/nạp lại database khi triển khai.

## Tài liệu tham chiếu đã kiểm tra

- [Laravel 13 — Deployment](https://laravel.com/framework/docs/deployment): yêu cầu PHP, extension, thư mục public, quyền ghi và cấu hình debug.
- [Laravel — Release Notes](https://laravel.com/framework/docs/releases): các phiên bản PHP được hỗ trợ.
- [cPanel — MultiPHP Manager](https://docs.cpanel.net/cpanel/software/multiphp-manager-for-cpanel/): cấu hình PHP theo tên miền.
- [cPanel — Terminal](https://docs.cpanel.net/cpanel/advanced/terminal-in-cpanel/): điều kiện có Terminal/shell access.
- [cPanel — Create a New Domain](https://docs.cpanel.net/cpanel/domains/domains/create-a-new-domain/): tên miền phụ, thư mục web và chứng chỉ.
- [cPanel — PHP CLI](https://support.cpanel.net/hc/en-us/articles/360050224413-How-to-run-PHP-commands-as-a-cPanel-user-via-Terminal): dùng đúng phiên bản PHP khi chạy dòng lệnh.

Danh sách nghiệm thu nghiệp vụ: [SERVER-READINESS.md](SERVER-READINESS.md).
