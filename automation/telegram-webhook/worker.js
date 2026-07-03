// Cloudflare Worker — cầu nối giữa nút bấm Telegram và GitHub Actions.
//
// Telegram gọi Worker này mỗi khi bạn bấm "Duyệt" / "Bỏ qua". Worker:
//   1. Xác thực secret token của Telegram
//   2. Đọc callback_data (publish:<slug> hoặc discard:<slug>)
//   3. Gọi GitHub repository_dispatch để chạy workflow publish-article
//   4. Trả lời Telegram + cập nhật tin nhắn cho biết đang xử lý
//
// Bí mật cần đặt trong Worker (wrangler secret put ...):
//   TELEGRAM_BOT_TOKEN   - token bot Telegram
//   TELEGRAM_SECRET      - chuỗi bí mật đặt khi setWebhook (khớp header)
//   GITHUB_TOKEN         - fine-grained PAT, quyền Contents: Read & Write trên repo megiay
//   GH_OWNER             - vd: thienpv99
//   GH_REPO              - vd: megiay

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('ok');

    // 1. Xác thực Telegram
    const secret = request.headers.get('x-telegram-bot-api-secret-token');
    if (secret !== env.TELEGRAM_SECRET) return new Response('forbidden', { status: 403 });

    const update = await request.json().catch(() => null);
    const cq = update?.callback_query;
    if (!cq) return new Response('ok'); // bỏ qua update không phải nút bấm

    const data = cq.data || '';
    const [action, slug] = data.split(':');
    const chatId = cq.message?.chat?.id;
    const messageId = cq.message?.message_id;

    const eventType = action === 'publish' ? 'publish-article'
                    : action === 'discard' ? 'discard-article'
                    : null;

    if (!eventType || !slug) {
      await answer(env, cq.id, 'Lệnh không hợp lệ');
      return new Response('ok');
    }

    // 2. Gọi GitHub repository_dispatch
    const ghRes = await fetch(
      `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
          'User-Agent': 'megiay-telegram-webhook',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event_type: eventType, client_payload: { slug } }),
      }
    );

    if (!ghRes.ok) {
      await answer(env, cq.id, '⚠️ Lỗi khi gọi GitHub, thử lại sau');
      return new Response('ok');
    }

    // 3. Phản hồi người dùng
    const label = action === 'publish' ? '⏳ Đang đăng bài…' : '🗑️ Đang bỏ qua…';
    await answer(env, cq.id, label);
    if (chatId && messageId) await editReplyMarkup(env, chatId, messageId, label);

    return new Response('ok');
  },
};

async function answer(env, callbackQueryId, text) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  }).catch(() => {});
}

async function editReplyMarkup(env, chatId, messageId, note) {
  // Xoá nút để tránh bấm 2 lần, thêm dòng trạng thái.
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [[{ text: note, callback_data: 'noop' }]] } }),
  }).catch(() => {});
}
