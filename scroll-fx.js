/*
 * Atlas Fuel — scroll effects layer (MinRes-style)
 *   1. PRONOUNCED parallax on hero / page-hero / full-bleed background images
 *   2. Hero copy fades + drifts up as the hero scrolls past
 *   3. Hero image gently zooms in as you scroll
 *   4. Scroll-reveal for any element with [data-reveal] or .reveal class
 */
(function () {
  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 1. PARALLAX (stronger rates so the effect is unmistakable) --------------
  const parallaxTargets = [
    { sel: '.hero__media img',      rate: 0.45 },
    { sel: '.page-hero__media img', rate: 0.38 },
    { sel: '.bleed__media img',     rate: 0.50 },
  ];

  const nodes = [];
  for (const { sel, rate } of parallaxTargets) {
    document.querySelectorAll(sel).forEach((el) => {
      el.style.willChange = 'transform';
      el.style.transformOrigin = 'center center';
      const parent = el.closest('.hero, .page-hero, .bleed') || el.parentElement;
      // Pre-scale so we have headroom for translation without revealing edges
      nodes.push({ el, rate, parent });
    });
  }

  let raf = 0;
  function update() {
    raf = 0;
    const vh = window.innerHeight;
    for (const n of nodes) {
      const rect = n.parent.getBoundingClientRect();
      if (rect.bottom < -300 || rect.top > vh + 300) continue;
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      const offset = progress * n.rate * 160; // px — pronounced
      // Subtle scale shift as the section passes — gives a "breathing" feel
      const scale = 1.18 - Math.abs(progress) * 0.04;
      n.el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    }
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  // 2. HERO COPY FADE + DRIFT (more pronounced) -----------------------------
  const heroContent = document.querySelector('.hero__content, .page-hero__content');
  if (heroContent) {
    heroContent.style.willChange = 'transform, opacity';
    const heroParent = heroContent.closest('.hero, .page-hero');
    let raf2 = 0;
    function updateHero() {
      raf2 = 0;
      const rect = heroParent.getBoundingClientRect();
      const h = rect.height;
      // progress: 0 at top of hero, 1 when hero has fully scrolled past
      const p = Math.min(1, Math.max(0, -rect.top / (h * 0.55)));
      heroContent.style.transform = `translate3d(0, ${(p * -60).toFixed(1)}px, 0)`;
      heroContent.style.opacity = (1 - p).toFixed(3);
    }
    window.addEventListener('scroll', () => { if (!raf2) raf2 = requestAnimationFrame(updateHero); }, { passive: true });
    updateHero();
  }

  // 3. CERTS CARD SCROLL FADE -----------------------------------------------
  const certs = document.querySelector('.hero__certs');
  if (certs) {
    certs.style.willChange = 'transform, opacity';
    const heroParent = certs.closest('.hero, .page-hero');
    let raf3 = 0;
    function updateCerts() {
      raf3 = 0;
      const rect = heroParent.getBoundingClientRect();
      const h = rect.height;
      const p = Math.min(1, Math.max(0, -rect.top / (h * 0.6)));
      certs.style.transform = `translate3d(0, ${(p * 40).toFixed(1)}px, 0)`;
      certs.style.opacity = (1 - p).toFixed(3);
    }
    window.addEventListener('scroll', () => { if (!raf3) raf3 = requestAnimationFrame(updateCerts); }, { passive: true });
    updateCerts();
  }

  // 4. SCROLL REVEAL (any .reveal element drifts up + fades in when entering viewport)
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('in'), (i % 4) * 80);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach((el) => io.observe(el));
  }
})();
