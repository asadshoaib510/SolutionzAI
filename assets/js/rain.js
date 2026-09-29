/* Raining letters and scrambled headings (founder, 25 September 2026, from a React component they liked; round 3: "remove
   section 06, but use its background in 01 to 05 and the glitchy writing style in the headings only, lower the speed").
   Rebuilt without React for these static pages, in brand colours:
   - .rain-zone > canvas.rain-bg   one canvas, sticky, the height of the screen, behind the sections of the zone. Faint
                                   letters fall slowly; a few at a time glow brand green (navy with a green glow on the light
                                   theme, where green is never used as a colour for letters). The letters are stamped from a
                                   small pre-drawn sheet, so a frame costs little. Pauses when the zone is off screen and in a
                                   hidden tab; stands still under reduced motion.
   - [data-scramble]               the heading writes itself in through code symbols when it first comes into view, one
                                   letter at a time at random, then every few seconds a few letters flicker and settle again.
                                   Each letter keeps its own width, so the heading never reflows while it scrambles.
   Colours come from --rain-ink, --rain-hot and --rain-glow (fresh.css).
   window.__fxFreeze (the check script) holds the letters still and finishes any scramble at once. */
(function () {
  'use strict';
  var html = document.documentElement;
  var still = !html.classList.contains('fx-on') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ALL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  var SPEED = 2.4;                    // the component's speed was 6: now 40% of it
  var HOT_EVERY = 520;                // ms between changes of the glowing letters (the component: 50)

  /* ---------------- raining letters ---------------- */
  var zone = document.querySelector('[data-rain-zone]');
  var canvas = zone && zone.querySelector('.rain-bg');
  if (canvas) (function () {
    var ctx = canvas.getContext('2d'), probe = document.createElement('i');
    probe.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none';
    zone.appendChild(probe);
    var drops = [], hot = [], w = 0, h = 0, dpr = 1, visible = false, raf = 0, last = 0, lastHot = 0, sheet = null, cell = 0, hotCell = 0;
    var FONT = 22, HOTFONT = 28;
    function colour(name) { probe.style.color = 'var(' + name + ')'; return getComputedStyle(probe).color; }
    /* two strips of pre-drawn characters: faint ones and glowing ones */
    function makeSheet() {
      cell = Math.ceil(FONT * 1.4 * dpr); hotCell = Math.ceil(HOTFONT * 2.2 * dpr);
      sheet = document.createElement('canvas'); sheet.width = ALL.length * hotCell; sheet.height = cell + hotCell;
      var x = sheet.getContext('2d'); x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '400 ' + FONT * dpr + 'px "JetBrains Mono", ui-monospace, monospace'; x.fillStyle = colour('--rain-ink');
      for (var i = 0; i < ALL.length; i++) x.fillText(ALL[i], i * cell + cell / 2, cell / 2);
      x.font = '700 ' + HOTFONT * dpr + 'px "JetBrains Mono", ui-monospace, monospace'; x.fillStyle = colour('--rain-hot');
      x.shadowColor = colour('--rain-glow'); x.shadowBlur = 14 * dpr;
      for (var j = 0; j < ALL.length; j++) x.fillText(ALL[j], j * hotCell + hotCell / 2, cell + hotCell / 2);
    }
    function pick() { return (Math.random() * ALL.length) | 0; }
    function size() {
      var b = canvas.getBoundingClientRect(), nd = Math.min(window.devicePixelRatio || 1, 1.5);
      if (nd !== dpr || !sheet) { dpr = nd; makeSheet(); }
      w = b.width; h = b.height; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      var n = Math.round(Math.min(260, w * h / 5200));
      while (drops.length < n) drops.push({ c: pick(), x: Math.random(), y: Math.random() * 1.05, v: 0.012 + Math.random() * 0.045 });
      drops.length = n;
      draw();
    }
    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!sheet) return;
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        if (hot.indexOf(i) < 0) ctx.drawImage(sheet, d.c * cell, 0, cell, cell, Math.round(d.x * w * dpr - cell / 2), Math.round(d.y * h * dpr - cell / 2), cell, cell);
      }
      for (var k = 0; k < hot.length; k++) {
        var e = drops[hot[k]];
        if (e) ctx.drawImage(sheet, e.c * hotCell, cell, hotCell, hotCell, Math.round(e.x * w * dpr - hotCell / 2), Math.round(e.y * h * dpr - hotCell / 2), hotCell, hotCell);
      }
    }
    function frame(t) {
      raf = 0;
      if (!visible || document.hidden) return;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
      if (!window.__fxFreeze) {
        for (var i = 0; i < drops.length; i++) {
          var d = drops[i]; d.y += d.v * dt * SPEED;
          if (d.y > 1.05) { d.y = -0.05; d.x = Math.random(); d.c = pick(); }
        }
        if (t - lastHot > HOT_EVERY) { lastHot = t; hot = []; var k = 3 + ((Math.random() * 3) | 0); while (k--) hot.push((Math.random() * drops.length) | 0); }
      }
      draw();
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
    var repaint = function () { makeSheet(); draw(); };
    size();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(repaint);
    if (window.ResizeObserver) new ResizeObserver(size).observe(canvas);
    if (still) return;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; start(); }).observe(zone);
    document.addEventListener('visibilitychange', start);
  })();

  /* ---------------- scrambled headings ---------------- */
  if (still) return;
  var SYM = '!<>-_\\/[]{}=+*^?#';
  var sym = function () { return SYM[(Math.random() * SYM.length) | 0]; };
  document.querySelectorAll('[data-scramble]').forEach(function (h) {
    var text = h.textContent.replace(/\s+/g, ' ').trim(), cells = [];
    h.setAttribute('aria-label', text); h.textContent = '';
    text.split(' ').forEach(function (word, wi) {
      if (wi) h.appendChild(document.createTextNode(' '));
      var wd = document.createElement('span'); wd.className = 'sw'; wd.setAttribute('aria-hidden', 'true');
      Array.from(word).forEach(function (ch) { var s = document.createElement('span'); s.className = 'sc pre'; s.textContent = ch; wd.appendChild(s); cells.push({ el: s, ch: ch }); });
      h.appendChild(wd);
    });
    h.classList.add('scramble');
    /* each letter keeps the width of its own character while symbols stand in for it */
    function measure() {
      cells.forEach(function (c) { c.el.style.width = ''; c.el.textContent = c.ch; });
      var ws = cells.map(function (c) { return c.el.getBoundingClientRect().width; });
      cells.forEach(function (c, i) { c.el.style.width = ws[i].toFixed(2) + 'px'; if (c.busy) c.el.textContent = c.sym; });
    }
    var job = null, inView = false, entered = false;
    /* run: every chosen letter waits (start), shows symbols that change every 110 ms (for dur), then settles */
    function run(list, spread, minDur, maxDur) {
      var t0 = performance.now(), plan = list.map(function (c, i) { return { c: c, s: Math.random() * spread + i * (spread / Math.max(12, list.length)) * 0.25, d: minDur + Math.random() * (maxDur - minDur), n: -1 }; });
      window.__fxBusy = (window.__fxBusy || 0) + 1;
      job = plan;
      (function step(t) {
        if (job !== plan) return;
        var el = t - t0, live = false, freeze = window.__fxFreeze;
        plan.forEach(function (p) {
          var c = p.c;
          if (freeze || el >= p.s + p.d) { if (c.busy || c.el.classList.contains('pre')) { c.busy = false; c.el.textContent = c.ch; c.el.classList.remove('dud', 'pre'); } return; }
          live = true;
          if (el >= p.s) {
            var n = Math.floor((el - p.s) / 110);
            if (n !== p.n) { p.n = n; c.sym = sym(); c.busy = true; c.el.textContent = c.sym; c.el.classList.add('dud'); c.el.classList.remove('pre'); }
          }
        });
        if (live) requestAnimationFrame(step); else { job = null; window.__fxBusy--; }
      })(t0);
    }
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () {
      measure();
      var rt = 0; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(measure, 150); });
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        if (inView && !entered) { entered = true; run(cells, 900, 380, 1100); }
      }, { threshold: 0.4 }).observe(h);
      setInterval(function () {
        if (!entered || !inView || job || document.hidden || window.__fxFreeze) return;
        var some = cells.filter(function (c) { return /\w/.test(c.ch) && Math.random() < 0.3; });
        if (some.length) run(some, 600, 260, 760);
      }, 7500);
    });
  });
})();
