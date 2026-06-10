# SneakerCare — Trang vệ sinh giày (SEO landing page)

## Chạy local
Mở terminal tại thư mục này rồi chạy MỘT trong các lệnh:

    python3 -m http.server 8080
    # hoặc:  npx serve .

Sau đó mở trình duyệt: http://localhost:8080

Hoặc đơn giản: mở thẳng file `index.html` bằng trình duyệt.

## Cấu trúc
- index.html      Trang chính (1 page, full SEO)
- css/style.css   Giao diện
- js/main.js      Slider trước/sau + form đặt lịch
- robots.txt      Cho bot tìm kiếm
- sitemap.xml     Sơ đồ site

## SEO đã tích hợp
- Thẻ title / meta description / keywords tối ưu từ khóa "vệ sinh giày"
- Open Graph + Twitter Card (chia sẻ mạng xã hội)
- Schema.org JSON-LD: LocalBusiness, Service + bảng giá, FAQPage
- robots.txt + sitemap.xml, canonical, lang="vi", semantic HTML, alt/aria
- Responsive + accessible (focus, reduced-motion, skip-link)

## Trước khi lên production
- Đổi domain sneakercare.vn → domain thật trong index.html, robots.txt, sitemap.xml
- Thay số điện thoại, địa chỉ, tọa độ trong JSON-LD
- Nối form đặt lịch vào backend/CRM thật
- Thay ảnh giày thật vào khối before/after (hiện đang là placeholder CSS)
