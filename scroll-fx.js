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

  // 3. SUBTLE MOMENTUM SCROLL (wheel-input smoothing) -----------------------
  // Wheel input on mac trackpad is already smooth; on mouse wheel it isn't.
  // We lerp the scroll position for a gentler feel. Touch is untouched.
  const lerpScroll = (() => {
    let target = window.scrollY;
    let current = window.scrollY;
    let active = false;
    let ticking = false;
    const FACTOR = 0.18; // higher = snappier

    function onWheel(e) {
      // Skip if user is using a touch device or trackpad with small deltas
      if (e.deltaMode !== 0) return; // pixel mode only
      if (Math.abs(e.deltaY) < 4) return;
      // Don't hijack inside scrollable subtrees
      let t = e.target;
      while (t && t !== document.body) {
        const style = getComputedStyle(t);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && t.scrollHeight > t.clientHeight) return;
        t = t.parentElement;
      }
      e.preventDefault();
      target = Math.max(0, Math.min(document.documentElement.scrollHeight - window.innerHeight, target + e.deltaY));
      active = true;
      if (!ticking) tick();
    }

    function tick() {
      ticking = true;
      current += (target - current) * FACTOR;
      if (Math.abs(target - current) < 0.5) {
        current = target;
        ticking = false;
        active = false;
        window.scrollTo(0, current);
        return;
      }
      window.scrollTo(0, current);
      requestAnimationFrame(tick);
    }

    // Sync target when user scrolls another way (touch, scrollbar, keyboard)
    window.addEventListener('scroll', () => {
      if (!active) { target = window.scrollY; current = window.scrollY; }
    }, { passive: true });

    return { attach() { window.addEventListener('wheel', onWheel, { passive: false }); } };
  })();
  // Only enable lerp on devices that look like they have a mouse (coarse miss → fine pointer present)
  if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    lerpScroll.attach();
  }
})();
