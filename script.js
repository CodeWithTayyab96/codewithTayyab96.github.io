/* ==========================================================================
   Portfolio motion layer
   - terminal boot sequence (typed)
   - scroll-reveal via IntersectionObserver
   - staggered indices for cascading children
   - metric count-up
   Everything degrades safely: without JS the page is fully visible and static.
   ========================================================================== */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ======================================================================
     SCROLL REVEAL
     Elements are marked in HTML with .reveal (or .reveal-stagger for a
     container whose children cascade). We only ever ADD the class once the
     observer fires, so a JS failure leaves content visible.
     ====================================================================== */
  function initReveal() {
    var targets = document.querySelectorAll('.reveal, .reveal-stagger');
    if (!targets.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      /* no observer support, or motion is unwelcome: show everything */
      Array.prototype.forEach.call(targets, function (el) {
        el.classList.add('is-in');
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);           /* reveal once, then stop watching */
      });
    }, {
      rootMargin: '0px 0px -8% 0px',          /* fire slightly before fully in view */
      threshold: 0.06
    });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  /* assign --i indices so .reveal-stagger children cascade */
  function indexStaggered() {
    var groups = document.querySelectorAll('.reveal-stagger');
    Array.prototype.forEach.call(groups, function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty('--i', i);
      });
    });
  }

  /* index panel code lines so they print in sequence */
  function indexPanelLines() {
    var panels = document.querySelectorAll('.panel-body');
    Array.prototype.forEach.call(panels, function (body) {
      Array.prototype.forEach.call(body.querySelectorAll('.pl'), function (line, i) {
        line.style.setProperty('--n', i);
      });
    });
  }

  /* ======================================================================
     METRIC COUNT-UP
     Parses the target from the element, animates 0 -> target using an
     ease-out curve. Preserves thousands separators and suffixes.
     ====================================================================== */
  function countUp(el) {
    var raw = el.textContent.trim();
    var match = raw.match(/^([\d,]+)(.*)$/);
    if (!match) return;

    var target = parseInt(match[1].replace(/,/g, ''), 10);
    var suffix = match[2] || '';
    var grouped = match[1].indexOf(',') !== -1;
    var duration = 1100;
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      /* expo-out so it decelerates into the final value */
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      var value = Math.round(target * eased);
      el.textContent = (grouped ? value.toLocaleString('en-US') : String(value)) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = raw;   /* land exactly on the authored string */
    }
    requestAnimationFrame(frame);
  }

  function initCountUp() {
    var nums = document.querySelectorAll('.metric-num');
    if (!nums.length) return;

    if (reduced || !('IntersectionObserver' in window)) return;  /* leave as authored */

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    Array.prototype.forEach.call(nums, function (el) { io.observe(el); });
  }

  /* ======================================================================
     TERMINAL BOOT SEQUENCE
     ====================================================================== */
  var term = document.getElementById('terminal');

  var LINES = [
    { cmd: 'whoami' },
    { out: 'Tayyab — Software Engineering student, Faisalabad, PK' },
    { cmd: 'cat focus.json' },
    { key: '"focus"', val: '"AI-assisted dev, systems, mobile"' },
    { key: '"learning"', val: '"how LLMs actually work"' },
    { cmd: 'npm test --if-present' },
    { ok: '363 passing', muted: ' (19 files, 0 failing)' },
    { cmd: 'ls availability/' },
    { out: 'freelance/   internships/   interesting-problems/', dim: true }
  ];

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function buildLine(line) {
    if (line.cmd) {
      return '<span class="term-row"><span class="term-prompt">$ </span>' + escapeHtml(line.cmd) + '</span>';
    }
    if (line.key !== undefined) {
      return '<span class="term-row">&nbsp;&nbsp;<span class="term-key">' + escapeHtml(line.key) +
             '</span>: <span class="term-val">' + escapeHtml(line.val) + '</span></span>';
    }
    if (line.ok !== undefined) {
      return '<span class="term-row"><span class="term-ok">✓ ' + escapeHtml(line.ok) +
             '</span><span class="term-out">' + escapeHtml(line.muted || '') + '</span></span>';
    }
    return '<span class="term-row"><span class="term-out">' + escapeHtml(line.out) + '</span></span>';
  }

  function runTerminal() {
    if (!term) return;

    if (reduced) {
      term.innerHTML = LINES.map(buildLine).join('');
      return;
    }

    var booted = [];
    var i = 0;

    function next() {
      if (i >= LINES.length) {
        term.innerHTML = booted.join('') +
          '<span class="term-row">&nbsp;</span>' +
          '<span class="term-row"><span class="term-prompt">$ </span><span class="term-cursor"></span></span>';
        return;
      }

      var line = LINES[i];
      booted.push(buildLine(line));

      if (line.cmd) {
        /* type the command character by character */
        var ch = 0;
        term.innerHTML = booted.slice(0, -1).join('') +
          '<span class="term-row"><span class="term-prompt">$ </span>' +
          '<span id="typing"></span><span class="term-cursor"></span></span>';
        var slot = term.querySelector('#typing');

        (function tick() {
          if (ch < line.cmd.length) {
            slot.textContent += line.cmd.charAt(ch++);
            setTimeout(tick, 42);
          } else {
            setTimeout(function () { i++; next(); }, 220);
          }
        })();
      } else {
        term.innerHTML = booted.join('') + '<span class="term-row">&nbsp;</span>';
        setTimeout(function () { i++; next(); }, line.ok !== undefined ? 430 : 310);
      }
    }

    setTimeout(next, 380);
  }

  /* ---------- boot ---------- */
  function init() {
    indexStaggered();
    indexPanelLines();
    initReveal();
    initCountUp();
    runTerminal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
