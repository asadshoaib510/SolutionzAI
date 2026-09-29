/* Effects of the kept concept-B sections, ported from concepts/_shared/js/fx.js for the fresh sites (25 September 2026).
   The story gate (html.story-on) becomes html.fx-on; everything else behaves as it did on concept B:
   - [data-split]    headings wrapped word by word; the words rise in when the heading scrolls into view
   - .reveal-up      blocks fade and rise in once, with a stagger from --i
   - .btn            magnetic: leans toward the pointer; .glow-card is lit from where the pointer is
   - .cursor-light   a soft glow follows the pointer
   - [data-marquee]  the green band drifts, speeds up with scroll speed and follows scroll direction
   - footer          the wordmark letters rise out of their edge from the centre outward (scrubbed), the link lines slide up,
                     and a few letters at a time flicker through symbols; [data-glitch] headings resolve from symbols
   - overlapping     each band sinks back and dims while the next one slides over it (CSS view timelines)
   - [data-portrait] the founder photo drifts slightly with the scroll (GSAP, when present)
   Everything is off under reduced motion, ?motion=off and on touch screens where noted; the page is complete without it. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches;
  var fxOn = root.classList.contains('fx-on') && !reduce;
  var afterIntro = (window.__fresh && window.__fresh.afterIntro) || function (fn) { fn(); };

  /* split headings into words (keeps inline children intact) */
  document.querySelectorAll('[data-split]').forEach(function (h) {
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
    var i = 0;
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', i++); s.textContent = part; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrap(n);
      });
    })(h);
  });

  /* reveal once when in view */
  var io = new IntersectionObserver(function (entries) { entries.forEach(function (e) {
    if (!e.isIntersecting) return; e.target.classList.add('in'); io.unobserve(e.target);
  }); }, { threshold: 0.18 });
  document.querySelectorAll('.reveal-up, [data-split]').forEach(function (el) { if (!el.closest('.hero')) io.observe(el); });
  afterIntro(function () { document.querySelectorAll('.hero [data-split]').forEach(function (el) { el.classList.add('in'); }); });   // behind the opening screen until it lifts

  /* pointer interactions (desktop only) */
  if (fine && fxOn) {
    root.classList.add('fx-pointer');
    var light = document.querySelector('.cursor-light');
    var lx = -999, ly = -999, cx = -999, cy = -999, raf = 0;
    var follow = function () {
      cx += (lx - cx) * 0.18; cy += (ly - cy) * 0.18;
      if (light) light.style.transform = 'translate3d(' + cx.toFixed(1) + 'px, ' + cy.toFixed(1) + 'px, 0)';
      raf = Math.abs(lx - cx) + Math.abs(ly - cy) > 0.5 ? requestAnimationFrame(follow) : 0;
    };
    window.addEventListener('pointermove', function (e) {
      lx = e.clientX; ly = e.clientY; if (cx < -900) { cx = lx; cy = ly; }
      if (!raf) raf = requestAnimationFrame(follow);
      var card = e.target.closest && e.target.closest('.glow-card');
      if (card) { var r = card.getBoundingClientRect(); card.style.setProperty('--mx', (e.clientX - r.left) + 'px'); card.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
    }, { passive: true });
    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = 'translate3d(' + (x * 10).toFixed(1) + 'px, ' + (y * 8).toFixed(1) + 'px, 0)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }

  /* green marquee: drifts on its own, speeds up with scroll speed and follows scroll direction (after solais.ai) */
  document.querySelectorAll('[data-marquee]').forEach(function (track) {
    if (!fxOn) return;
    var row = track.querySelector('.marquee-row');
    var x = 0, dir = -1, boost = 0, lastY = window.scrollY, lastT = 0, visible = false;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { lastT = 0; requestAnimationFrame(tick); } }).observe(track);
    window.addEventListener('scroll', function () {
      var dy = window.scrollY - lastY; lastY = window.scrollY;
      if (dy) { dir = dy > 0 ? -1 : 1; boost = Math.min(18, boost + Math.abs(dy) * 0.06); }
    }, { passive: true });
    function tick(t) {
      if (!visible) return;
      var dt = Math.min(50, t - (lastT || t)); lastT = t;
      var w = row.offsetWidth;
      if (!window.__fxFreeze) x += dir * (0.05 + boost * 0.05) * dt;          // __fxFreeze: the check script holds time-based motion still
      boost *= Math.pow(0.9, dt / 16.67);
      if (x <= -w) x += w; if (x > 0) x -= w;
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px, 0, 0)';
      requestAnimationFrame(tick);
    }
  });

  /* footer: the wordmark letters rise out of their edge as the footer scrolls in, from the centre outward.
     Scrubbed: a pure function of scroll position, so scrolling back lowers them again. */
  var footWord = document.querySelector('.footer-wordmark');
  if (footWord && fxOn) {
    var letters = Array.prototype.slice.call(footWord.querySelectorAll('.fw-l')).map(function (g) { return { g: g, d: parseFloat(g.style.getPropertyValue('--d')) || 0 }; });
    var place = function () {
      var r = footWord.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));
      letters.forEach(function (l) {
        var k = Math.min(1, Math.max(0, (p - l.d * 0.35) / 0.55)), e = 1 - Math.pow(1 - k, 3);
        l.g.style.transform = 'translateY(' + ((1 - e) * 110).toFixed(2) + '%)';
      });
    };
    var queued = false;
    window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; place(); }); } }, { passive: true });
    window.addEventListener('resize', place);
    place();
  }

  /* footer panel lines slide up once */
  var panel = document.querySelector('.sz-footer-panel');
  if (panel) new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { panel.classList.add('in'); o.disconnect(); } }); }, { threshold: 0.15 }).observe(panel);

  /* glitch letters (founder, 23 September 2026: "I really like this animation") */
  var SYMS = '#$&@%*+=/^<>01';
  var sym = function () { return SYMS[(Math.random() * SYMS.length) | 0]; };
  function flicker(cells, ticks, gap) {
    ticks = ticks || 5; gap = gap || 70;
    window.__fxBusy = (window.__fxBusy || 0) + 1;
    var n = 0;
    (function step() {
      if (n++ < ticks) { cells.forEach(function (c) { c.show(sym()); }); setTimeout(step, gap); }
      else { cells.forEach(function (c) { c.restore(); }); window.__fxBusy--; }
    })();
  }
  function glitchLoop(cells, isOn, every) {
    setInterval(function () {
      if (window.__fxFreeze || document.hidden || !isOn() || !cells.length) return;
      var pick = new Set(), k = 2 + ((Math.random() * 3) | 0);
      while (pick.size < Math.min(k, cells.length)) pick.add(cells[(Math.random() * cells.length) | 0]);
      flicker(Array.from(pick), 4 + ((Math.random() * 4) | 0));
    }, every || 2200);
  }
  if (fxOn) {
    var svg = document.querySelector('.footer-wordmark');
    if (svg) {
      var NS = 'http://www.w3.org/2000/svg';
      var cells = Array.prototype.slice.call(svg.querySelectorAll('.fw-l')).map(function (g) {
        var path = g.querySelector('path'), b = g.getBBox(), t = document.createElementNS(NS, 'text');
        t.setAttribute('class', 'fw-sym'); t.setAttribute('x', b.x + b.width / 2); t.setAttribute('y', b.y + b.height);
        t.setAttribute('font-size', b.height * 1.36); t.setAttribute('text-anchor', 'middle');
        t.setAttribute('fill', path.getAttribute('fill') || getComputedStyle(path).fill); g.appendChild(t);
        return { show: function (ch) { t.textContent = ch; path.style.opacity = '0'; }, restore: function () { t.textContent = ''; path.style.opacity = ''; } };
      });
      var seen = false; new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }).observe(svg);
      glitchLoop(cells, function () { return seen; }, 1800);
    }
    document.querySelectorAll('[data-glitch]').forEach(function (h) {
      var ls = [];
      h.querySelectorAll('.w').forEach(function (w) {
        var txt = w.textContent; w.textContent = '';
        Array.from(txt).forEach(function (ch) { var s = document.createElement('span'); s.className = 'gl'; s.textContent = ch; w.appendChild(s); ls.push(s); });
      });
      document.fonts.ready.then(function () {
        ls.forEach(function (s) { s.style.width = s.getBoundingClientRect().width.toFixed(2) + 'px'; });
        var cs = ls.filter(function (s) { return /\w/.test(s.textContent); }).map(function (s) { var ch = s.textContent; return { show: function (c) { s.textContent = c; s.classList.add('on'); }, restore: function () { s.textContent = ch; s.classList.remove('on'); } }; });
        /* opening: every letter resolves from symbols, left to right */
        window.__fxBusy = (window.__fxBusy || 0) + 1;
        var t0 = performance.now(), each = 22, run = 380;
        afterIntro(function () { t0 = performance.now(); requestAnimationFrame(function intro(t) {
          var el = t - t0, live = false;
          cs.forEach(function (c, i) { if (el < 250 + i * each) { c.show(sym()); live = true; } else if (el < 250 + i * each + run) c.restore(); });
          if (live) requestAnimationFrame(intro); else { cs.forEach(function (c) { c.restore(); }); window.__fxBusy--; }
        }); });
        var inView = true; new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }).observe(h);
        glitchLoop(cs, function () { return inView; }, 2600);
      });
    });
  }

  /* overlapping pages: each band after the page's middle sinks back and dims while the next one slides over it.
     CSS scroll-driven animations do the work (on the compositor, a pure function of scroll, so reverse matches forward);
     this only names one view timeline per covering band and hands it to the band underneath. */
  if (fxOn && window.CSS && CSS.supports('animation-timeline: view()')) {
    var lower = document.getElementById('lower'), foot = document.getElementById('site-footer');
    var panels = lower ? Array.prototype.slice.call(lower.children).filter(function (el) { return el.matches('section:not(.green-marquee)'); }) : [];
    if (foot) panels.push(foot);
    var names = [];
    panels.forEach(function (el, i) {
      var next = panels[i + 1];
      if (i) el.classList.add('page-over');
      if (!next) return;
      var name = '--ov-' + (i + 1); names.push(name);
      next.style.viewTimeline = name + ' block';
      el.style.animationTimeline = name;
      el.classList.add('page-sink');
    });
    document.body.style.timelineScope = names.join(', ');
    root.classList.add('pages-overlap');
  }

  /* the founder photo settles in, then drifts slightly with the scroll (after the gsap-scroll variant) */
  var portrait = document.querySelector('[data-portrait-img]');
  if (portrait && fxOn && window.gsap && window.ScrollTrigger) {
    gsap.fromTo(portrait, { yPercent: -4, scale: 1.08 }, { yPercent: 4, scale: 1.08, ease: 'none', scrollTrigger: { trigger: portrait.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
  }
})();
