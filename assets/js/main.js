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
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name, phone, service,
          addr: (fd.get('addr') || '').toString().trim(),
          website: (fd.get('website') || '').toString()  // honeypot
        })
      });
      const data = await res.json().catch(() => ({}));
      if(res.ok && data.ok){
        msg.textContent = 'Đã nhận yêu cầu! Shipper sẽ gọi cho bạn trong ít phút.';
        msg.style.color = '';
        if(typeof gtag === 'function') gtag('event', 'generate_lead', {service});
        form.reset();
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

// Header shadow on scroll
(function(){
  const nav = document.querySelector('.nav');
  if(!nav) return;
  const onScroll = () => nav.style.boxShadow = window.scrollY > 10 ? '0 8px 30px -16px rgba(22,32,29,.35)' : 'none';
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();
