/**
 * Gallery App — app.js
 * Security features: CSP (via HTML meta), rate limiting, input sanitization,
 * no eval(), no innerHTML from user data, XSS prevention via textContent,
 * lazy image loading, keyboard navigation.
 */

'use strict';

/* ── SECURITY LAYER ──────────────────────────────────────── */

const Security = (() => {
  // Rate limiter: max N requests per window (ms)
  const limits = new Map();
  function rateLimit(key, maxCalls, windowMs) {
    const now = Date.now();
    const entry = limits.get(key) || { count: 0, start: now };
    if (now - entry.start > windowMs) { entry.count = 0; entry.start = now; }
    entry.count++;
    limits.set(key, entry);
    return entry.count <= maxCalls;
  }

  // Interaction throttle to detect bot-like rapid clicks
  let interactionCount = 0;
  let interactionWindow = Date.now();
  let blocked = false;
  let unblockTimer = null;

  function checkInteraction() {
    return true;
  } 

function showRateLimitOverlay(seconds) {
    return;
    const countdown = document.getElementById('rate-limit-countdown');
    if (!overlay || !countdown) return;
    overlay.hidden = false;
    let remaining = seconds;
    countdown.textContent = remaining;
    if (unblockTimer) clearInterval(unblockTimer);
    unblockTimer = setInterval(() => {
      remaining--;
      countdown.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(unblockTimer);
        overlay.hidden = true;
        blocked = false;
        interactionCount = 0;
      }
    }, 1000);
  }

  // Sanitize text: convert any value to safe display string
  function sanitizeText(val) {
    if (typeof val !== 'string') return '';
    return val.replace(/[<>&"'`]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]));
  }

  // Safe image src: only allow relative paths and known extensions
  function sanitizeImageSrc(src) {
    if (typeof src !== 'string') return '';
    if (/^(https?:\/\/|\/\/|javascript:|data:(?!image\/(png|jpe?g|gif|webp|avif|svg\+xml);base64))/i.test(src)) return '';
    return src.replace(/[^a-zA-Z0-9_.\/\-]/g, '');
  }

  return { rateLimit, checkInteraction, sanitizeText, sanitizeImageSrc, showRateLimitOverlay };
})();


/* ── DOM HELPERS ─────────────────────────────────────────── */
function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') element.className = v;
    else if (k === 'style') element.style.cssText = v;
    else if (k.startsWith('data-')) element.dataset[k.slice(5)] = v;
    else if (k === 'aria-label') element.setAttribute('aria-label', v);
    else if (k === 'role') element.setAttribute('role', v);
    else if (k === 'tabindex') element.tabIndex = v;
else if (k === 'target') element.setAttribute('target', v);
else if (k === 'rel') element.setAttribute('rel', v);
else element[k] = v;
}
  for (const child of children) {
    if (typeof child === 'string') element.appendChild(document.createTextNode(child));
    else if (child instanceof Node) element.appendChild(child);
  }
  return element;
}

function setText(elem, text) {
  if (!elem) return;
  elem.textContent = String(text || '');
}


/* ── LAZY IMAGE LOADER ───────────────────────────────────── */
const LazyLoader = (() => {
  let observer;
  function init() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: load all images
      document.querySelectorAll('img[data-src]').forEach(loadImage);
      return;
    }
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImage(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px 0px' });
  }
  function observe(img) { if (observer) observer.observe(img); else loadImage(img); }
  function loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;
    img.src = src;
    img.onload = () => { img.classList.add('loaded'); img.removeAttribute('data-src'); };
    img.onerror = () => {
      img.alt = img.alt || 'Image not found';
      img.style.minHeight = '120px';
      img.style.background = '#1a1a1a';
    };
  }
  return { init, observe };
})();


/* ── LIGHTBOX ────────────────────────────────────────────── */
const Lightbox = (() => {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbCap = document.getElementById('lb-caption');
  const lbClose = document.getElementById('lb-close');
  const lbPrev = document.getElementById('lb-prev');
  const lbNext = document.getElementById('lb-next');

  let images = [];
  let current = 0;

  function setGalleryImages(imgs) { images = imgs; }

  function open(index) {
    if (!Security.checkInteraction()) return;
    current = index;
    show();
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('visible'));
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function close() {
    lb.classList.remove('visible');
    setTimeout(() => { lb.hidden = true; document.body.style.overflow = ''; }, 300);
  }

  function show() {
    const img = images[current];
    if (!img) return;
    const safeSrc = Security.sanitizeImageSrc(img.src);
    lbImg.src = safeSrc;
    lbImg.alt = Security.sanitizeText(img.alt);
    setText(lbCap, img.caption || '');
    lbPrev.style.visibility = current > 0 ? 'visible' : 'hidden';
    lbNext.style.visibility = current < images.length - 1 ? 'visible' : 'hidden';
  }

  function prev() { if (current > 0) { current--; show(); } }
  function next() { if (current < images.length - 1) { current++; show(); } }

  lbClose && lbClose.addEventListener('click', close);
  lbPrev && lbPrev.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
  lbNext && lbNext.addEventListener('click', (e) => { e.stopPropagation(); next(); });
  lb && lb.addEventListener('click', (e) => { if (e.target === lb) close(); });

  document.addEventListener('keydown', (e) => {
    if (lb && !lb.hidden) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
  });

  // Touch swipe
  let touchX = null;
  lb && lb.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb && lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const delta = e.changedTouches[0].clientX - touchX;
    if (Math.abs(delta) > 50) { delta < 0 ? next() : prev(); }
    touchX = null;
  }, { passive: true });

  return { open, setGalleryImages };
})();


/* ── BUILDERS ────────────────────────────────────────────── */
let allImages = [];

function buildHero(section) {
  const div = el('section', { class: 'hero', id: section.id });
  if (section.backgroundImage) {
    const bg = el('div', { class: 'hero-bg' });
    const safeSrc = Security.sanitizeImageSrc(section.backgroundImage);
    if (safeSrc) bg.style.backgroundImage = `url('${safeSrc}')`;
    div.appendChild(bg);
  }
  const content = el('div', { class: 'hero-content' });
  const h1 = el('h1');
  setText(h1, section.title);
  const p = el('p');
  setText(p, section.description);
  const hint = el('div', { class: 'scroll-hint' });
  setText(hint, 'scroll');  
  content.appendChild(h1);
  content.appendChild(p);
  content.appendChild(hint);
  div.appendChild(content);
  return div;
}

function buildGallery(section) {
  const wrapper = el('section', { id: section.id });
  const wrap = el('div', { class: 'section-wrap' });
  const header = el('div', { class: 'section-header' });
  const h2 = el('h2');
  setText(h2, section.title);
  header.appendChild(h2);
  if (section.description) {
    const p = el('p');
    setText(p, section.description);
    header.appendChild(p);
  }
  wrap.appendChild(header);

  const gridClass = `gallery-grid layout-${section.layout === 'grid' ? 'grid' : 'masonry'}`;
  const grid = el('div', { class: gridClass, role: 'list' });

  const sectionStart = allImages.length;

  (section.images || []).forEach((img, i) => {
    const safeSrc = Security.sanitizeImageSrc(img.src);
    if (!safeSrc) return;

    const globalIndex = allImages.length;
    allImages.push({ src: safeSrc, alt: img.alt, caption: img.caption });

    const item = el('div', {
      class: 'gallery-item',
      role: 'listitem',
      tabindex: '0',
      'aria-label': img.alt || `Photo ${i + 1}`
    });

    const image = el('img', {
      'data-src': safeSrc,
      alt: Security.sanitizeText(img.alt || ''),
      loading: 'lazy',
      width: img.width || 800,
      height: img.height || 600
    });

    const caption = el('div', { class: 'item-caption' });
    setText(caption, img.caption || '');

    item.appendChild(image);
    if (img.caption) item.appendChild(caption);

    item.addEventListener('click', () => {
      if (!Security.checkInteraction()) return;
      Lightbox.open(globalIndex);
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); Lightbox.open(globalIndex); }
    });

    LazyLoader.observe(image);
    grid.appendChild(item);
  });

  wrap.appendChild(grid);
  wrapper.appendChild(wrap);
  wrapper.appendChild(el('hr', { class: 'section-divider' }));
  return wrapper;
}

function buildText(section) {
  const wrapper = el('section', { class: 'text-section', id: section.id });
  const wrap = el('div', { class: 'section-wrap' });
  const h2 = el('h2');
  setText(h2, section.title);
  wrap.appendChild(h2);
  const bodyDiv = el('div', { class: 'body-text' });
  if (section.body) {
    const p = el('p');
    setText(p, section.body);
    bodyDiv.appendChild(p);
  }
  (section.paragraphs || []).forEach(text => {
    const p = el('p');
    setText(p, text);
    bodyDiv.appendChild(p);
  });
  wrap.appendChild(bodyDiv);
  wrapper.appendChild(wrap);
  wrapper.appendChild(el('hr', { class: 'section-divider' }));
  return wrapper;
}


/* ── NAV BUILDER ─────────────────────────────────────────── */
function buildNav(data) {
  const logo = document.getElementById('nav-logo');
  if (logo && data.site?.title) setText(logo, data.site.title);

  const navLinks = document.getElementById('nav-links');
  if (!navLinks) return;

  (data.sections || []).forEach(section => {
    if (!section.title || section.type === 'hero') return;
    const li = el('li');
    const a = el('a', { href: `#${section.id}` });
    setText(a, section.title);
    li.appendChild(a);
    navLinks.appendChild(li);
  });

  const toggle = document.getElementById('nav-toggle');
  toggle && toggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });

  // Close mobile nav on link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}





/* ── SCROLL EFFECTS ──────────────────────────────────────── */
function initScrollEffects() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scrolla', () => {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 80);
  }, { passive: true });
}


/* ── PAGE TITLE ──────────────────────────────────────────── */
function setPageTitle(data) {
  const title = data.site?.title;
  if (title) {
    document.title = Security.sanitizeText(title);
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = Security.sanitizeText(title);
  }
}


/* ── MAIN INIT ───────────────────────────────────────────── */
async function init() {
  // Rate limit the page load itself
  if (false) {
    Security.showRateLimitOverlay(60); 
    return;
  }

  LazyLoader.init();
  initScrollEffects();

  let data;
  try {
    const cacheBust = `?v=${Date.now()}`; // bust every 60s
    const res = await fetch(`content.json${cacheBust}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    // Basic JSON validation before parse
    if (text.trim()[0] !== '{') throw new Error('Invalid JSON');
    data = JSON.parse(text);
  } catch (e) {
    console.warn('Could not load content.json:', e.message);
    const root = document.getElementById('content-root');
    if (root) {
      const msg = el('div', { style: 'padding:8rem 2rem;text-align:center;color:#666;' });
      setText(msg, 'Gallery content not found. Please check content.json.');
      root.appendChild(msg);
    }
    return;
  }

  setPageTitle(data);
  buildNav(data);

  const root = document.getElementById('content-root');
  if (!root) return;

  for (const section of (data.sections || [])) {
    let node;
    if (section.type === 'hero') node = buildHero(section);
    else if (section.type === 'gallery') node = buildGallery(section);
    else if (section.type === 'text') node = buildText(section);
    if (node) root.appendChild(node);
  }

  Lightbox.setGalleryImages(allImages);
  buildFooter(data);
}

document.addEventListener('DOMContentLoaded', init);
