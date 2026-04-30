/**
 * main.js — Portfolio JavaScript
 * Author : Sidharth Vijayan Krishnan
 * Modules:
 *   1. ThemeManager    — dark/light + localStorage + OS preference
 *   2. NavigationManager — compact nav, active links, mobile menu (a11y)
 *   3. ScrollReveal    — IntersectionObserver entrance animations
 *   4. CounterAnimation — eased count-up on scroll into view
 *   5. SmoothScroll    — offset-aware anchor nav, prefers-reduced-motion
 *   6. FooterYear      — auto copyright year
 *   7. KeyboardA11y    — focus trap in mobile menu
 *   8. ScrollProgress  — GPU-composited progress bar
 *   9. CursorGlow      — radial spotlight, pointer:fine only, rAF-throttled
 *  10. bootstrap       — init all modules
 *
 * Note: 'use strict' omitted — ES module scope enforces it automatically.
 */

/* ─── 1. THEME MANAGER ─────────────────── */
const ThemeManager = (() => {
  const ROOT        = document.documentElement;
  const STORAGE_KEY = 'svk-portfolio-theme';
  const TOGGLE_BTN  = document.getElementById('themeToggle');

  const getPreferred = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const getSaved = () => localStorage.getItem(STORAGE_KEY);

  const apply = (theme) => {
    ROOT.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    if (TOGGLE_BTN) {
      const isDark = theme === 'dark';
      TOGGLE_BTN.setAttribute('aria-label',  isDark ? 'Switch to light mode' : 'Switch to dark mode');
      TOGGLE_BTN.setAttribute('aria-pressed', String(isDark));
    }
  };

  const init = () => {
    apply(getSaved() ?? getPreferred());
    TOGGLE_BTN?.addEventListener('click', () =>
      apply(ROOT.getAttribute('data-theme') === 'dark' ? 'light' : 'dark')
    );
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!getSaved()) apply(e.matches ? 'dark' : 'light');
    });
  };

  return { init };
})();

/* ─── 2. NAVIGATION MANAGER ────────────── */
const NavigationManager = (() => {
  const NAV         = document.querySelector('.nav');
  const HAMBURGER   = document.getElementById('hamburger');
  const MOBILE_MENU = document.getElementById('mobileMenu');
  const NAV_LINKS   = document.querySelectorAll('.nav__link');
  const SECTIONS    = document.querySelectorAll('section[id]');
  const THRESHOLD   = 60;
  let isMobileOpen  = false;

  const updateActiveLink = () => {
    let current = '';
    SECTIONS.forEach((s) => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    NAV_LINKS.forEach((l) =>
      l.classList.toggle('is-active', l.getAttribute('href') === `#${current}`)
    );
  };

  const closeMobile = () => {
    if (!isMobileOpen) return;
    isMobileOpen = false;
    HAMBURGER?.setAttribute('aria-expanded', 'false');
    if (MOBILE_MENU) MOBILE_MENU.hidden = true;
    HAMBURGER?.focus(); // WCAG 2.1 SC 2.4.3 — restore focus
  };

  const init = () => {
    window.addEventListener('scroll', () => {
      NAV?.classList.toggle('is-compact', window.scrollY > THRESHOLD);
      updateActiveLink();
    }, { passive: true });

    HAMBURGER?.addEventListener('click', () => {
      isMobileOpen = !isMobileOpen;
      HAMBURGER.setAttribute('aria-expanded', String(isMobileOpen));
      if (MOBILE_MENU) MOBILE_MENU.hidden = !isMobileOpen;
    });

    MOBILE_MENU?.querySelectorAll('.mobile-menu__link').forEach((l) =>
      l.addEventListener('click', closeMobile)
    );
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMobile(); });
    window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
      if (e.matches) closeMobile();
    });

    updateActiveLink();
  };

  return { init };
})();

/* ─── 3. SCROLL REVEAL ─────────────────── */
const ScrollReveal = (() => {
  const obs = new IntersectionObserver(
    (entries, o) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); o.unobserve(e.target); }
    }),
    { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
  );
  const init = () => document.querySelectorAll('.js-reveal').forEach((el) => obs.observe(el));
  return { init };
})();

/* ─── 4. COUNTER ANIMATION ─────────────── */
const CounterAnimation = (() => {
  const DURATION = 1600;

  const animate = (el, target, suffix) => {
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / DURATION, 1);
      el.textContent = `${Math.round((1 - Math.pow(1 - p, 3)) * target)}${suffix}`;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const obs = new IntersectionObserver(
    (entries, o) => entries.forEach((e) => {
      if (e.isIntersecting) {
        animate(e.target, +e.target.dataset.target, e.target.dataset.suffix ?? '');
        o.unobserve(e.target);
      }
    }),
    { threshold: 0.6 }
  );

  const init = () => document.querySelectorAll('[data-target]').forEach((el) => obs.observe(el));
  return { init };
})();

/* ─── 5. SMOOTH SCROLL ─────────────────── */
const SmoothScroll = (() => {
  const navH = () =>
    parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'), 10) || 64;

  const scrollTo = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - navH() - 16;
    window.scrollTo({
      top,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  };

  const init = () => {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1);
        if (!id || !document.getElementById(id)) return;
        e.preventDefault();
        scrollTo(id);
        history.pushState(null, '', `#${id}`);
      });
    });
  };

  return { init };
})();

/* ─── 6. FOOTER YEAR ───────────────────── */
const FooterYear = (() => {
  const init = () => {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  };
  return { init };
})();

/* ─── 7. KEYBOARD A11Y ─────────────────── */
const KeyboardA11y = (() => {
  const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const trapFocus = (container) => {
    const els   = [...container.querySelectorAll(FOCUSABLE)];
    const first = els[0];
    const last  = els[els.length - 1];
    container.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  };

  const init = () => {
    const menu = document.getElementById('mobileMenu');
    if (menu) trapFocus(menu);
  };
  return { init };
})();

/* ─── 8. SCROLL PROGRESS ───────────────── */
const ScrollProgress = (() => {
  let bar = null;

  const update = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (bar && total > 0)
      bar.style.transform = `scaleX(${Math.min(window.scrollY / total, 1)})`;
  };

  const init = () => {
    bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.prepend(bar);
    window.addEventListener('scroll', update, { passive: true });
    update();
  };

  return { init };
})();

/* ─── 9. CURSOR GLOW ───────────────────── */
const CursorGlow = (() => {
  const init = () => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);

    let cx = window.innerWidth / 2, cy = window.innerHeight / 2, pending = false;

    const render = () => {
      glow.style.left = `${cx}px`;
      glow.style.top  = `${cy}px`;
      pending = false;
    };

    document.addEventListener('mousemove', (e) => {
      cx = e.clientX; cy = e.clientY;
      if (!pending) { pending = true; requestAnimationFrame(render); }
    });

    document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { glow.style.opacity = ''; });
  };

  return { init };
})();

/* ─── 10. BOOTSTRAP ────────────────────── */
const bootstrap = () => {
  ThemeManager.init();
  NavigationManager.init();
  ScrollReveal.init();
  CounterAnimation.init();
  SmoothScroll.init();
  FooterYear.init();
  KeyboardA11y.init();
  ScrollProgress.init();
  CursorGlow.init();
};

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', bootstrap)
  : bootstrap();
