/**
 * main.js — Portfolio JavaScript v2
 * Author: Sidharth Vijayan Krishnan
 * Enhanced: Senior review pass — v2
 * Style: ES6+ modules, functional decomposition, zero dependencies
 *
 * Modules:
 *   1.  ThemeManager       — dark/light mode with localStorage + OS sync
 *   2.  NavigationManager  — compact nav, active link (aria-current), mobile menu
 *   3.  ScrollReveal       — IntersectionObserver entrance animations
 *   4.  CounterAnimation   — eased count-up for stat numbers
 *   5.  SmoothScroll       — offset-aware anchor scrolling (fixed nav)
 *   6.  TypingEffect       — typewriter animation on hero tagline
 *   7.  FooterYear         — auto-updating copyright year
 *   8.  KeyboardA11y       — focus trap inside mobile menu
 *   9.  bootstrap          — DOMContentLoaded wiring
 *
 * v2 enhancements:
 *   • TypingEffect module — terminal-style typewriter on hero tagline
 *   • prefers-reduced-motion respected in ALL JS animations
 *   • aria-current="page" on active nav link (not just class toggle)
 *   • NavigationManager: close mobile menu on viewport resize ≥900 px
 *   • Error-safe DOM queries throughout (optional chaining, early return)
 *   • Scroll throttling via requestAnimationFrame gate
 *   • CounterAnimation: gracefully skips if target is NaN
 */

'use strict';

/* ─────────────────────────────────────────
   UTILITY
───────────────────────────────────────── */
/** Check if the user has requested reduced motion */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Throttle a function to run at most once per animation frame.
 * Better than setTimeout(fn, n) because it syncs with repaint.
 */
const rafThrottle = (fn) => {
  let ticking = false;
  return (...args) => {
    if (!ticking) {
      requestAnimationFrame(() => { fn(...args); ticking = false; });
      ticking = true;
    }
  };
};


/* ─────────────────────────────────────────
   1. THEME MANAGER
   Persists user preference in localStorage.
   Falls back to OS prefers-color-scheme.
   Applies theme by setting [data-theme] on <html>.
───────────────────────────────────────── */
const ThemeManager = (() => {
  const ROOT        = document.documentElement;
  const STORAGE_KEY = 'svk-portfolio-theme';
  const TOGGLE_BTN  = document.getElementById('themeToggle');

  const getPreferred = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const getSaved = () => localStorage.getItem(STORAGE_KEY);

  const apply = (theme) => {
    ROOT.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) { /* storage unavailable */ }
    if (TOGGLE_BTN) {
      TOGGLE_BTN.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
      TOGGLE_BTN.setAttribute('title', TOGGLE_BTN.getAttribute('aria-label'));
    }
  };

  const toggle = () => {
    const current = ROOT.getAttribute('data-theme');
    apply(current === 'dark' ? 'light' : 'dark');
  };

  const init = () => {
    const theme = getSaved() ?? getPreferred();
    apply(theme);
    TOGGLE_BTN?.addEventListener('click', toggle);

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
   a) Compact nav on scroll
   b) Active link tracking + aria-current="page"
   c) Mobile menu (open/close/Escape/resize)
───────────────────────────────────────── */
const NavigationManager = (() => {
  const NAV         = document.querySelector('.nav');
  const HAMBURGER   = document.getElementById('hamburger');
  const MOBILE_MENU = document.getElementById('mobileMenu');
  const NAV_LINKS   = document.querySelectorAll('.nav__link');
  const SECTIONS    = document.querySelectorAll('section[id]');
  const THRESHOLD   = 60;

  let isMobileOpen = false;

  /* ── a) Compact nav ── */
  const onScroll = rafThrottle(() => {
    NAV?.classList.toggle('is-compact', window.scrollY > THRESHOLD);
    updateActiveLink();
  });

  /* ── b) Active link + aria-current ── */
  const updateActiveLink = () => {
    let currentId = '';

    SECTIONS.forEach((section) => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) currentId = section.id;
    });

    NAV_LINKS.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${currentId}`;
      link.classList.toggle('is-active', isActive);
      // aria-current="page" communicates active state to screen readers
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  /* ── c) Mobile menu ── */
  const toggleMobile = () => {
    isMobileOpen = !isMobileOpen;
    HAMBURGER?.setAttribute('aria-expanded', String(isMobileOpen));
    if (MOBILE_MENU) MOBILE_MENU.hidden = !isMobileOpen;
    // Move focus into menu when opened
    if (isMobileOpen) {
      const firstLink = MOBILE_MENU?.querySelector('.mobile-menu__link');
      firstLink?.focus();
    }
  };

  const closeMobile = () => {
    if (!isMobileOpen) return;
    isMobileOpen = false;
    HAMBURGER?.setAttribute('aria-expanded', 'false');
    if (MOBILE_MENU) MOBILE_MENU.hidden = true;
    // Return focus to hamburger button
    HAMBURGER?.focus();
  };

  const init = () => {
    window.addEventListener('scroll', onScroll, { passive: true });
    HAMBURGER?.addEventListener('click', toggleMobile);

    MOBILE_MENU?.querySelectorAll('.mobile-menu__link').forEach((link) => {
      link.addEventListener('click', closeMobile);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMobileOpen) {
        e.preventDefault();
        closeMobile();
      }
    });

    window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
      if (e.matches) closeMobile();
    });

    updateActiveLink();
  };

  return { init };
})();


/* ─────────────────────────────────────────
   3. SCROLL REVEAL
   IntersectionObserver-based entrance animations.
   Skipped entirely when prefers-reduced-motion is set
   (CSS already removes the transform/opacity via media query,
   but this ensures JS doesn't re-add .is-visible unnecessarily).
───────────────────────────────────────── */
const ScrollReveal = (() => {
  const SELECTOR  = '.js-reveal';
  const CSS_CLASS = 'is-visible';

  const init = () => {
    // With reduced motion, mark everything visible immediately
    if (prefersReducedMotion()) {
      document.querySelectorAll(SELECTOR).forEach((el) => {
        el.classList.add(CSS_CLASS);
      });
      return;
    }

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
        threshold:  0.10,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    document.querySelectorAll(SELECTOR).forEach((el) => observer.observe(el));
  };

  return { init };
})();


/* ─────────────────────────────────────────
   4. COUNTER ANIMATION
   Animated count-up for [data-target] elements.
   data-target {number} — final value
   data-suffix {string} — appended text (e.g. "yr+", "K+")
   Skipped with a direct set when reduced-motion is preferred.
───────────────────────────────────────── */
const CounterAnimation = (() => {
  const SELECTOR = '[data-target]';
  const DURATION = 1500;

  const animateCounter = (el, target, suffix = '') => {
    if (prefersReducedMotion()) {
      // Set final value immediately — no animation
      el.textContent = `${target}${suffix}`;
      return;
    }

    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / DURATION, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      const value    = Math.round(eased * target);

      if (suffix === 'K' && value >= 1000) {
        el.textContent = `${(value / 1000).toFixed(1)}K`;
      } else if (suffix === '+') {
        el.textContent = value >= 1000 ? `${(value / 1000).toFixed(0)}K+` : `${value}+`;
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
          if (isNaN(target)) return; // guard against malformed markup

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
   Intercepts internal anchor clicks and scrolls with fixed-nav offset.
   Uses history.pushState to update hash without jumping.
───────────────────────────────────────── */
const SmoothScroll = (() => {
  const NAV_HEIGHT = 64; // keep in sync with --nav-height

  const scrollToTarget = (id) => {
    const target = document.getElementById(id);
    if (!target) return;

    if (prefersReducedMotion()) {
      target.scrollIntoView();
      return;
    }

    const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT - 16;
    window.scrollTo({ top, behavior: 'smooth' });
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
   6. TYPING EFFECT
   Terminal-style typewriter on the hero tagline.
   Runs only after ScrollReveal shows the hero__meta block.
   Skipped entirely (text shown immediately) for reduced-motion users.
───────────────────────────────────────── */
const TypingEffect = (() => {
  const FULL_TEXT =
    "Building systems where individual rules produce emergent outcomes — " +
    "from agent-based evacuation models to interactive algorithm visualisers. " +
    "M.Sc. Computer Science, TU Clausthal.";

  const CHAR_DELAY = 22; // ms per character — feels like ~120 WPM

  const init = () => {
    const tagline = document.querySelector('.hero__tagline');
    if (!tagline) return;

    // Respect reduced-motion: show full text immediately, no cursor
    if (prefersReducedMotion()) {
      tagline.textContent = FULL_TEXT;
      return;
    }

    // Clear placeholder text from HTML
    tagline.textContent = '';

    // Add blinking cursor
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    tagline.appendChild(cursor);

    let index = 0;

    const typeNextChar = () => {
      if (index < FULL_TEXT.length) {
        // Insert text node before cursor
        const textNode = tagline.childNodes[0];
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          textNode.textContent += FULL_TEXT[index];
        } else {
          tagline.insertBefore(
            document.createTextNode(FULL_TEXT[index]),
            cursor
          );
        }
        index++;
        setTimeout(typeNextChar, CHAR_DELAY);
      } else {
        // Typing complete — remove cursor after 3 s
        setTimeout(() => {
          cursor.style.animation = 'none';
          cursor.style.opacity   = '0';
          cursor.style.transition = 'opacity 0.5s';
        }, 3000);
      }
    };

    // Start typing after a short delay (lets hero name animate in first)
    setTimeout(typeNextChar, 900);
  };

  return { init };
})();


/* ─────────────────────────────────────────
   7. FOOTER YEAR
   Writes current year into #year — never goes stale.
───────────────────────────────────────── */
const FooterYear = (() => {
  const init = () => {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  };
  return { init };
})();


/* ─────────────────────────────────────────
   8. KEYBOARD ACCESSIBILITY
   Focus trap inside open mobile menu.
   Tab wraps: last → first; Shift+Tab wraps: first → last.
───────────────────────────────────────── */
const KeyboardA11y = (() => {
  const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const trapFocus = (container) => {
    const getFocusable = () => [...container.querySelectorAll(FOCUSABLE)];

    container.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusable();
      if (!focusable.length) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
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
   9. BOOTSTRAP
   Wires all modules. The module type attr auto-defers
   this script — DOMContentLoaded guard is belt-and-braces.
───────────────────────────────────────── */
const bootstrap = () => {
  ThemeManager.init();
  NavigationManager.init();
  ScrollReveal.init();
  CounterAnimation.init();
  SmoothScroll.init();
  TypingEffect.init();
  FooterYear.init();
  KeyboardA11y.init();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
