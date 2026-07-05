// Before/After slider
(function(){
  const range  = document.getElementById('baRange');
  const before = document.getElementById('baBefore');
  const handle = document.getElementById('baHandle');
  if(!range) return;
  function update(v){
    before.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
    handle.style.left = v + '%';
  }
  range.addEventListener('input', e => update(e.target.value));
  update(range.value);
})();

// Live price estimate (số đôi × gói)
(function(){
  const form = document.getElementById('bookForm');
  const box  = document.getElementById('estimate');
  if(!form || !box) return;
  const PRICES = { 'Cơ bản': 70000, 'Deep Clean': 150000, 'Phục hồi': 320000 };
  const vnd = n => n.toLocaleString('vi-VN') + 'đ';
  function update(){
    const service = form.service.value;
    const pairs = Math.min(20, Math.max(1, parseInt(form.pairs.value, 10) || 1));
    const key = Object.keys(PRICES).find(k => service.indexOf(k) === 0);
    if(!key){ box.innerHTML = 'Chúng tôi sẽ tư vấn gói phù hợp và báo giá trước khi làm.'; return; }
    const total = PRICES[key] * pairs;
    const ship = pairs >= 2 ? 'Miễn phí giao nhận nội thành' : 'Miễn phí giao nhận từ 2 đôi';
    box.innerHTML = 'Tạm tính: <strong>' + vnd(total) + '</strong> · ' + pairs + ' đôi<small>' + ship + ' — báo giá chính xác sau khi kiểm tra giày</small>';
  }
  form.service.addEventListener('change', update);
  form.pairs.addEventListener('input', update);
  // Ngày lấy: không cho chọn quá khứ
  const d = form.pickupDate;
  if(d){ d.min = new Date(Date.now() + 7*3600*1000).toISOString().slice(0,10); }
  update();
})();

// Booking form → gửi lead về /api/contact (báo Telegram cho shop)
(function(){
  const form = document.getElementById('bookForm');
  const msg  = document.getElementById('formMsg');
  if(!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const name  = (fd.get('name')  || '').toString().trim();
    const phone = (fd.get('phone') || '').toString().trim();
    if(!name || !phone){
      msg.textContent = 'Vui lòng nhập họ tên và số điện thoại.';
      msg.style.color = '#c0392b';
      return;
    }
    const service = (fd.get('service') || '').toString();
    const btn = form.querySelector('button[type="submit"]');
    if(btn) btn.disabled = true;
    msg.style.color = '';
    msg.textContent = 'Đang gửi…';
    try {
      const pairs = Math.min(20, Math.max(1, parseInt(fd.get('pairs'), 10) || 1));
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name, phone, service, pairs,
          pickupDate: (fd.get('pickupDate') || '').toString(),
          slot: (fd.get('slot') || '').toString(),
          addr: (fd.get('addr') || '').toString().trim(),
          website: (fd.get('website') || '').toString()  // honeypot
        })
      });
      const data = await res.json().catch(() => ({}));
      if(res.ok && data.ok){
        msg.textContent = 'Đã nhận yêu cầu! Shipper sẽ gọi cho bạn trong ít phút.';
        msg.style.color = '';
        if(typeof gtag === 'function'){
          const PRICES = { 'Cơ bản': 70000, 'Deep Clean': 150000, 'Phục hồi': 320000 };
          const key = Object.keys(PRICES).find(k => service.indexOf(k) === 0);
          gtag('event', 'generate_lead', {service, pairs, value: key ? PRICES[key] * pairs : 0, currency: 'VND'});
        }
        form.reset();
        form.service.dispatchEvent(new Event('change')); // cập nhật lại ô tạm tính
      } else {
        msg.textContent = data.error || 'Có lỗi khi gửi. Vui lòng gọi 0775 996 797 giúp mình nhé.';
        msg.style.color = '#c0392b';
      }
    } catch(err){
      msg.textContent = 'Lỗi kết nối. Vui lòng gọi 0775 996 797 giúp mình nhé.';
      msg.style.color = '#c0392b';
    } finally {
      if(btn) btn.disabled = false;
    }
  });
})();

// GA4: track contact channel clicks
(function(){
  if(typeof gtag !== 'function') return;
  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if(!a) return;
    const href = a.getAttribute('href') || '';
    if(href.startsWith('tel:'))            gtag('event', 'contact_click', {method: 'phone'});
    else if(href.includes('zalo.me'))      gtag('event', 'contact_click', {method: 'zalo'});
    else if(href.includes('m.me'))         gtag('event', 'contact_click', {method: 'messenger'});
    else if(href.includes('facebook.com')) gtag('event', 'contact_click', {method: 'facebook'});
  });
})();

// Mobile hamburger menu
(function(){
  const burger = document.getElementById('navBurger');
  const nav = document.querySelector('.nav');
  if(!burger || !nav) return;
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('nav--open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
  });
  // Đóng menu khi bấm 1 link (anchor scroll)
  nav.addEventListener('click', e => {
    if(e.target.closest('.nav__links a')){
      nav.classList.remove('nav--open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
})();

// Header shadow on scroll
(function(){
  const nav = document.querySelector('.nav');
  if(!nav) return;
  const onScroll = () => nav.style.boxShadow = window.scrollY > 10 ? '0 8px 30px -16px rgba(22,32,29,.35)' : 'none';
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();
