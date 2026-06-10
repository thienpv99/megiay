# Megiay — Trang vệ sinh giày (SEO landing page)

## Chạy local
Mở terminal tại thư mục này rồi chạy MỘT trong các lệnh:

    npx serve .
    # hoặc:  python3 -m http.server 8080

Sau đó mở trình duyệt: http://localhost:8080 (hoặc cổng serve in ra).
Lưu ý: mở thẳng `index.html` bằng `file://` sẽ KHÔNG load được CSS — luôn chạy qua server.

## Cấu trúc
- index.html              Trang chính (1 page, full SEO)
- assets/css/style.css    Giao diện
- assets/js/main.js       Slider trước/sau + form đặt lịch + nav shadow
- assets/logo/            Logo Megiay (SVG)
- favicon-32.png / favicon-180.png   Favicon (đặt ở root theo chuẩn)
- robots.txt              Cho bot tìm kiếm
- sitemap.xml             Sơ đồ site
- docs/ARCHITECTURE.md    Ghi chú kiến trúc & roadmap

## SEO đã tích hợp
- Title / meta description / keywords tối ưu từ khóa "vệ sinh giày"
- Open Graph + Twitter Card (chia sẻ mạng xã hội)
- Schema.org JSON-LD: LocalBusiness (kèm sameAs Facebook, hasMap), Service + bảng giá, FAQPage
- robots.txt + sitemap.xml, canonical, lang="vi", semantic HTML, alt/aria
- Responsive + accessible (focus, reduced-motion, skip-link)

## Liên hệ tích hợp
- Cụm nút nổi góc phải dưới: Zalo OA (zalo.me/0909123456) + Messenger (m.me/Megiay.shop94)
- Footer: địa chỉ (link Google Maps), Facebook (fb.com/Megiay.shop94), Messenger, Zalo OA, giờ mở cửa

## Trước khi lên production
- Domain placeholder hiện là megiay.vn — nếu domain thật khác, sửa trong index.html, robots.txt, sitemap.xml
- Đổi `zalo.me/0909123456` thành link Zalo OA thật (zalo.me/<OA-ID> hoặc SĐT đăng ký Zalo)
- Thay số điện thoại, địa chỉ, tọa độ trong JSON-LD + footer
- Nối form đặt lịch vào backend/CRM thật
- Thay ảnh giày thật vào khối before/after (hiện đang là placeholder CSS)
