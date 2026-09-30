/* Opening screen of the fresh sites (founder, 25 September 2026: "add this at the start up, in my brand colors"), from a
   frame study of the founder's recording of the solais.ai intro, ported from concepts/_shared/js/intro.js with its first
   stage added:
   1. A small frame of four corner brackets in the middle of a solid brand-navy (#043377) panel, with line icons fading
      in and out inside it (here the six service icons).
   2. Small uppercase monospaced text written in letter by letter (a bright green symbol at the writing edge, a faint one
      ahead of it) and erased from the front about 30 letters behind, so the line passes like a signal. The text is the
      page's own eyebrow and headline, so no new copy.
   3. "Loading..." at the foot throughout, a letter or two flickering into digits of the real load progress.
   4. The panel breaks into large squares that fade out in a diagonal wave from the bottom-right, revealing the page.
   Only with JavaScript and motion allowed, and not with ?intro=off. A click, a key, a wheel turn or a touch skips it.
   Once per visit, on the homepage only (founder, 26 September 2026): base.html leaves it out when this tab has already
   seen it (sessionStorage sz-intro) and on every other page; ?intro=on shows it again. Since 30 September 2026 once per
   visitor (localStorage sz-intro; founder: "make it 3 seconds, once per visitor in both desktop and phone"), and slowed to
   about 3 s so the line can be read: up to 60 letters stay on screen as it passes. Later the same day once per visit again
   (a visit being one tab), after trying every open; base.html decides.
   Fires 'intro:done' on window when the page is revealed (the hero and the logo start then).
   29 September 2026 (founder: "Shorten to ~1.5 s"; it took about 6 s): one icon, the signal line written five times as
   fast, a short pause and a quicker wave, so the page shows after about 1.5 s. The headline and its paragraph are already
   in place underneath (lower.js, console.js), so they are there as it lifts. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('intro-pre')) { window.__introDone = true; return; }
  var SYMS = '0123456789#$%&@*+=/<>';
  var sym = function () { return SYMS[(Math.random() * SYMS.length) | 0]; };
  var ICONS = [   // automation, integration, AI agents, websites, marketing, dashboards (24-unit line icons, as on the service panels)
    'M20 11a8 8 0 0 0-14.3-4.9M4 13a8 8 0 0 0 14.3 4.9M5 3v4h4M19 21v-4h-4',
    'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    'M12 4v3M7 7h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3zM2 12v3M22 12v3M10 16h4M12 2.6h.01M9 11.4v1.9M15 11.4v1.9',
    'M3 5h18v14H3zM3 9h18M6.5 7h.01M9.5 7h.01M7 13h6M7 16h9',
    'M4 20V11M9.5 20V5M15 20v-8M20.5 20V8',
    'M4 4v16h16M7.5 15.5l3.5-4 3 2.5 5-6M19 8h.01'
  ];

  var eyebrow = document.querySelector('.hero [data-type]'), h1 = document.querySelector('.hero h1');
  var text = [eyebrow && eyebrow.textContent, h1 && (h1.getAttribute('aria-label') || h1.textContent)]
    .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim().toUpperCase();

  var el = document.createElement('div');
  el.className = 'intro'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="intro-frame"><i></i><i></i><svg viewBox="0 0 24 24"><path d=""/></svg></div>' +
    '<p class="intro-text"></p><p class="intro-load">Loading...</p><div class="intro-cells"></div>';
  document.body.appendChild(el);
  root.classList.add('intro-on'); root.classList.remove('intro-pre');
  var frameEl = el.querySelector('.intro-frame'), icon = el.querySelector('.intro-frame path');
  var para = el.querySelector('.intro-text'), load = el.querySelector('.intro-load'), cells = el.querySelector('.intro-cells');

  /* the paragraph is laid out once with every letter in place (hidden), so writing and erasing never move a letter */
  var chars = [];
  text.split(' ').forEach(function (word, w) {
    if (w) para.appendChild(document.createTextNode(' '));
    var box = document.createElement('span'); box.className = 'intro-word';
    Array.from(word).forEach(function (ch) { var s = document.createElement('span'); s.textContent = ch; s.className = 'off'; box.appendChild(s); chars.push({ s: s, ch: ch, state: 'off' }); });
    para.appendChild(box);
  });
  var n = chars.length;
  function set(c, state, glyph) {
    if (c.state === state) return;
    c.state = state; c.s.className = state === 'on' ? '' : state;
    c.s.textContent = glyph || c.ch;
  }

  var progress = 0, finished = false, typedAt = 0, lastLoad = -999, lastIcon = -1;
  var t0 = performance.now(), ICON_MS = 450, ICON_N = 1, GAP = 100, START = ICON_MS * ICON_N + GAP, STEP = 14, LAG = 60, PAUSE = 150;
  window.addEventListener('load', function () { progress = 1; });
  var tick = setInterval(function () { progress = Math.max(progress, Math.min(0.95, (performance.now() - t0) / 3000)); }, 100);

  function frame(t) {
    if (finished) return;
    var ms = t - t0;
    /* 1. the bracket frame with an icon fading in, then the next */
    if (ms < START - GAP) {
      var k = Math.floor(ms / ICON_MS);
      if (k !== lastIcon) { lastIcon = k; icon.setAttribute('d', ICONS[(k * 2 + 1) % ICONS.length]); frameEl.classList.remove('show'); void frameEl.offsetWidth; frameEl.classList.add('show'); }
    } else if (!frameEl.classList.contains('gone')) frameEl.classList.add('gone');
    /* 2. the signal line */
    var head = Math.floor((ms - START) / STEP), tail = head - LAG;
    for (var i = 0; i < n; i++) {
      var c = chars[i];
      if (i > head + 1 || i < tail - 1) set(c, 'off');
      else if (i === head + 1 || i === tail - 1) set(c, 'dim', sym());
      else if (i === head || i === tail) set(c, 'hot', sym());
      else set(c, 'on');
    }
    /* 3. "Loading..." with a letter or two flickering into digits of the progress */
    if (ms - lastLoad > 90) {
      lastLoad = ms;
      var base = 'Loading...', digits = String(Math.round(progress * 100)).padStart(2, '0'), out = Array.from(base);
      var kk = Math.random() < 0.35 ? 0 : 1 + ((Math.random() * 2) | 0);
      for (var j = 0; j < kk; j++) out[(Math.random() * base.length) | 0] = digits[j % digits.length];
      load.textContent = out.join('');
    }
    if (tail - 1 > n) {
      typedAt = typedAt || ms;
      el.classList.add('blank');
      if (ms - typedAt >= PAUSE) { finish(); return; }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* 4. the squares */
  function finish() {
    if (finished) return;
    finished = true; clearInterval(tick);
    para.textContent = ''; frameEl.classList.add('gone'); el.classList.add('blank');
    var size = Math.max(64, window.innerWidth / 12);
    var cols = Math.ceil(window.innerWidth / size), rows = Math.ceil(window.innerHeight / size);
    cells.style.gridTemplateColumns = 'repeat(' + cols + ', ' + size + 'px)';
    cells.style.gridTemplateRows = 'repeat(' + rows + ', ' + size + 'px)';
    var STAGGER = 24, frag = document.createDocumentFragment();
    for (var r = 0; r < rows; r++) for (var c2 = 0; c2 < cols; c2++) {
      var d = document.createElement('i');
      d.style.animationDelay = (((cols - 1 - c2) + (rows - 1 - r)) * STAGGER + ((Math.random() * 40) | 0)) + 'ms';
      frag.appendChild(d);
    }
    cells.appendChild(frag);
    el.classList.add('out');
    var total = (cols + rows) * STAGGER + 480;
    setTimeout(function () { root.classList.remove('intro-on'); window.__introDone = true; window.dispatchEvent(new Event('intro:done')); }, Math.min(260, total));
    setTimeout(function () { el.remove(); }, total + 60);
  }
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (e) { window.addEventListener(e, finish, { once: true, passive: true }); });
  window.__introFinish = finish;
})();
