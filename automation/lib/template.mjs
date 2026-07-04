// Shared rendering for blog articles.
// Keeps the exact same markup/structure as the hand-written seed article
// so generated pages match the site design token-for-token.

/** Escape a value for safe use inside a double-quoted HTML attribute. */
export function attr(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escape for use inside HTML text content. */
export function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Vietnamese-friendly slug: strip diacritics, keep a-z0-9 and dashes. */
export function slugify(str) {
  return String(str)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const SITE = 'https://megiay.vercel.app';

/**
 * Full article page HTML. `data` fields:
 * slug, title, description, keywords, category, date (ISO), dateDisplay,
 * readMinutes, lede, bodyHtml.
 */
export function renderArticlePage(d) {
  const url = `${SITE}/blog/${d.slug}/`;
  const ogImage = d.heroImage || `${SITE}/images/og-cover.jpg`;
  const articleLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: d.title,
    description: d.description,
    datePublished: d.date,
    dateModified: d.date,
    author: { '@type': 'Organization', name: 'Megiay' },
    publisher: { '@type': 'Organization', name: 'Megiay', url: `${SITE}/` },
    mainEntityOfPage: url,
    image: ogImage,
  }, null, 2);
  const crumbLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/` },
      { '@type': 'ListItem', position: 3, name: d.title },
    ],
  }, null, 2);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-E467NPGTGD"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-E467NPGTGD');
</script>

<title>${esc(d.title)} | Megiay</title>
<meta name="description" content="${attr(d.description)}">
<meta name="keywords" content="${attr(d.keywords)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="author" content="Megiay">
<link rel="canonical" href="${url}">
<link rel="icon" type="image/png" sizes="32x32" href="../../favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="../../favicon-180.png">

<meta property="og:type" content="article">
<meta property="og:locale" content="vi_VN">
<meta property="og:site_name" content="Megiay">
<meta property="og:title" content="${attr(d.title)}">
<meta property="og:description" content="${attr(d.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${attr(ogImage)}">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/style.css">

<!-- Structured Data: Article -->
<script type="application/ld+json">
${articleLd}
</script>
<!-- Structured Data: Breadcrumb -->
<script type="application/ld+json">
${crumbLd}
</script>
</head>
<body>

<a class="skip-link" href="#main">Bỏ qua tới nội dung chính</a>

<header class="nav" id="top">
  <div class="wrap nav__inner">
    <a href="../../" class="brand" aria-label="Megiay trang chủ">
      <img src="../../assets/logo/megiay-horizontal-transparent.svg" alt="Megiay" class="brand__logo">
    </a>
    <nav class="nav__links" aria-label="Điều hướng chính">
      <a href="../../#services">Dịch vụ</a>
      <a href="../../#process">Quy trình</a>
      <a href="../../#pricing">Bảng giá</a>
      <a href="../">Blog</a>
      <a href="../../#faq">Hỏi đáp</a>
    </nav>
    <a href="../../#book" class="btn btn--sm">Đặt lịch ngay</a>
  </div>
</header>

<main id="main">

<div class="wrap">
  <nav class="breadcrumb" aria-label="Đường dẫn"><a href="../../">Trang chủ</a> / <a href="../">Blog</a> / ${esc(d.category || 'Cẩm nang')}</nav>
</div>

<article class="wrap article">
  <header class="article__head">
    <p class="article__meta">${esc(d.category || 'Cẩm nang')} · ${esc(d.dateDisplay)} · ${esc(String(d.readMinutes || 5))} phút đọc</p>
    <h1>${esc(d.title)}</h1>
    <p class="article__lede">${esc(d.lede)}</p>
  </header>
${d.heroImage ? `
  <figure class="article__hero">
    <img src="${attr(d.heroImage)}" alt="${attr(d.heroAlt || d.title)}" width="1200" height="675" loading="eager">
    ${d.heroCredit ? `<figcaption>Ảnh: <a href="${attr(d.heroCreditUrl || 'https://pexels.com')}" target="_blank" rel="noopener nofollow">${esc(d.heroCredit)}</a> / Pexels</figcaption>` : ''}
  </figure>
` : ''}

  <div class="prose">
${d.bodyHtml}
  </div>

  <div class="article__cta">
    <h3>Giày cứng đầu? Để Megiay lo.</h3>
    <p>Nhận & giao tận nơi trong nội thành TP.HCM. Cam kết sạch như mới hoặc hoàn tiền.</p>
    <a href="../../#book" class="btn">Đặt lịch lấy giày</a>
  </div>
</article>

</main>

<footer class="foot">
  <div class="wrap foot__grid">
    <div>
      <a href="../../" class="brand brand--foot" aria-label="Megiay trang chủ">
        <img src="../../assets/logo/megiay-horizontal-dark-transparent.svg" alt="Megiay" class="brand__logo">
      </a>
      <p>Vệ sinh & phục hồi giày cao cấp tại TP.HCM. Sạch như mới hoặc hoàn tiền.</p>
    </div>
    <div>
      <h4>Dịch vụ</h4>
      <a href="../../#services">Vệ sinh sneaker</a>
      <a href="../../#services">Vệ sinh giày da</a>
      <a href="../../#services">Khử mùi giày</a>
      <a href="../../#services">Phục hồi màu</a>
      <a href="../">Blog cẩm nang giày</a>
    </div>
    <div>
      <h4>Liên hệ</h4>
      <a href="tel:+84775996797">0775 996 797</a>
      <a href="https://www.google.com/maps?q=10.787894,106.776201" target="_blank" rel="noopener">CN1: 568 Nguyễn Duy Trinh, P. Bình Trưng, TP.HCM</a>
      <a href="https://maps.app.goo.gl/b6y9tKa2bbrD2FoD6" target="_blank" rel="noopener">CN2: 33 Đường 7, P. Bình Trưng, TP. Thủ Đức</a>
      <a href="https://www.facebook.com/Megiay.shop94" target="_blank" rel="noopener">Facebook: fb.com/Megiay.shop94</a>
      <a href="https://zalo.me/0775996797" target="_blank" rel="noopener">Zalo: 0775 996 797</a>
      <span class="foot__hours">08:00 – 21:00 mỗi ngày</span>
    </div>
  </div>
  <div class="wrap foot__bar"><p>© 2026 Megiay. Mọi quyền được bảo lưu.</p></div>
</footer>

<div class="floats" aria-label="Kênh liên hệ nhanh">
  <a href="https://zalo.me/0775996797" class="float-btn float-btn--zalo" target="_blank" rel="noopener" aria-label="Chat với chúng tôi qua Zalo">
    <span class="float-btn__word" aria-hidden="true">Zalo</span>
  </a>
  <a href="https://m.me/Megiay.shop94" class="float-btn float-btn--msgr" target="_blank" rel="noopener" aria-label="Chat với chúng tôi qua Facebook Messenger">
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.15.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.98-.87c.17-.08.36-.09.53-.04.91.25 1.88.38 2.91.38 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm6 7.46-2.94 4.66c-.47.74-1.47.93-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66c.47-.74 1.47-.93 2.17-.4l2.34 1.75c.21.16.51.16.72 0l3.16-2.4c.42-.32.97.18.69.63z"/>
    </svg>
  </a>
</div>

</body>
</html>
`;
}

/** Listing card HTML inserted into blog/index.html (newest first). */
export function renderCard(d) {
  const thumb = d.heroImage
    ? `        <a href="${esc(d.slug)}/" class="post-card__thumb"><img src="${attr(d.heroImage)}" alt="${attr(d.heroAlt || d.title)}" loading="lazy"></a>\n`
    : '';
  return `      <article class="post-card">
${thumb}        <p class="post-card__meta">${esc(d.category || 'Cẩm nang')} · ${esc(d.dateDisplay)}</p>
        <h2><a href="${esc(d.slug)}/">${esc(d.title)}</a></h2>
        <p>${esc(d.excerpt || d.lede)}</p>
        <span class="post-card__more">Đọc tiếp →</span>
      </article>`;
}

/** Sitemap <url> entry inserted between the SITEMAP markers. */
export function renderSitemapEntry(d) {
  return `  <url><loc>${SITE}/blog/${d.slug}/</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`;
}
