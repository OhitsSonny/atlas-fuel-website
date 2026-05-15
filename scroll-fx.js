/*
 * Atlas Fuel — scroll effects (MinRes-matched: subtle, native-feeling)
 *
 * MinRes uses native smooth scroll with IntersectionObserver-driven reveals
 * on content blocks. The hero scrolls normally. We mirror that here.
 *
 *   1. Gentle scroll-reveal: .reveal elements fade + drift up when entering viewport
 *   2. Very subtle parallax (~8%) on the main hero image only — barely perceptible,
 *      adds atmospheric depth without breaking the calm scroll feel
 *   3. Hero copy gently fades as you scroll past the hero
 */
(function () {
  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 1. SCROLL REVEAL --------------------------------------------------------
  // Any element with class "reveal" or [data-reveal] fades up as it enters viewport.
  const revealEls = document.querySelectorAll('.reveal, [data-reveal]');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger siblings entering in same frame (max 4-stagger)
          setTimeout(() => entry.target.classList.add('in'), Math.min(i, 4) * 70);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  }

  // 2. SUBTLE HERO PARALLAX -------------------------------------------------
  // MinRes uses essentially native scroll. We add a very subtle (~8%)
  // parallax to the homepage hero only — adds depth without distracting.
  const heroImg = document.querySelector('.hero__media img');
  const heroSection = document.querySelector('.hero');
  if (heroImg && heroSection) {
    heroImg.style.willChange = 'transform';
    heroImg.style.transformOrigin = 'center center';
    let raf = 0;
    function update() {
      raf = 0;
      const rect = heroSection.getBoundingClientRect();
      if (rect.bottom < 0) return;
      // Page scroll within the hero — translate the image at 8% of scroll speed
      const offset = -rect.top * 0.08;
      heroImg.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.06)`;
    }
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  // 4. BACK-TO-TOP BUTTON ---------------------------------------------------
  // A small floating button that appears after scrolling past the hero
  const btt = document.createElement('button');
  btt.className = 'back-to-top';
  btt.setAttribute('aria-label', 'Scroll back to top');
  btt.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 13V3M3 8l5-5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(btt);
  let bttRaf = 0;
  function updateBtt() {
    bttRaf = 0;
    btt.classList.toggle('visible', window.scrollY > 600);
  }
  window.addEventListener('scroll', () => { if (!bttRaf) bttRaf = requestAnimationFrame(updateBtt); }, { passive: true });
  updateBtt();

  // 3. HERO COPY GENTLE FADE ------------------------------------------------
  const heroContent = document.querySelector('.hero__content, .page-hero__content');
  if (heroContent) {
    heroContent.style.willChange = 'opacity';
    const heroParent = heroContent.closest('.hero, .page-hero');
    let raf2 = 0;
    function updateHero() {
      raf2 = 0;
      const rect = heroParent.getBoundingClientRect();
      const h = rect.height;
      const p = Math.min(1, Math.max(0, -rect.top / h));
      heroContent.style.opacity = (1 - p * 0.7).toFixed(3);
    }
    window.addEventListener('scroll', () => { if (!raf2) raf2 = requestAnimationFrame(updateHero); }, { passive: true });
    updateHero();
  }
})();
