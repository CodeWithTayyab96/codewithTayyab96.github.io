/* ==========================================================================
   Terminal boot sequence + footer year.
   The terminal is the hero's proof-of-craft: it types real build output.
   Falls back to static text under prefers-reduced-motion.
   ========================================================================== */

document.getElementById('year').textContent = new Date().getFullYear();

const term = document.getElementById('terminal');

/* Each line: {p: prompt?, t: text, k: key?, v: value?, c: class} */
const LINES = [
  { cmd: 'whoami' },
  { out: 'Tayyab — Software Engineering student, Faisalabad, PK' },
  { cmd: 'cat focus.json' },
  { key: '"focus"', val: '"AI-assisted dev, systems, mobile"' },
  { key: '"learning"', val: '"how LLMs actually work"' },
  { cmd: 'npm test --if-present' },
  { ok: '363 passing', muted: ' (19 files, 0 failing)' },
  { cmd: 'ls availability/' },
  { out: 'freelance/   internships/   interesting-problems/', dim: true },
];

const BLANK = '<span class="term-row">&nbsp;</span>';

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildLine(line) {
  if (line.cmd) {
    return `<span class="term-row"><span class="term-prompt">$ </span>${escapeHtml(line.cmd)}</span>`;
  }
  if (line.key !== undefined) {
    return `<span class="term-row">&nbsp;&nbsp;<span class="term-key">${escapeHtml(line.key)}</span>: <span class="term-val">${escapeHtml(line.val)}</span></span>`;
  }
  if (line.ok !== undefined) {
    return `<span class="term-row"><span class="term-ok">✓ ${escapeHtml(line.ok)}</span><span class="term-out">${escapeHtml(line.muted || '')}</span></span>`;
  }
  return `<span class="term-row"><span class="term-out">${escapeHtml(line.out)}</span></span>`;
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!term) {
  /* no-op */
} else if (reduced) {
  /* print everything at once — no motion, full content */
  term.innerHTML = LINES.map(buildLine).join('');
} else {
  const booted = [];
  let i = 0;

  function next() {
    if (i >= LINES.length) {
      /* resting prompt with a blinking cursor */
      term.innerHTML = booted.join('') +
        '<span class="term-row">&nbsp;</span>' +
        '<span class="term-row"><span class="term-prompt">$ </span><span class="term-cursor"></span></span>';
      return;
    }
    const line = LINES[i];
    const html = buildLine(line);
    booted.push(html);

    if (line.cmd) {
      /* type the command character by character */
      const plain = '$ ' + line.cmd;
      let ch = 0;
      term.innerHTML = booted.slice(0, -1).join('') +
        `<span class="term-row"><span class="term-prompt">$ </span><span id="typing"></span><span class="term-cursor"></span></span>`;
      const slot = term.querySelector('#typing');
      (function tick() {
        if (ch < line.cmd.length) {
          slot.textContent += line.cmd[ch++];
          setTimeout(tick, 42);
        } else {
          setTimeout(() => { i++; next(); }, 220);
        }
      })();
    } else {
      /* output lands instantly, then a beat */
      term.innerHTML = booted.join('') + BLANK;
      setTimeout(() => { i++; next(); }, line.ok !== undefined ? 420 : 300);
    }
  }
  setTimeout(next, 320);
}
