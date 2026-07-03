// Daily SEO draft generator.
// 1. Picks the next 'todo' topic from topics.json
// 2. Asks Claude to write a Vietnamese SEO article (prose HTML + metadata)
// 3. Saves a pending draft under automation/pending/<slug>.json
// 4. Sends the draft to Telegram with inline "Approve / Discard" buttons
//
// The GitHub Actions workflow commits the pending file + topics.json change.
// Requires Node 20+ (global fetch). No npm dependencies.
//
// Env: ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
//      ANTHROPIC_MODEL (optional, default claude-sonnet-5)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TOPICS_PATH = join(__dirname, 'topics.json');
const PENDING_DIR = join(__dirname, 'pending');

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) { console.error(`Missing env ${name}`); process.exit(1); }
  return v;
}

function todayDisplay() {
  const d = new Date(Date.now() + 7 * 3600 * 1000); // UTC+7
  const p = (n) => String(n).padStart(2, '0');
  return {
    iso: `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`,
    display: `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`,
  };
}

async function callClaude(topic) {
  const apiKey = requireEnv('ANTHROPIC_API_KEY');
  const system =
    'Bạn là biên tập viên SEO cho Megiay — dịch vụ vệ sinh giày cao cấp tại TP.HCM. ' +
    'Viết bài chuẩn SEO tiếng Việt, giọng thân thiện, chuyên nghiệp, thực chiến. ' +
    'Luôn nộp bài bằng cách gọi tool submit_article.';
  const prompt =
`Viết một bài blog SEO về chủ đề sau cho website vệ sinh giày Megiay, rồi gọi tool submit_article để nộp bài.

Chủ đề: ${topic.title}
Từ khóa chính: ${topic.keywords}
Góc tiếp cận: ${topic.angle}

Yêu cầu:
- Độ dài 700–1100 từ, chia mục rõ ràng bằng thẻ <h2> (và <h3> nếu cần).
- bodyHtml chỉ gồm các thẻ: <h2> <h3> <p> <ul> <ol> <li> <strong> <blockquote>. KHÔNG dùng <h1>, không thẻ <html>/<head>/<body>, không style inline.
- Chèn từ khóa tự nhiên, không nhồi nhét. Có ít nhất 1 danh sách (ul hoặc ol).
- Có phần nhắc khéo dịch vụ Megiay ở gần cuối (nhận giao tận nơi, cam kết sạch như mới hoặc hoàn tiền), nhưng KHÔNG chèn thẻ CTA — hệ thống tự thêm.`;

  const tool = {
    name: 'submit_article',
    description: 'Nộp bài blog SEO đã viết xong.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Tiêu đề bài, nên <= 65 ký tự' },
        description: { type: 'string', description: 'Meta description 140-160 ký tự' },
        keywords: { type: 'string', description: '5-8 từ khóa, phân tách bằng dấu phẩy' },
        lede: { type: 'string', description: 'Đoạn mở đầu 1-2 câu hấp dẫn' },
        excerpt: { type: 'string', description: 'Tóm tắt ~20 từ cho thẻ card' },
        readMinutes: { type: 'integer', description: 'Số phút đọc ước lượng' },
        bodyHtml: { type: 'string', description: 'Toàn bộ thân bài dưới dạng HTML' },
      },
      required: ['title', 'description', 'keywords', 'lede', 'excerpt', 'readMinutes', 'bodyHtml'],
    },
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system,
      tools: [tool],
      tool_choice: { type: 'tool', name: 'submit_article' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // Với tool_use, Anthropic đã bảo đảm input là JSON hợp lệ — không cần tự parse chuỗi.
  const block = (data.content || []).find((b) => b.type === 'tool_use');
  if (!block) throw new Error(`No tool_use in response: ${JSON.stringify(data).slice(0, 800)}`);
  return block.input;
}

async function sendTelegram(draft) {
  const token = requireEnv('TELEGRAM_BOT_TOKEN');
  const chatId = requireEnv('TELEGRAM_CHAT_ID');
  const preview =
    `📝 <b>Bản nháp SEO mới</b>\n\n` +
    `<b>${draft.title}</b>\n\n` +
    `${draft.lede}\n\n` +
    `🔑 <i>${draft.keywords}</i>\n` +
    `⏱ ${draft.readMinutes} phút đọc · 📂 ${draft.category}\n\n` +
    `Duyệt để đăng lên megiay.vn/blog/${draft.slug}/`;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: preview,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Duyệt & đăng', callback_data: `publish:${draft.slug}` },
          { text: '❌ Bỏ qua', callback_data: `discard:${draft.slug}` },
        ]],
      },
    }),
  });
  if (!res.ok) throw new Error(`Telegram sendMessage ${res.status}: ${await res.text()}`);
}

async function main() {
  const topicsFile = JSON.parse(await readFile(TOPICS_PATH, 'utf8'));
  const topic = topicsFile.topics.find((t) => t.status === 'todo');
  if (!topic) {
    console.log('No todo topics left. Add more to topics.json. Skipping.');
    return;
  }
  console.log(`Generating: ${topic.title}`);

  const gen = await callClaude(topic);
  const { iso, display } = todayDisplay();
  const draft = {
    slug: topic.slug,
    title: gen.title || topic.title,
    description: gen.description || '',
    keywords: gen.keywords || topic.keywords,
    category: topic.category || 'Cẩm nang',
    date: iso,
    dateDisplay: display,
    readMinutes: gen.readMinutes || 5,
    lede: gen.lede || '',
    excerpt: gen.excerpt || gen.lede || '',
    bodyHtml: gen.bodyHtml || '',
    generatedAt: new Date().toISOString(),
  };

  await mkdir(PENDING_DIR, { recursive: true });
  await writeFile(join(PENDING_DIR, `${topic.slug}.json`), JSON.stringify(draft, null, 2));

  // Mark topic as pending so the next run doesn't regenerate it.
  topic.status = 'pending';
  await writeFile(TOPICS_PATH, JSON.stringify(topicsFile, null, 2));

  await sendTelegram(draft);
  console.log(`Draft saved + sent to Telegram: ${topic.slug}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
