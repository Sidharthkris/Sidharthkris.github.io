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
 */

'use strict';

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
   * CSS variable overrides in [data-theme="dark"] handle all visual changes.
   * Also updates the toggle button's aria-label to describe the *action*
   * (i.e. "switch to light mode" when currently dark).
   */
  const apply = (theme) => {
    ROOT.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    if (TOGGLE_BTN) {
      TOGGLE_BTN.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
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
        section currently occupies the top of the viewport. Works by comparing
        scrollY against each section's offsetTop minus a 120 px lookahead.
     c) Mobile menu — toggles the off-canvas menu, manages aria-expanded
        state, closes on link click / Escape / viewport resize.
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

  /* ── b) Active link tracking ──
     Iterates all sections; the last one whose top edge is above
     (scrollY + 120 px lookahead) wins. This means the nav link updates
     slightly before the section header reaches the top of the viewport,
     which feels more responsive than waiting for it to reach the very top. */
  const updateActiveLink = () => {
    let currentId = '';

    SECTIONS.forEach((section) => {
      // 120 px offset accounts for the fixed nav height plus a small buffer
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) currentId = section.getAttribute('id');
    });

    // Toggle .is-active on the link whose href matches the current section.
    // CSS in components.css uses .is-active to show the accent underline.
    NAV_LINKS.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${currentId}`;
      link.classList.toggle('is-active', isActive);
    });
  };

  /* ── c) Mobile menu ── */
  const toggleMobile = () => {
    isMobileOpen = !isMobileOpen;
    HAMBURGER?.setAttribute('aria-expanded', String(isMobileOpen));
    // Using the hidden attribute keeps the menu out of the accessibility tree
    // when closed, not just visually hidden via CSS.
    if (MOBILE_MENU) MOBILE_MENU.hidden = !isMobileOpen;
  };

  const closeMobile = () => {
    if (!isMobileOpen) return;
    isMobileOpen = false;
    HAMBURGER?.setAttribute('aria-expanded', 'false');
    if (MOBILE_MENU) MOBILE_MENU.hidden = true;
  };

  const init = () => {
    // passive: true tells the browser this handler never calls preventDefault(),
    // allowing it to optimise scroll performance (avoids scroll jank).
    window.addEventListener('scroll', onScroll, { passive: true });
    HAMBURGER?.addEventListener('click', toggleMobile);

    // Close menu when a nav link is tapped (smooth scroll takes over)
    MOBILE_MENU?.querySelectorAll('.mobile-menu__link').forEach((link) => {
      link.addEventListener('click', closeMobile);
    });

    // Standard accessibility pattern: Escape closes overlays
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobile();
    });

    // If the viewport grows past the mobile breakpoint while the menu is open
    // (e.g. device rotation), close it so the desktop nav can take over.
    window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
      if (e.matches) closeMobile();
    });

    // Run once on page load so the correct link is active on deep-link URLs
    updateActiveLink();
  };

  return { init };
})();


/* ─────────────────────────────────────────
   3. SCROLL REVEAL
   Uses IntersectionObserver to add .is-visible to elements
   marked with .js-reveal, triggering the CSS transition
   defined in layout.css (opacity + translateY).

   Each element is unobserved after its first reveal so the
   animation only plays once — re-observing on scroll-up would
   feel repetitive and clutters the animation queue.

   rootMargin: '0px 0px -48px 0px' triggers the animation
   48 px *before* the element reaches the very bottom of the
   viewport, so it's already in motion as it scrolls into view.
───────────────────────────────────────── */
const ScrollReveal = (() => {
  const SELECTOR  = '.js-reveal';
  const CSS_CLASS = 'is-visible';

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(CSS_CLASS);
          obs.unobserve(entry.target); // animate once only
        }
      });
    },
    {
      threshold:  0.12,        // element must be 12% visible before triggering
      rootMargin: '0px 0px -48px 0px', // early trigger at bottom of viewport
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
  const DURATION = 1600; // ms — total animation duration

  /**
   * Drives a single counter element from 0 → target.
   * Uses a cubic ease-out: progress = 1 - (1 - t)³
   * This gives a fast initial count that decelerates into the final value,
   * mimicking the feel of a physical odometer settling.
   *
   * @param {HTMLElement} el     - the span holding the displayed number
   * @param {number}      target - the value to count up to
   * @param {string}      suffix - text appended after the number
   */
  const animateCounter = (el, target, suffix = '') => {
    const startTime = performance.now();

    const step = (currentTime) => {
      const elapsed  = currentTime - startTime;
      const progress = Math.min(elapsed / DURATION, 1); // clamp to [0, 1]

      // Cubic ease-out — fast start, smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * target);

      // Format the display value.
      // "K" suffix: show as decimal thousands (e.g. 9.0K)
      // "+" suffix: show thousands with K+ if ≥ 1000
      // Any other suffix (e.g. "yr+"): append directly
      if (suffix === 'K' && value >= 1000) {
        el.textContent = `${(value / 1000).toFixed(1)}K`;
      } else if (suffix === '+') {
        el.textContent = value >= 1000
          ? `${(value / 1000).toFixed(0)}K+`
          : `${value}+`;
      } else {
        el.textContent = `${value}${suffix}`;
      }

      // Continue until progress reaches 1
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  // Only start the animation when the stat is at least 60% visible —
  // higher threshold than ScrollReveal so the count-up starts close to
  // when the user is actually reading the stat.
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el     = entry.target;
          const target = parseInt(el.dataset.target, 10);
          const suffix = el.dataset.suffix ?? '';
          animateCounter(el, target, suffix);
          obs.unobserve(el); // animate once only
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

   The fixed nav bar means the browser's native scrollIntoView
   would land with the target heading hidden behind the nav.
   This module calculates the correct scroll position by
   subtracting the nav height (64 px) + 16 px breathing room
   from the element's document-relative top.

   history.pushState updates the URL hash without a page jump,
   keeping the address bar useful for sharing and back-navigation.
───────────────────────────────────────── */
const SmoothScroll = (() => {
  const NAV_HEIGHT = 64; // keep in sync with --nav-height in variables.css

  /**
   * Scroll to a section by ID, offset by the fixed nav height.
   * @param {string} id — the section's id attribute (without '#')
   */
  const scrollToTarget = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const init = () => {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const id = anchor.getAttribute('href').slice(1);
        if (!id) return; // skip bare '#' hrefs (e.g. logo link to top)
        const el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        scrollToTarget(id);
        // Update URL hash silently — no scroll jump from pushState
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

   Implementation: identifies the first and last focusable elements
   in the container. When Tab would move past the last element, it
   wraps to the first; Shift+Tab past the first wraps to the last.
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
        // Shift+Tab from first element → wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab from last element → wrap to first
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
   Initialises all modules. Called once the DOM is ready.

   Note: this script is loaded with type="module" which auto-defers
   execution until after the DOM is parsed — the DOMContentLoaded
   guard is belt-and-braces for any non-module usage context.
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
