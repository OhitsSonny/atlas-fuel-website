/*
 * Atlas Fuel — Cinematic scroll layer (Lenis + GSAP + ScrollTrigger)
 *
 * - Lenis: buttery smooth wheel/trackpad scrolling
 * - GSAP ScrollTrigger: scrub-driven hero, parallax bleed, split-section reveals
 * - Stat counters, image scale-on-enter, choreographed timing
 * - prefers-reduced-motion: skip everything
 */
(function () {
  if (typeof window === 'undefined') return;
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -------------------------------------------------------------------------
  // BACK-TO-TOP BUTTON (works without GSAP) ---------------------------------
  // -------------------------------------------------------------------------
  const btt = document.createElement('button');
  btt.className = 'back-to-top';
  btt.setAttribute('aria-label', 'Scroll back to top');
  btt.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 13V3M3 8l5-5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  btt.addEventListener('click', () => {
    if (window.lenis && window.lenis.scrollTo) { window.lenis.scrollTo(0, { duration: 1.4 }); }
    else { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  document.body.appendChild(btt);
  let bttRaf = 0;
  function updateBtt() { bttRaf = 0; btt.classList.toggle('visible', window.scrollY > 600); }
  window.addEventListener('scroll', () => { if (!bttRaf) bttRaf = requestAnimationFrame(updateBtt); }, { passive: true });
  updateBtt();

  if (prefersReduced) return;

  // -------------------------------------------------------------------------
  // INTERSECTION-OBSERVER REVEAL (baseline, ScrollTrigger augments later) ---
  // -------------------------------------------------------------------------
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('in'), Math.min(i, 4) * 70);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  }

  // -------------------------------------------------------------------------
  // WAIT FOR LENIS + GSAP + ScrollTrigger TO BE LOADED ----------------------
  // -------------------------------------------------------------------------
  function ready() {
    if (!window.gsap || !window.ScrollTrigger || !window.Lenis) {
      return setTimeout(ready, 60);
    }
    initCinematic();
  }
  ready();

  function initCinematic() {
    const { gsap, ScrollTrigger, Lenis } = window;
    gsap.registerPlugin(ScrollTrigger);

    // ----- LENIS SMOOTH SCROLL ---------------------------------------------
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),  // exponential ease-out, matches premium feel
      smoothWheel: true,
      smoothTouch: false,
      touchMultiplier: 1.6,
      wheelMultiplier: 1.0,
    });
    window.lenis = lenis;

    // Bind Lenis to ScrollTrigger so scrub animations run on lenis frames
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // Anchor click → Lenis scroll
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((a) => {
      a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80, duration: 1.4 });
      });
    });

    // ----- HERO: image scale + content drift+fade on scrub -----------------
    const hero = document.querySelector('.hero');
    if (hero) {
      const heroImg = hero.querySelector('.hero__media img');
      const heroContent = hero.querySelector('.hero__content');

      if (heroImg) {
        gsap.set(heroImg, { scale: 1.06, transformOrigin: '50% 60%' });
        gsap.to(heroImg, {
          scale: 1.20,
          y: () => hero.offsetHeight * 0.22,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
            invalidateOnRefresh: true,
          }
        });
      }
      if (heroContent) {
        gsap.to(heroContent, {
          y: -110,
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: '70% top',
            scrub: 0.6,
          }
        });
      }

      // HERO entrance: stagger reveal of children on load
      const kids = heroContent ? heroContent.querySelectorAll(':scope > *') : [];
      if (kids.length) {
        gsap.from(kids, {
          y: 70, opacity: 0, duration: 1.1, stagger: 0.10,
          ease: 'expo.out', delay: 0.25, clearProps: 'transform',
        });
      }
    }

    // ----- PAGE-HERO: image parallax + content drift (inner pages) ---------
    document.querySelectorAll('.page-hero').forEach((ph) => {
      const img = ph.querySelector('.page-hero__media img');
      const content = ph.querySelector('.page-hero__content');
      if (img) {
        gsap.set(img, { scale: 1.06, transformOrigin: '50% 55%' });
        gsap.to(img, {
          scale: 1.18, y: () => ph.offsetHeight * 0.20, ease: 'none',
          scrollTrigger: { trigger: ph, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true }
        });
      }
      if (content) {
        gsap.to(content, {
          y: -70, opacity: 0, ease: 'none',
          scrollTrigger: { trigger: ph, start: 'top top', end: '80% top', scrub: 0.6 }
        });
        gsap.from(content.querySelectorAll(':scope > *'), {
          y: 50, opacity: 0, duration: 1.0, stagger: 0.09,
          ease: 'expo.out', delay: 0.2, clearProps: 'transform',
        });
      }
    });

    // ----- FULL-BLEED SECTIONS: image parallax-scale through viewport ------
    document.querySelectorAll('.bleed').forEach((bleed) => {
      const img = bleed.querySelector('.bleed__media img');
      if (!img) return;
      gsap.set(img, { scale: 1.15, transformOrigin: '50% 50%' });
      gsap.fromTo(img,
        { yPercent: -8 },
        {
          yPercent: 8, ease: 'none',
          scrollTrigger: {
            trigger: bleed, start: 'top bottom', end: 'bottom top', scrub: 0.8, invalidateOnRefresh: true,
          }
        });
      // Content inside bleed: rises in as section approaches viewport center
      const inner = bleed.querySelector(':scope > .container');
      if (inner) {
        gsap.from(inner.querySelectorAll(':scope > div, :scope > *'), {
          y: 60, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out',
          scrollTrigger: { trigger: bleed, start: 'top 70%', once: true }
        });
      }
    });

    // ----- IMAGE-TEXT SPLITS: media slides + scales, content staggers ------
    document.querySelectorAll('.split').forEach((split) => {
      const media = split.querySelector('.split__media');
      const content = split.querySelector('.split__content');
      const mediaImg = media ? media.querySelector('img') : null;

      const tl = gsap.timeline({
        scrollTrigger: { trigger: split, start: 'top 75%', once: true }
      });

      if (media) {
        tl.from(media, { opacity: 0, y: 50, duration: 1.1, ease: 'expo.out' }, 0);
      }
      if (mediaImg) {
        tl.fromTo(mediaImg, { scale: 1.25 }, { scale: 1.0, duration: 1.6, ease: 'expo.out', clearProps: 'transform' }, 0);
      }
      if (content) {
        const kids = content.querySelectorAll(':scope > *');
        tl.from(kids, { y: 40, opacity: 0, duration: 1.0, stagger: 0.08, ease: 'expo.out', clearProps: 'transform' }, 0.15);
      }
    });

    // ----- CARDS / STATS / TILES: scrub-free rise-in batch -----------------
    const batchSel = '.scard, .card, .value, .pillar, .trust-tile, .station, .step, .stat, .tl-item, .role, .contact-card, .hero__cert';
    ScrollTrigger.batch(batchSel, {
      start: 'top 88%',
      onEnter: (els) => {
        gsap.fromTo(els,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 1.05, stagger: 0.08, ease: 'expo.out', overwrite: 'auto', clearProps: 'transform' }
        );
      },
      onEnterBack: (els) => {
        gsap.to(els, { opacity: 1, y: 0, duration: 0.6, stagger: 0.04, ease: 'expo.out', overwrite: 'auto' });
      },
    });

    // ----- SECTION HEADS: reveal eyebrow → rule → h2 → lead with stagger ---
    document.querySelectorAll('.section-head').forEach((head) => {
      const items = head.querySelectorAll(':scope > *');
      gsap.from(items, {
        y: 32, opacity: 0, duration: 1.0, stagger: 0.10, ease: 'expo.out', clearProps: 'transform',
        scrollTrigger: { trigger: head, start: 'top 85%', once: true }
      });
    });

    // ----- STAT NUMBERS: count up on enter ---------------------------------
    document.querySelectorAll('.stat__num').forEach((el) => {
      const html = el.innerHTML;
      const match = html.match(/^(\d{1,4})(.*)$/s);  // leading integer + rest
      if (!match) return;  // e.g. "24/7", "AUS"
      const target = parseInt(match[1], 10);
      const rest = match[2];
      const counter = { n: 0 };
      el.innerHTML = '0' + rest;
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.to(counter, {
            n: target,
            duration: Math.min(2.0, Math.max(1.0, target / 50)),
            ease: 'power2.out',
            onUpdate: () => { el.innerHTML = Math.round(counter.n) + rest; }
          });
        }
      });
    });

    // ----- IMAGES INSIDE .media WRAPPER: scale-in when entering viewport ---
    document.querySelectorAll('.section .media img, .section--bone .media img').forEach((img) => {
      gsap.fromTo(img,
        { scale: 1.12 },
        {
          scale: 1.0, ease: 'expo.out', duration: 1.6,
          scrollTrigger: { trigger: img.closest('.media') || img, start: 'top 88%', once: true }
        }
      );
    });

    // ----- HEADINGS H2 LINE REVEAL (subtle mask, only on .section--bone/section levels)
    document.querySelectorAll('.section h2, .section--bone h2, .bleed h2').forEach((h) => {
      gsap.from(h, {
        y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', clearProps: 'transform',
        scrollTrigger: { trigger: h, start: 'top 88%', once: true }
      });
    });

    // ----- HERO CERTS card: scrub-fade as you scroll past hero -------------
    const certs = document.querySelector('.hero__certs');
    if (certs && hero) {
      gsap.to(certs, {
        y: 60, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: '85% top', scrub: 0.6 }
      });
    }

    // ----- Refresh after fonts and any late images load --------------------
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
