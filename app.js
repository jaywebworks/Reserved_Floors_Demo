/* =========================================================================
   Reserved Floors — interactions
   Vanilla JS, no dependencies. Handles:
   header scroll-condense · scroll reveal · before/after slider (mouse+touch)
   · smooth anchor scroll · mobile sticky bar · form validation + success state
   ========================================================================= */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- current year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- header condense on scroll ---------- */
  var header = document.getElementById('header');
  var nav = document.getElementById('nav');
  var tagline = document.getElementById('nav-tagline');

  function onScroll() {
    var scrolled = window.scrollY > 24;
    if (scrolled) {
      header.classList.add('bg-cream/90', 'backdrop-blur-md', 'shadow-soft');
      nav.classList.remove('py-5');
      nav.classList.add('py-3');
      if (tagline) tagline.classList.add('opacity-0');
    } else {
      header.classList.remove('bg-cream/90', 'backdrop-blur-md', 'shadow-soft');
      nav.classList.add('py-5');
      nav.classList.remove('py-3');
      if (tagline) tagline.classList.remove('opacity-0');
    }
  }
  if (tagline) tagline.classList.add('transition-opacity', 'duration-300');
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) {
      if (!el.classList.contains('in')) io.observe(el);
    });
  }

  /* ---------- smooth anchor scroll with header offset ---------- */
  function headerOffset() { return (header ? header.offsetHeight : 80) + 8; }
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
      window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- before / after slider ---------- */
  (function () {
    var ba = document.getElementById('ba');
    if (!ba) return;
    var dragging = false;

    function setPos(clientX) {
      var rect = ba.getBoundingClientRect();
      var pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      ba.style.setProperty('--pos', pct + '%');
    }

    function start(e) {
      dragging = true;
      ba.style.cursor = 'grabbing';
      setPos(getX(e));
      e.preventDefault();
    }
    function move(e) {
      if (!dragging) return;
      setPos(getX(e));
    }
    function end() {
      dragging = false;
      ba.style.cursor = 'ew-resize';
    }
    function getX(e) {
      return e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
    }

    ba.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    ba.addEventListener('touchstart', start, { passive: false });
    ba.addEventListener('touchmove', function (e) {
      if (dragging) e.preventDefault();
      move(e);
    }, { passive: false });
    window.addEventListener('touchend', end);

    // click-to-position anywhere on the image
    ba.addEventListener('click', function (e) {
      if (!dragging) setPos(getX(e));
    });

    // keyboard accessibility on the handle
    var handle = document.getElementById('ba-handle');
    if (handle) {
      handle.tabIndex = 0;
      handle.setAttribute('role', 'slider');
      handle.setAttribute('aria-label', 'Before and after comparison');
      handle.addEventListener('keydown', function (e) {
        var cur = parseFloat((ba.style.getPropertyValue('--pos') || '50%'));
        if (e.key === 'ArrowLeft') { ba.style.setProperty('--pos', Math.max(0, cur - 4) + '%'); e.preventDefault(); }
        if (e.key === 'ArrowRight') { ba.style.setProperty('--pos', Math.min(100, cur + 4) + '%'); e.preventDefault(); }
      });
    }
  })();

  /* ---------- mobile sticky bar (show after hero) ---------- */
  (function () {
    var bar = document.getElementById('mobile-bar');
    if (!bar) return;
    function toggle() {
      if (window.scrollY > window.innerHeight * 0.6) {
        bar.classList.remove('translate-y-full');
      } else {
        bar.classList.add('translate-y-full');
      }
    }
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  })();

  /* ---------- quote form validation + success ---------- */
  (function () {
    var form = document.getElementById('quote-form');
    if (!form) return;
    var success = document.getElementById('form-success');
    var submitBtn = document.getElementById('quote-submit');

    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var phoneRe = /[\d\s().+-]{7,}/; // lenient: at least 7 phone-ish chars

    function validateField(field) {
      var ok = true;
      var v = (field.value || '').trim();
      if (field.hasAttribute('required') && !v) ok = false;
      if (ok && field.type === 'email' && v && !emailRe.test(v)) ok = false;
      if (ok && field.type === 'tel' && v && (!phoneRe.test(v) || (v.replace(/\D/g, '').length < 7))) ok = false;
      field.classList.toggle('invalid', !ok);
      return ok;
    }

    // live-clear errors as the user fixes them
    form.querySelectorAll('.field').forEach(function (field) {
      field.addEventListener('input', function () {
        if (field.classList.contains('invalid')) validateField(field);
      });
      field.addEventListener('blur', function () {
        if ((field.value || '').trim() || field.classList.contains('invalid')) validateField(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = form.querySelectorAll('.field[required]');
      var allOk = true;
      var firstBad = null;
      fields.forEach(function (field) {
        var ok = validateField(field);
        if (!ok && !firstBad) firstBad = field;
        if (!ok) allOk = false;
      });

      if (!allOk) {
        if (firstBad) firstBad.focus();
        return;
      }

      // ---- DEMO submit (no backend). ----
      // To wire up for real, give the <form> a Formspree action/method and
      // let it submit normally instead of this simulated handler.
      submitBtn.disabled = true;
      var label = submitBtn.querySelector('.btn-label');
      var arrow = submitBtn.querySelector('.btn-arrow');
      if (label) label.textContent = 'Sending…';
      if (arrow) arrow.classList.add('animate-pulse');

      setTimeout(function () {
        form.classList.add('hidden');
        if (success) {
          success.classList.remove('hidden');
          success.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
        }
      }, 750);
    });
  })();
})();
