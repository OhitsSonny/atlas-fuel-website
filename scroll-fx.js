/*
 * Atlas Fuel — scroll effects layer
 *   1. Parallax on full-bleed background images (.hero__media, .page-hero__media, .bleed__media)
 *   2. Hero copy fades + drifts as the hero scrolls past (sticky-feel without break-the-flow stickiness)
 *   3. Image gentle zoom on entry for cards
 *   4. Smoother momentum on wheel input (subtle, opt-out via prefers-reduced-motion)
 */
(function () {
  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 1. PARALLAX --------------------------------------------------------------
  const parallaxTargets = [
    { sel: '.hero__media img',      rate: 0.22 },
    { sel: '.page-hero__media img', rate: 0.18 },
    { sel: '.bleed__media img',     rate: 0.28 },
  ];

  const nodes = [];
  for (const { sel, rate } of parallaxTargets) {
    document.querySelectorAll(sel).forEach((el) => {
      el.style.willChange = 'transform';
      el.style.transformOrigin = 'center center';
      const parent = el.closest('.hero, .page-hero, .bleed') || el.parentElement;
      nodes.push({ el, rate, parent });
    });
  }

  let raf = 0;
  function update() {
    raf = 0;
    const vh = window.innerHeight;
    for (const n of nodes) {
      const rect = n.parent.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) continue;
      // Offset goes from -1 (section entering from bottom) through 0 (centered) to +1 (leaving top)
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      const offset = progress * n.rate * 100; // px
      n.el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.08)`;
    }
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  // 2. HERO COPY FADE + DRIFT ------------------------------------------------
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
      const p = Math.min(1, Math.max(0, -rect.top / (h * 0.7)));
      heroContent.style.transform = `translate3d(0, ${(p * -30).toFixed(1)}px, 0)`;
      heroContent.style.opacity = (1 - p * 0.85).toFixed(3);
    }
    window.addEventListener('scroll', () => { if (!raf2) raf2 = requestAnimationFrame(updateHero); }, { passive: true });
    updateHero();
  }

  // (Wheel-input momentum smoothing removed — native scroll is the most accessible UX.)
})();
