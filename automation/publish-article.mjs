// Publishes (or discards) a pending draft after Telegram approval.
// Triggered by the publish-article GitHub Actions workflow (repository_dispatch).
//
// Env: ACTION ('publish' | 'discard'), SLUG
//      TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (for the confirmation message)
//
// On publish it: renders blog/<slug>/index.html, inserts a card into
// blog/index.html and a <url> into sitemap.xml, marks the topic 'done',
// and removes the pending file. The workflow commits + pushes the result.

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderArticlePage, renderCard, renderSitemapEntry } from './lib/template.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PENDING_DIR = join(__dirname, 'pending');
const TOPICS_PATH = join(__dirname, 'topics.json');
const BLOG_INDEX = join(ROOT, 'blog', 'index.html');
const SITEMAP = join(ROOT, 'sitemap.xml');

const ACTION = process.env.ACTION || 'publish';
const SLUG = process.env.SLUG;

function insertBetween(source, startMark, endMark, insertion, { prepend = true } = {}) {
  const s = source.indexOf(startMark);
  const e = source.indexOf(endMark);
  if (s === -1 || e === -1) throw new Error(`Markers not found: ${startMark}`);
  const before = source.slice(0, s + startMark.length);
  const middle = source.slice(s + startMark.length, e);
  const after = source.slice(e);
  const block = prepend ? `\n${insertion}${middle}` : `${middle}${insertion}\n`;
  return `${before}${block}${after}`;
}

async function markTopic(slug, status) {
  const tf = JSON.parse(await readFile(TOPICS_PATH, 'utf8'));
  const t = tf.topics.find((x) => x.slug === slug);
  if (t) { t.status = status; await writeFile(TOPICS_PATH, JSON.stringify(tf, null, 2)); }
}

async function telegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  }).catch((e) => console.error('Telegram notify failed:', e));
}

async function main() {
  if (!SLUG) { console.error('Missing SLUG'); process.exit(1); }
  const pendingPath = join(PENDING_DIR, `${SLUG}.json`);

  let draft;
  try {
    draft = JSON.parse(await readFile(pendingPath, 'utf8'));
  } catch {
    console.log(`No pending draft for ${SLUG} (already handled?). Skipping.`);
    return;
  }

  if (ACTION === 'discard') {
    await rm(pendingPath, { force: true });
    await markTopic(SLUG, 'skipped');
    await telegram(`❌ Đã bỏ qua bản nháp: <b>${draft.title}</b>`);
    console.log(`Discarded ${SLUG}`);
    return;
  }

  // publish
  const dir = join(ROOT, 'blog', SLUG);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), renderArticlePage(draft));

  let index = await readFile(BLOG_INDEX, 'utf8');
  index = insertBetween(index, '<!-- POSTS:START -->', '<!-- POSTS:END -->', renderCard(draft), { prepend: true });
  await writeFile(BLOG_INDEX, index);

  let sitemap = await readFile(SITEMAP, 'utf8');
  sitemap = insertBetween(sitemap, '<!-- SITEMAP:START -->', '<!-- SITEMAP:END -->', renderSitemapEntry(draft), { prepend: true });
  await writeFile(SITEMAP, sitemap);

  await rm(pendingPath, { force: true });
  await markTopic(SLUG, 'done');

  await telegram(`✅ Đã đăng: <b>${draft.title}</b>\nhttps://megiay.vercel.app/blog/${SLUG}/`);
  console.log(`Published ${SLUG}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
