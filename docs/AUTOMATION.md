# Luồng tự động: Sinh bài SEO → Duyệt qua Telegram → Đăng lên web

> Tài liệu Solution Architecture (arc42-lite) cho tính năng "mỗi sáng 8h có 1 bài
> nháp gửi Telegram, bấm 1 nút là bài SEO được đăng lên megiay.vn/blog".

## 1. Mục tiêu & phạm vi

**Mục tiêu nghiệp vụ:** đều đặn xuất bản nội dung SEO về vệ sinh giày để kéo
traffic tự nhiên, nhưng chủ shop chỉ tốn ~30 giây/ngày để duyệt trên điện thoại.

**Trong phạm vi:** sinh bản nháp bằng AI, gửi Telegram, duyệt/loại 1 chạm, tự
đăng vào blog tĩnh (page HTML + card + sitemap), thông báo kết quả.

**Ngoài phạm vi:** CMS, đăng nhập, ảnh minh hoạ tự sinh, lên lịch nhiều bài/ngày.

## 2. Ràng buộc

- Site là **static HTML host trên GitHub Pages** — không có backend chạy 24/7.
- Ưu tiên **miễn phí / gần như miễn phí** và **không thêm hạ tầng phải bảo trì**.
- Telegram callback (nút bấm) **cần một endpoint HTTPS public** → phải có 1 mảnh
  serverless. Chọn Cloudflare Worker (free tier, không server, deploy 1 file).

## 3. Bức tranh tổng thể (C4 — Context)

```
[Cron 08:00]                                   ┌────────────────────┐
     │ (GitHub Actions schedule)               │  Chủ shop (Telegram)│
     ▼                                         └─────────┬──────────┘
┌──────────────────────┐   sinh bài (Claude API)         │ bấm ✅/❌
│ generate-article.mjs │───────────────► Anthropic       │
│  (GitHub Actions)    │                                 ▼
│  - commit pending    │   gửi nháp + nút        ┌────────────────────┐
│  - gửi Telegram      │────────────────────────►│  Telegram Bot API  │
└──────────────────────┘                         └─────────┬──────────┘
                                                            │ webhook (callback)
                                                            ▼
                                                 ┌────────────────────┐
                                                 │ Cloudflare Worker  │
                                                 │ (xác thực + dispatch)
                                                 └─────────┬──────────┘
                                                           │ repository_dispatch
                                                           ▼
                                          ┌───────────────────────────┐
                                          │  publish-article.mjs      │
                                          │  (GitHub Actions)         │
                                          │  render page + card +     │
                                          │  sitemap → commit → push  │
                                          └─────────────┬─────────────┘
                                                        ▼
                                              GitHub Pages (megiay.vn/blog)
```

## 4. Runtime — luồng chạy

**A. Mỗi sáng 08:00 (giờ VN):**
1. GitHub Actions (`generate-article.yml`, cron `0 1 * * *` UTC) chạy.
2. `generate-article.mjs` lấy topic `status:"todo"` đầu tiên trong `topics.json`.
3. Gọi Claude API → nhận JSON (title, description, lede, bodyHtml, …).
4. Lưu `automation/pending/<slug>.json`, đổi topic sang `status:"pending"`, commit & push.
5. Gửi Telegram tin nhắn preview + 2 nút: **✅ Duyệt & đăng** / **❌ Bỏ qua**
   (`callback_data = publish:<slug>` hoặc `discard:<slug>`).

**B. Khi bạn bấm nút trên Telegram:**
6. Telegram gọi Cloudflare Worker (webhook) kèm `callback_query`.
7. Worker xác thực secret header, đọc `publish/discard` + `slug`.
8. Worker gọi GitHub `repository_dispatch` (`event_type: publish-article` / `discard-article`).
9. Worker trả `answerCallbackQuery` ("⏳ Đang đăng…") và xoá nút để tránh bấm 2 lần.

**C. Đăng bài:**
10. `publish-article.yml` chạy `publish-article.mjs`:
    - **publish:** render `blog/<slug>/index.html`, chèn card vào `blog/index.html`,
      chèn URL vào `sitemap.xml`, đổi topic `done`, xoá file pending.
    - **discard:** xoá file pending, đổi topic `skipped`.
11. Commit & push → GitHub Pages build lại → bài live tại `megiay.vn/blog/<slug>/`.
12. Gửi Telegram xác nhận kèm link bài.

## 5. Building blocks

| Thành phần | File | Vai trò |
|---|---|---|
| Hàng đợi chủ đề | `automation/topics.json` | Danh sách bài + trạng thái (todo/pending/done/skipped) |
| Sinh bài | `automation/generate-article.mjs` | Claude API → nháp → Telegram |
| Đăng bài | `automation/publish-article.mjs` | Nháp → page HTML + card + sitemap |
| Template dùng chung | `automation/lib/template.mjs` | Render page/card/sitemap khớp design site |
| Webhook | `automation/telegram-webhook/worker.js` | Nút Telegram → repository_dispatch |
| Cron + build | `.github/workflows/*.yml` | Lịch 8h + xử lý dispatch |

## 6. Quyết định kiến trúc (ADR-lite)

**ADR-A1 — Duyệt bằng repository_dispatch, không dùng backend.**
Nút Telegram → Worker → `repository_dispatch` → GitHub Actions render tĩnh.
Lý do: giữ site 100% tĩnh, không DB, không server. Đánh đổi: cần 1 Worker nhỏ.

**ADR-A2 — Bản nháp commit vào repo (`automation/pending`).**
Lý do: có lịch sử, workflow publish đọc lại được, dễ debug. Đánh đổi: repo có
vài file json tạm (tự xoá sau khi duyệt).

**ADR-A3 — Node thuần, không dependency, không build.**
Dùng `fetch` sẵn có của Node 20 trên GitHub Actions. Đồng nhất với triết lý site
(ADR-1 trong ARCHITECTURE.md): không thêm framework/build khi chưa cần.

**ADR-A4 — Cloudflare Worker cho webhook (thay vì Vercel/Lambda).**
Free tier rộng, deploy 1 file, cold start ~0. Có thể thay bằng bất kỳ serverless
nào miễn nhận được POST của Telegram và gọi được GitHub API.

## 7. Bảo mật

- **Telegram webhook** đặt `secret_token`; Worker chỉ chấp nhận request có header
  `X-Telegram-Bot-Api-Secret-Token` khớp → chặn spam giả mạo.
- **GitHub PAT** dùng fine-grained token, chỉ quyền *Contents: Read & Write* trên
  đúng repo `megiay`. Lưu dạng secret trong Worker, không commit.
- **ANTHROPIC_API_KEY / TELEGRAM_BOT_TOKEN** lưu ở GitHub *Actions secrets*.
- `callback_data` chỉ chứa `action:slug` (không dữ liệu nhạy cảm).
- Nội dung bài do AI sinh nhưng **bạn là người duyệt** trước khi đăng (human-in-the-loop).

## 8. Rủi ro & xử lý

| Rủi ro | Giảm thiểu |
|---|---|
| Bấm nút 2 lần | Worker xoá nút sau lần bấm đầu; publish idempotent (không có pending → bỏ qua) |
| Claude trả JSON lỗi | Script parse phần `{...}`, fail rõ ràng, không commit rác |
| Hết topic | Script log & thoát êm, không gửi Telegram |
| Bài AI sai/thô | Human-in-the-loop: chỉ đăng khi bạn bấm duyệt; có thể sửa file pending trước |
| Lộ token | PAT fine-grained tối thiểu quyền; xoay vòng dễ trong Worker secret |

---

## 9. Hướng dẫn cài đặt (làm 1 lần)

### Bước 1 — Tạo Telegram bot & lấy chat id
1. Chat với **@BotFather** → `/newbot` → lấy **BOT TOKEN**.
2. Nhắn 1 tin cho bot của bạn, rồi mở
   `https://api.telegram.org/bot<TOKEN>/getUpdates` → tìm `chat.id` (số của bạn) = **CHAT ID**.

### Bước 2 — GitHub Actions secrets
Repo → Settings → Secrets and variables → Actions → **New repository secret**
(tên secret hiện dùng trong repo này):
- `ANTHROPIC_API_KEY` = API key từ console.anthropic.com
- `MEGIAY_BOT` = bot token ở bước 1
- `TELEGRAM_CHAT_MEGIAY_ID` = chat id ở bước 1
- (tuỳ chọn) Variables → `ANTHROPIC_MODEL` = `claude-sonnet-5` (mặc định) hoặc `claude-opus-4-8`

Bật GitHub Pages: Settings → Pages → Deploy from branch `main` (thư mục `/root`).

### Bước 3 — GitHub PAT cho Worker
GitHub → Settings → Developer settings → **Fine-grained tokens** → tạo token:
- Repository access: chỉ repo `megiay`
- Permissions: **Contents → Read and write**
- Copy token (dùng ở bước 4).

### Bước 4 — Deploy Cloudflare Worker
```bash
cd automation/telegram-webhook
npx wrangler login
npx wrangler secret put TELEGRAM_BOT_TOKEN   # dán bot token
npx wrangler secret put GITHUB_TOKEN         # dán PAT bước 3
npx wrangler secret put TELEGRAM_SECRET      # tự nghĩ 1 chuỗi ngẫu nhiên, nhớ lại để dùng bước 5
npx wrangler deploy
```
Ghi lại URL Worker, dạng `https://megiay-telegram-webhook.<tài-khoản>.workers.dev`.
(Sửa `GH_OWNER`/`GH_REPO` trong `wrangler.toml` nếu khác.)

### Bước 5 — Trỏ Telegram webhook về Worker
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://megiay-telegram-webhook.<tài-khoản>.workers.dev" \
  -d "secret_token=<TELEGRAM_SECRET đã đặt ở bước 4>" \
  -d "allowed_updates=[\"callback_query\"]"
```

### Bước 6 — Chạy thử
- Repo → Actions → **Generate SEO draft** → *Run workflow* (chạy tay, không cần đợi 8h).
- Kiểm tra Telegram nhận được bản nháp → bấm **✅ Duyệt & đăng**.
- Xem tab Actions chạy **Publish/Discard** → sau ~1 phút bài xuất hiện ở `megiay.vn/blog/`.

Xong. Từ hôm sau, cứ 8h sáng bạn sẽ nhận 1 bản nháp và chỉ cần bấm duyệt.

## 10. Vận hành hằng ngày
- **Thêm chủ đề:** mở `automation/topics.json`, thêm object mới với `status:"todo"`.
- **Đổi giờ gửi:** sửa cron trong `.github/workflows/generate-article.yml` (giờ UTC).
- **Sửa nội dung trước khi đăng:** sửa trực tiếp file `automation/pending/<slug>.json` rồi mới bấm duyệt.
- **Chi phí:** GitHub Actions + Pages + Cloudflare Worker: free tier. Chỉ tốn phí
  Claude API cho mỗi bài (~vài nghìn token).
