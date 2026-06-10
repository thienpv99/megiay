# Kiến trúc & Roadmap — Megiay landing page

## Hiện trạng (2026-06)
Static site thuần (HTML + CSS + JS), không build step, không framework.
Đây là lựa chọn ĐÚNG cho giai đoạn này: 1 trang landing, SEO-first, host miễn phí
trên GitHub Pages, không có gì để bảo trì ngoài nội dung.

```
megiay/
├── index.html            # 1 page duy nhất — markup + SEO + JSON-LD
├── favicon-*.png         # favicon ở root (chuẩn trình duyệt)
├── robots.txt, sitemap.xml
├── assets/
│   ├── css/style.css     # toàn bộ style, CSS variables làm design token
│   ├── js/main.js        # 3 module IIFE: slider, form, nav-shadow
│   └── logo/             # logo SVG (Megiay brand kit)
└── docs/ARCHITECTURE.md  # file này
```

## Quy ước
- **Design tokens**: mọi màu/shadow đặt trong `:root` của style.css — đổi theme chỉ sửa 1 chỗ.
- **JS**: mỗi tính năng là 1 IIFE độc lập, tự thoát nếu thiếu DOM element (`if(!x) return`).
  Trang vẫn hoạt động đầy đủ khi JS lỗi/tắt (progressive enhancement).
- **Liên hệ/thông tin doanh nghiệp** xuất hiện ở 3 nơi phải sửa đồng bộ:
  JSON-LD (head), footer, cụm nút nổi (Zalo + Messenger). Tìm theo từ khóa `megiay` / `0909`.

## Quyết định kiến trúc (ADR-lite)

**ADR-1: Giữ static thuần, không framework.**
Lý do: 1 trang, nội dung ít thay đổi, SEO cần HTML render sẵn, GitHub Pages host miễn phí.
Đánh đổi: lặp markup nếu sau này nhiều trang. Xem lại khi cần >3 trang.

**ADR-2: Messenger qua link `m.me` thay vì Facebook Chat Plugin SDK.**
Lý do: Chat Plugin cho khách vãng lai đã bị Meta ngừng hỗ trợ (2024);
link m.me không cần SDK, không chậm trang, không vấn đề cookie/consent.

**ADR-3: Brand "SneakerCare" (nội dung) vs "Megiay" (logo/repo) đang lệch nhau.**
Trạng thái: CHƯA xử lý — cần chủ shop quyết định tên chính thức rồi đổi đồng loạt:
title, meta, OG, JSON-LD `name`, footer copyright.

## Roadmap phát triển

| Giai đoạn | Nhu cầu | Nâng cấp đề xuất |
|---|---|---|
| Hiện tại | 1 landing page | Giữ nguyên static |
| +Blog/nhiều trang | Bài viết SEO "cách vệ sinh giày…" | Chuyển sang SSG (Astro/Eleventy) — tái dùng được toàn bộ HTML/CSS hiện có |
| +Đặt lịch thật | Form gửi về backend | Bước 1: Formspree/Google Form endpoint (sửa 1 hàm trong main.js). Bước 2: backend riêng + Supabase/DB khi cần quản lý đơn |
| +Đa chi nhánh | Nhiều địa chỉ | Tách data ra JSON, render JSON-LD nhiều LocalBusiness |

Nguyên tắc: chỉ nâng cấp khi nhu cầu thật xuất hiện — không thêm framework/build trước.
