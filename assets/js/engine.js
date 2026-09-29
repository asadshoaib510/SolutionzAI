/* Shared motion engine of the fresh sites (25 September 2026): GSAP 3.13 with ScrollTrigger, Lenis smooth scrolling driven
   by the GSAP ticker (the way solais.ai runs it: lenis.on('scroll', ScrollTrigger.update), lagSmoothing(0)), and the
   reveals both sites use (after the gsap-scroll variant):
     [data-reveal]        section heads and single blocks: one batched rise, once
     [data-batch="name"]  cards: batched entrances with small staggers, once
     .code-label          the "// 01" labels resolve from code symbols as they enter
     [data-typewriter]    text types itself in, letter by letter behind a block caret, as it enters (founder, 25 September
                          2026: "add some typing style in some sections"); F.typer(el) gives scrubbed timelines the same effect
   F.afterIntro(fn) runs fn once the opening screen (intro.js) has revealed the page, or at once when there is none.
   Test switches: ?exact=1 makes every scrub exact and turns snapping off (captures forward and back must match),
   ?lenis=off keeps native scrolling. Without GSAP, with reduced motion or ?motion=off the page stays as authored. */
(function () {
  'use strict';
  var html = document.documentElement, q = new URLSearchParams(location.search);
  var F = window.__fresh = { exact: q.get('exact') === '1', lenis: null, on: html.classList.contains('fx-on') };

  /* opened straight from the folder (file://), a link to a folder shows a file listing, so such a link goes to the folder's
     index.html instead (founder, 28 September 2026: the footer's "Questions and answers" should land on the homepage's
     questions). On the preview server and the live site, links stay as they are. */
  if (location.protocol === 'file:') document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.defaultPrevented) return;
    var u = new URL(a.href);
    if (u.protocol !== 'file:' || u.pathname.slice(-1) !== '/') return;
    e.preventDefault(); u.pathname += 'index.html'; location.href = u.href;
  }, true);
  F.q = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  F.scrub = function (n) { return F.exact ? true : n; };
  F.snap = function (v) { return F.exact ? undefined : v; };
  F.done = function () { window.__freshReady = true; };
  F.afterIntro = function (fn) {
    if (window.__introDone || !(html.classList.contains('intro-on') || html.classList.contains('intro-pre'))) fn();
    else window.addEventListener('intro:done', fn, { once: true });
  };

  /* typing: each letter in its own span (words kept whole so lines never break mid-word); set(n) shows the first n letters
     with the caret after the last one. The text stays in the page as ordinary text for screen readers. */
  F.typer = function (el) {
    if (el.__typer) return el.__typer;
    var chars = [];
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'wd';
            Array.from(part).forEach(function (ch) { var c = document.createElement('span'); c.className = 'ch'; c.textContent = ch; w.appendChild(c); chars.push(c); });
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('caret')) wrap(n);
      });
    })(el);
    el.classList.add('typer');
    var shown = -1;
    var t = el.__typer = { length: chars.length, n: 0, set: function (n) {
      n = Math.max(0, Math.min(chars.length, Math.round(n)));
      if (n === shown) return; shown = n; t.n = n;
      for (var i = 0; i < chars.length; i++) { chars[i].classList.toggle('on', i < n); chars[i].classList.toggle('cur', i === n - 1 && n < chars.length); }
      el.classList.toggle('typed', n >= chars.length);
    } };
    t.set(0);
    return t;
  };
  F.typeTween = function (el, secs) {          // a tween that types el over secs (or ~22 letters a second, 0.5 to 2.2 s)
    var t = F.typer(el), p = { n: 0 };
    return gsap.to(p, { n: t.length, duration: secs || Math.max(0.5, Math.min(2.2, t.length / 45)), ease: 'none', onUpdate: function () { t.set(p.n); } });
  };

  /* the green line under the header follows the scroll forward and back, and the back-to-top button shows after the first
     screen (founder, 26 September 2026). Plain scroll events, so they work with motion off too; the button glides back
     through Lenis when it runs. */
  /* since 28 September 2026 the button is see-through ("make it transparent"; since 29 September two arrows, no ring),
     so it turns navy over the green band and the light footer (.on-light) and stays green over the dark sections */
  var bar = document.querySelector('[data-scroll-progress]'), top = document.querySelector('[data-to-top]'), queued = false;
  var lights = Array.prototype.slice.call(document.querySelectorAll('.green-close, .sz-footer'));
  function progress() {
    queued = false;
    var max = document.documentElement.scrollHeight - window.innerHeight, y = window.scrollY;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
    if (top) {
      top.classList.toggle('is-shown', y > window.innerHeight * 0.9);
      var b = top.getBoundingClientRect(), cy = b.top + b.height / 2;
      top.classList.toggle('on-light', lights.some(function (l) { var r = l.getBoundingClientRect(); return r.top <= cy && r.bottom >= cy; }));
    }
  }
  window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(progress); } }, { passive: true });
  window.addEventListener('resize', progress);
  progress();
  if (top) top.addEventListener('click', function () {
    if (F.lenis) F.lenis.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: F.on ? 'smooth' : 'auto' });
    var skip = document.querySelector('.skip'); if (skip) skip.focus({ preventScroll: true });
  });

  if (!F.on || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    html.classList.remove('fx-on'); html.classList.add('fx-off'); F.on = false; window.__freshReady = true;
    return;
  }
  var plugins = [ScrollTrigger];
  if (window.ScrambleTextPlugin) plugins.push(window.ScrambleTextPlugin);
  if (window.DrawSVGPlugin) plugins.push(window.DrawSVGPlugin);
  gsap.registerPlugin.apply(gsap, plugins);
  gsap.defaults({ ease: 'power2.out', duration: 0.7 });

  /* smooth scrolling on desktop pointers only; touch screens keep their native scrolling */
  if (q.get('lenis') !== 'off' && !F.exact && window.Lenis && matchMedia('(pointer: fine)').matches) {
    var lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    F.lenis = lenis;
    document.addEventListener('click', function (e) {      // in-page links glide through Lenis too
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      var el = document.querySelector(a.getAttribute('href'));
      if (!el) return;
      e.preventDefault(); lenis.scrollTo(el, { offset: -80 });
    });
  }

  F.mm = gsap.matchMedia();
  F.mm.add({ reduceMotion: '(prefers-reduced-motion: reduce)' }, function (ctx) {
    if (ctx.conditions.reduceMotion) return;
    var reveals = F.q('[data-reveal]');
    gsap.set(reveals, { autoAlpha: 0, y: 28 });
    ScrollTrigger.batch(reveals, { start: 'top 85%', once: true,
      onEnter: function (els) { gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05, overwrite: true }); } });

    var groups = {};
    F.q('[data-batch]').forEach(function (el) { (groups[el.getAttribute('data-batch')] = groups[el.getAttribute('data-batch')] || []).push(el); });
    Object.keys(groups).forEach(function (g) {
      gsap.set(groups[g], { autoAlpha: 0, y: 32 });
      ScrollTrigger.batch(groups[g], { start: 'top 88%', once: true, interval: 0.1,
        onEnter: function (els) { gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06, overwrite: true }); } });
    });

    F.q('[data-typewriter]').forEach(function (el) {
      if (el.closest('.hero')) return;                        // the hero types after the opening screen (console.js)
      F.typer(el);
      ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: function () { F.typeTween(el); } });
    });

    if (window.ScrambleTextPlugin) {
      F.q('.code-label > span:last-child').forEach(function (el) {
        var txt = el.textContent;
        ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true,
          onEnter: function () { gsap.to(el, { duration: 0.7, scrambleText: { text: txt, chars: '01<>/#=+', speed: 0.6 } }); } });
      });
    }
  });

  /* positions change when fonts and images arrive */
  var refresh = function () { ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh);

  /* arriving with a section in the address (the footer's "Questions and answers" is the homepage's #questions): the
     browser jumps before the pinned sections take their room, so once they have, land on the section again, unless the
     visitor has started scrolling */
  if (location.hash) {
    var moved = false, stop = function () { moved = true; };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (t) { window.addEventListener(t, stop, { once: true, passive: true }); });
    var land = function () {
      var el = null;
      try { el = document.querySelector(decodeURIComponent(location.hash)); } catch (e) { /* not a section id */ }
      if (!el || moved) return;
      var y = el.getBoundingClientRect().top + window.scrollY - 80;
      if (F.lenis) F.lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
    };
    window.addEventListener('load', function () { refresh(); land(); setTimeout(land, 400); });
  }
})();
