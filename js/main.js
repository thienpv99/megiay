// Before/After slider
(function(){
  const range  = document.getElementById('baRange');
  const before = document.getElementById('baBefore');
  const handle = document.getElementById('baHandle');
  if(!range) return;
  function update(v){
    before.style.width = v + '%';
    handle.style.left  = v + '%';
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
    form.reset();
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
