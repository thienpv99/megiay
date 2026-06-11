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

// Booking form (demo — no backend)
(function(){
  const form = document.getElementById('bookForm');
  const msg  = document.getElementById('formMsg');
  if(!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name  = form.name.value.trim();
    const phone = form.phone.value.trim();
    if(!name || !phone){
      msg.textContent = 'Vui lòng nhập họ tên và số điện thoại.';
      msg.style.color = '#c0392b';
      return;
    }
    msg.textContent = 'Đã nhận yêu cầu! Shipper sẽ gọi cho bạn trong ít phút.';
    msg.style.color = '';
    if(typeof gtag === 'function') gtag('event', 'generate_lead', {service: form.service.value});
    form.reset();
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
