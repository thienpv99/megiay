# Kiến trúc & Roadmap — Megiay landing page

## Hiện trạng (2026-06)
Static site thuần (HTML + CSS + JS), không build step, không framework.
Đây là lựa chọn ĐÚNG cho giai đoạn này: 1 trang landing, SEO-first, host miễn phí
trên GitHub Pages, không có gì để bảo trì ngoài nội dung.

```
megiay/
├── index.html            # trang chủ — markup + SEO + JSON-LD
├── blog/
│   ├── index.html        # trang listing blog (marker POSTS:START/END để chèn card)
│   └── <slug>/index.html # mỗi bài viết 1 thư mục (URL đẹp cho SEO)
├── favicon-*.png         # favicon ở root (chuẩn trình duyệt)
├── robots.txt, sitemap.xml  # sitemap có marker SITEMAP:START/END
├── assets/
│   ├── css/style.css     # toàn bộ style, CSS variables làm design token
│   ├── js/main.js        # 3 module IIFE: slider, form, nav-shadow
│   └── logo/             # logo SVG (Megiay brand kit)
├── automation/           # luồng sinh + duyệt bài SEO qua Telegram (xem AUTOMATION.md)
│   ├── topics.json, generate-article.mjs, publish-article.mjs
│   ├── lib/template.mjs  # render page/card/sitemap khớp design site
│   └── telegram-webhook/ # Cloudflare Worker nhận nút bấm Telegram
├── .github/workflows/    # cron 8h sinh bài + xử lý duyệt (repository_dispatch)
└── docs/                 # ARCHITECTURE.md (file này) + AUTOMATION.md
```

## Quy ước
- **Design tokens**: mọi màu/shadow đặt trong `:root` của style.css — đổi theme chỉ sửa 1 chỗ.
- **JS**: mỗi tính năng là 1 IIFE độc lập, tự thoát nếu thiếu DOM element (`if(!x) return`).
  Trang vẫn hoạt động đầy đủ khi JS lỗi/tắt (progressive enhancement).
- **Liên hệ/thông tin doanh nghiệp** xuất hiện ở nhiều nơi phải sửa đồng bộ:
  JSON-LD (head), footer, cụm nút nổi (Zalo + Messenger) — trên `index.html`, `blog/index.html`
  và `automation/lib/template.mjs` (footer của bài viết auto). Tìm theo `Megiay.shop94` / `0775`.
- **2 chi nhánh:** CN1 568 Nguyễn Duy Trinh (có GPS), CN2 33 Đường 7, P. Bình Trưng, Thủ Đức.
  Mỗi chi nhánh có 1 block JSON-LD LocalBusiness riêng trong `index.html`.

## Quyết định kiến trúc (ADR-lite)

**ADR-1: Giữ static thuần, không framework.**
Lý do: 1 trang, nội dung ít thay đổi, SEO cần HTML render sẵn, GitHub Pages host miễn phí.
Đánh đổi: lặp markup nếu sau này nhiều trang. Xem lại khi cần >3 trang.

**ADR-2: Messenger qua link `m.me` thay vì Facebook Chat Plugin SDK.**
Lý do: Chat Plugin cho khách vãng lai đã bị Meta ngừng hỗ trợ (2024);
link m.me không cần SDK, không chậm trang, không vấn đề cookie/consent.

**ADR-3: Thống nhất brand "Megiay" toàn site.**
Trạng thái: ĐÃ xử lý (2026-06-10) — đổi toàn bộ "SneakerCare" → "Megiay" và domain
placeholder sneakercare.vn → megiay.vn trong title, meta, OG, JSON-LD, footer,
robots.txt, sitemap.xml.

## Roadmap phát triển

| Giai đoạn | Nhu cầu | Nâng cấp đề xuất |
|---|---|---|
| Hiện tại | Landing + Blog | Giữ static; blog render qua template.mjs (không cần SSG) |
| +Blog/nhiều trang | ĐÃ làm (2026-07): `/blog/` + luồng duyệt bài qua Telegram | Nếu >50 bài & cần tag/category → cân nhắc SSG (Astro/Eleventy) |
| +Đặt lịch thật | Form gửi về backend | Bước 1: Formspree/Google Form endpoint (sửa 1 hàm trong main.js). Bước 2: backend riêng + Supabase/DB khi cần quản lý đơn |
| +Đa chi nhánh | Nhiều địa chỉ | Tách data ra JSON, render JSON-LD nhiều LocalBusiness |

Nguyên tắc: chỉ nâng cấp khi nhu cầu thật xuất hiện — không thêm framework/build trước.
