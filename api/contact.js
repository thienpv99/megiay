// Vercel Serverless Function — nhận form tư vấn và báo lead về Telegram.
// Deploy tự động khi ở thư mục /api trên Vercel (không cần cấu hình).
//
// Cần đặt Environment Variables trong Vercel (Project Settings → Environment Variables):
//   TELEGRAM_BOT_TOKEN  = token bot (giống bên GitHub/Cloudflare)
//   TELEGRAM_CHAT_ID    = chat id cá nhân của bạn (vd 1606718182)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Vercel tự parse JSON body; phòng trường hợp là chuỗi.
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const name    = String(body.name || '').trim();
  const phone   = normPhoneVN(body.phone || '');
  const service = String(body.service || '').trim();
  const addr    = String(body.addr || '').trim();
  const pairs   = Math.min(20, Math.max(1, parseInt(body.pairs, 10) || 1));
  const pickupDate = String(body.pickupDate || '').trim().slice(0, 10); // YYYY-MM-DD
  const slot    = String(body.slot || '').trim().slice(0, 30);
  const honeypot = String(body.website || '').trim(); // bẫy bot

  // Bot thường điền cả field ẩn → im lặng chấp nhận, không làm gì.
  if (honeypot) return res.status(200).json({ ok: true });

  if (!name || !phone) {
    return res.status(400).json({ ok: false, error: 'Vui lòng nhập họ tên và số điện thoại.' });
  }
  if (!isValidPhoneVN(phone)) {
    return res.status(400).json({ ok: false, error: 'Số điện thoại chưa đúng. Vui lòng nhập số Việt Nam, VD: 090 123 4567.' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID env');
    return res.status(500).json({ ok: false, error: 'Hệ thống chưa cấu hình. Vui lòng gọi 0775 996 797.' });
  }

  const esc = (s) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const when = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  // Tạm tính để shop nhìn nhanh giá trị lead
  const PRICES = { 'Cơ bản': 70000, 'Deep Clean': 150000, 'Phục hồi': 320000 };
  const priceKey = Object.keys(PRICES).find((k) => service.startsWith(k));
  const estimate = priceKey ? (PRICES[priceKey] * pairs).toLocaleString('vi-VN') + 'đ' : null;

  const text =
    `🔔 <b>LEAD MỚI từ website Megiay</b>\n\n` +
    `👤 <b>Tên:</b> ${esc(name)}\n` +
    `📞 <b>SĐT:</b> ${esc(phone)}\n` +
    (service ? `🧰 <b>Gói:</b> ${esc(service)} × ${pairs} đôi\n` : `👟 <b>Số đôi:</b> ${pairs}\n`) +
    (estimate ? `💰 <b>Tạm tính:</b> ${estimate}\n` : '') +
    (pickupDate ? `📅 <b>Ngày lấy:</b> ${esc(pickupDate)}\n` : '') +
    (slot ? `⏰ <b>Khung giờ:</b> ${esc(slot)}\n` : '') +
    (addr ? `📍 <b>Địa chỉ:</b> ${esc(addr)}\n` : '') +
    `\n🕒 ${when}`;

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    if (!tg.ok) {
      console.error('Telegram error', await tg.text());
      return res.status(502).json({ ok: false, error: 'Không gửi được thông báo, vui lòng gọi 0775 996 797.' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'Lỗi máy chủ, vui lòng gọi 0775 996 797.' });
  }
}

// ---- Validation số điện thoại VN (giữ đồng bộ với assets/js/main.js) ----
function normPhoneVN(raw) {
  let p = String(raw).replace(/[\s.\-()]/g, '');
  if (p.startsWith('+84')) p = '0' + p.slice(3);
  else if (p.startsWith('84') && p.length >= 10) p = '0' + p.slice(2);
  return p;
}
function isValidPhoneVN(p) {
  // Di động: 0 + (3|5|7|8|9) + 8 số (đủ mọi nhà mạng, kể cả iTel 087/Wintel 055).
  // Bàn: 02 + 9 số.
  if (!/^0(?:2\d{9}|[35789]\d{8})$/.test(p)) return false;
  if (/^(\d)\1+$/.test(p)) return false;   // toàn một chữ số (0000000000…)
  if (/(\d)\1{7}$/.test(p)) return false;  // 8 số cuối giống hệt nhau (0911111111…)
  return true;
}
