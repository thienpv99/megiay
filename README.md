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

## Analytics
- GA4 (Measurement ID: G-E467NPGTGD) gắn trong <head>
- Sự kiện tùy chỉnh: `contact_click` (method: phone/zalo/messenger/facebook), `generate_lead` (gửi form, kèm gói dịch vụ)

## Liên hệ tích hợp
- Cụm nút nổi góc phải dưới: Zalo (zalo.me/0775996797) + Messenger (m.me/Megiay.shop94)
- Footer: SĐT 0775 996 797, địa chỉ 568 Nguyễn Duy Trinh P. Bình Trưng (link Google Maps),
  Facebook (fb.com/Megiay.shop94), Messenger, Zalo, giờ mở cửa

## Trước khi lên production
- Domain placeholder hiện là megiay.vn — nếu domain thật khác, sửa trong index.html, robots.txt, sitemap.xml
- Nếu có Zalo OA chính thức, đổi `zalo.me/0775996797` thành zalo.me/<OA-ID>
- Nối form đặt lịch vào backend/CRM thật
- Thay ảnh giày thật vào khối before/after (hiện đang là placeholder CSS)
