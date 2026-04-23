/**
 * main.js — Portfolio JavaScript
 * Author : Sidharth Vijayan Krishnan
 * Style  : ES6+ modules, functional decomposition, no framework dependencies
 *
 * Module overview:
 *   1. ThemeManager       — dark/light mode with localStorage persistence
 *   2. NavigationManager  — compact nav on scroll, active link tracking, mobile menu
 *   3. ScrollReveal       — IntersectionObserver-based entrance animations
 *   4. CounterAnimation   — animated numeric stats (eased count-up)
 *   5. SmoothScroll       — offset-aware anchor scroll (accounts for fixed nav)
 *   6. FooterYear         — auto-updating copyright year
 *   7. KeyboardA11y       — focus trap inside open mobile menu
 *   8. bootstrap          — wires everything together on DOMContentLoaded
 *
 * Note: 'use strict' is intentionally omitted. This file is loaded with
 * type="module", which the ECMAScript spec mandates runs in strict mode
 * automatically. The directive would be redundant.
 */

/* ─────────────────────────────────────────
   1. THEME MANAGER
   Persists the user's dark/light preference in localStorage.
   Falls back to the OS-level prefers-color-scheme media query
   if no preference has been saved yet.
   The theme is applied by setting data-theme on <html>;
   CSS variables in variables.css handle the visual swap.
───────────────────────────────────────── */
const ThemeManager = (() => {
  const ROOT        = document.documentElement;
  const STORAGE_KEY = 'svk-portfolio-theme';
  const TOGGLE_BTN  = document.getElementById('themeToggle');

  /** Read the OS-level colour scheme preference */
  const getPreferred = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  /** Read the last explicitly chosen theme from localStorage */
  const getSaved = () => localStorage.getItem(STORAGE_KEY);

  /**
   * Apply a theme by setting the data-theme attribute on <html>.
   * Also updates the toggle button's aria-label (describes the *action*,
   * i.e. "switch to light mode" when currently dark) and aria-pressed
   * (reflects the current toggle state for assistive technologies).
   */
  const apply = (theme) => {
    ROOT.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    if (TOGGLE_BTN) {
      const isDark = theme === 'dark';
      // aria-label: describes what will happen on click (the action)
      TOGGLE_BTN.setAttribute(
        'aria-label',
        isDark ? 'Switch to light mode' : 'Switch to dark mode'
      );
      // aria-pressed: reflects the current state for screen readers.
      // Convention: "dark mode ON" = pressed = true.
      TOGGLE_BTN.setAttribute('aria-pressed', String(isDark));
    }
  };

  /** Toggle between dark and light */
  const toggle = () => {
    const current = ROOT.getAttribute('data-theme');
    apply(current === 'dark' ? 'light' : 'dark');
  };

  const init = () => {
    // Prefer saved preference; fall back to OS setting
    const theme = getSaved() ?? getPreferred();
    apply(theme);
    TOGGLE_BTN?.addEventListener('click', toggle);

    // Respond to live OS preference changes only when the user hasn't
    // overridden it — avoids fighting an explicit saved choice.
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (!getSaved()) apply(e.matches ? 'dark' : 'light');
      });
  };

  return { init };
})();


/* ─────────────────────────────────────────
   2. NAVIGATION MANAGER
   Three responsibilities:
     a) Compact nav — adds .is-compact to shrink the nav bar after scrolling
        past the hero, giving content more vertical space.
     b) Active link — highlights the nav link corresponding to whichever
        section currently occupies the top of the viewport.
     c) Mobile menu — toggles the off-canvas menu, manages aria-expanded
        state, closes on link click / Escape / viewport resize.
        Focus is returned to the hamburger button on close (WCAG 2.1 SC 2.4.3).
───────────────────────────────────────── */
const NavigationManager = (() => {
  const NAV         = document.querySelector('.nav');
  const HAMBURGER   = document.getElementById('hamburger');
  const MOBILE_MENU = document.getElementById('mobileMenu');
  const NAV_LINKS   = document.querySelectorAll('.nav__link');
  const SECTIONS    = document.querySelectorAll('section[id]');

  // Nav compacts once the user has scrolled past this threshold (px)
  const SCROLL_THRESHOLD = 60;

  let isMobileOpen = false;

  /* ── a) Compact nav on scroll ── */
  const onScroll = () => {
    NAV?.classList.toggle('is-compact', window.scrollY > SCROLL_THRESHOLD);
    updateActiveLink();
  };

  /* ── b) Active link tracking ── */
  const updateActiveLink = () => {
    let currentId = '';

    SECTIONS.forEach((section) => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) currentId = section.getAttribute('id');
    });

    NAV_LINKS.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${currentId}`;
      link.classList.toggle('is-active', isActive);
    });
  };

  /* ── c) Mobile menu ── */
  const toggleMobile = () => {
    isMobileOpen = !isMobileOpen;
    HAMBURGER?.setAttribute('aria-expanded', String(isMobileOpen));
    if (MOBILE_MENU) MOBILE_MENU.hidden = !isMobileOpen;
  };

  const closeMobile = () => {
    if (!isMobileOpen) return;
    isMobileOpen = false;
    HAMBURGER?.setAttribute('aria-expanded', 'false');
    if (MOBILE_MENU) MOBILE_MENU.hidden = true;
    // Return focus to the trigger element so keyboard and screen-reader
    // users remain oriented after the overlay closes.
    // WCAG 2.1 Success Criterion 2.4.3 — Focus Order.
    HAMBURGER?.focus();
  };

  const init = () => {
    window.addEventListener('scroll', onScroll, { passive: true });
    HAMBURGER?.addEventListener('click', toggleMobile);

    // Close menu when a nav link is tapped
    MOBILE_MENU?.querySelectorAll('.mobile-menu__link').forEach((link) => {
      link.addEventListener('click', closeMobile);
    });

    // Escape closes overlays — standard accessibility pattern
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobile();
    });

    // Close if viewport grows past the mobile breakpoint (e.g. rotation)
    window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
      if (e.matches) closeMobile();
    });

    updateActiveLink();
  };

  return { init };
})();


/* ─────────────────────────────────────────
   3. SCROLL REVEAL
   Uses IntersectionObserver to add .is-visible to elements
   marked with .js-reveal, triggering the CSS transition
   defined in layout.css (opacity + translateY).
───────────────────────────────────────── */
const ScrollReveal = (() => {
  const SELECTOR  = '.js-reveal';
  const CSS_CLASS = 'is-visible';

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(CSS_CLASS);
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold:  0.12,
      rootMargin: '0px 0px -48px 0px',
    }
  );

  const init = () => {
    document.querySelectorAll(SELECTOR).forEach((el) => observer.observe(el));
  };

  return { init };
})();


/* ─────────────────────────────────────────
   4. COUNTER ANIMATION
   Animates [data-target] elements from 0 to their target value
   when they scroll into view. Uses requestAnimationFrame for a
   smooth, frame-synced count-up with a cubic ease-out curve.

   data-target  {number}  — the final value to count to
   data-suffix  {string}  — appended after the number (e.g. "yr+", "K+")
───────────────────────────────────────── */
const CounterAnimation = (() => {
  const SELECTOR = '[data-target]';
  const DURATION = 1600; // ms

  const animateCounter = (el, target, suffix = '') => {
    const startTime = performance.now();

    const step = (currentTime) => {
      const elapsed  = currentTime - startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const value    = Math.round(eased * target);

      if (suffix === 'K' && value >= 1000) {
        el.textContent = `${(value / 1000).toFixed(1)}K`;
      } else if (suffix === '+') {
        el.textContent = value >= 1000
          ? `${(value / 1000).toFixed(0)}K+`
          : `${value}+`;
      } else {
        el.textContent = `${value}${suffix}`;
      }

      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el     = entry.target;
          const target = parseInt(el.dataset.target, 10);
          const suffix = el.dataset.suffix ?? '';
          animateCounter(el, target, suffix);
          obs.unobserve(el);
        }
      });
    },
    { threshold: 0.6 }
  );

  const init = () => {
    document.querySelectorAll(SELECTOR).forEach((el) => observer.observe(el));
  };

  return { init };
})();


/* ─────────────────────────────────────────
   5. SMOOTH ANCHOR SCROLLING
   Intercepts clicks on internal anchor links (href="#...") and
   replaces the browser's default jump with a smooth scroll.

   NAV_HEIGHT is read live from the CSS custom property --nav-height
   so there is a single source of truth. If you change --nav-height
   in variables.css, this module automatically picks up the new value —
   no manual sync required (audit fix: Issue 2).

   Respects prefers-reduced-motion: users who have requested reduced
   motion in their OS/browser get an instant scroll instead of smooth,
   avoiding vestibular discomfort (audit fix: Issue 6, WCAG 2.1 SC 2.3.3).
───────────────────────────────────────── */
const SmoothScroll = (() => {
  /**
   * Reads --nav-height from the live computed CSS custom property.
   * Falls back to 64 if the property is missing or unparseable.
   * Called as a function so it always reflects the current value,
   * even if the property changes at a breakpoint.
   */
  const getNavHeight = () =>
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-height'),
      10
    ) || 64;

  /**
   * Scroll to a section by ID, offset by the fixed nav height.
   * @param {string} id — the section's id attribute (without '#')
   */
  const scrollToTarget = (id) => {
    const target = document.getElementById(id);
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - getNavHeight() - 16;

    // Honour the user's OS/browser motion preference.
    // 'instant' = zero animation; 'smooth' = CSS scroll-behavior animation.
    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({ top, behavior: prefersReduced ? 'instant' : 'smooth' });
  };

  const init = () => {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const id = anchor.getAttribute('href').slice(1);
        if (!id) return;
        const el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        scrollToTarget(id);
        history.pushState(null, '', `#${id}`);
      });
    });
  };

  return { init };
})();


/* ─────────────────────────────────────────
   6. FOOTER YEAR
   Writes the current year into #year so the copyright notice
   never goes stale without a code change.
───────────────────────────────────────── */
const FooterYear = (() => {
  const init = () => {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  };
  return { init };
})();


/* ─────────────────────────────────────────
   7. KEYBOARD ACCESSIBILITY
   Traps Tab focus inside the mobile menu while it's open.
   Without this, Tab would escape the overlay and focus elements
   behind it, confusing keyboard and screen-reader users.
───────────────────────────────────────── */
const KeyboardA11y = (() => {
  const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /**
   * Wire up a focus trap on a given container element.
   * @param {HTMLElement} container — the element to trap focus within
   */
  const trapFocus = (container) => {
    const focusable = [...container.querySelectorAll(FOCUSABLE)];
    const first     = focusable[0];
    const last      = focusable[focusable.length - 1];

    container.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  };

  const init = () => {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) trapFocus(mobileMenu);
  };

  return { init };
})();


/* ─────────────────────────────────────────
   8. BOOTSTRAP
   Initialises all modules once the DOM is ready.

   type="module" auto-defers execution until after the DOM is parsed,
   so the DOMContentLoaded guard is a belt-and-braces safety net for
   any non-module usage context only.
───────────────────────────────────────── */
const bootstrap = () => {
  ThemeManager.init();
  NavigationManager.init();
  ScrollReveal.init();
  CounterAnimation.init();
  SmoothScroll.init();
  FooterYear.init();
  KeyboardA11y.init();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
