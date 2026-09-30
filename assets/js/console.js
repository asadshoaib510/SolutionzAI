/* Site A "Console" (25 September 2026, rounds 2 and 3): the scroll choreography, GSAP ScrollTrigger throughout (after the
   gsap-scroll variant, src/variants/gsap-scroll/variant.js), with the keyboard from tiles.js.
   1 hero        the keyboard (a key rises only under the pointer), the eyebrow typed like a prompt once the opening
                 screen lifts, then the copy; the headline's last word types, erases and types the next (after the
                 founder's recording); parallax as the hero scrolls away
   2 workflow    the platform plates rise, lines draw into the code card (scrubbed), pulses run down them while the
                 section is on screen, the card writes itself line by line
   3 problems    glass cards: batched entrance (engine.js), columns drift at different speeds, each tilts to the pointer
   4 services    pinned on desktop: the list steps through six stops (snapped); the matching glass panel slides out.
                 Not pinned (phones, tablets, short screens; 29 September 2026): the stack stays in view while the list
                 scrolls past, each service slides in and lights its panel and its green line as it comes up under the
                 stack (30 September 2026), and the stack turns
   5 how we work the sideways timeline (sections.js, which also leans the glass cards)
   5 cases       shown in full on the page since 29 September 2026 (pop-up cards from 28 September until then)
   6 platforms   shared with the About page (sections.js): the rows draw in, the names drift at three depths
   Scrubs follow ?exact=1 (engine.js). Reduced motion, ?motion=off or no GSAP: everything stays as authored in CSS. */
(function () {
  'use strict';
  var F = window.__fresh || { on: false, q: function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }, done: function () { window.__freshReady = true; }, afterIntro: function (f) { f(); } };
  var q = F.q;

  /* ---------- the keyboard (drawn in every mode; still under reduced motion) ---------- */
  /* round 3: lower keys (the founder: "height is too high") and the field zoomed in like meetstream's. 28 September 2026:
     the keys at 90% ("I like the background when I zoom out to 90%"): 207 px on the founder's 1906 px wide screen, as they
     looked at 90% zoom, and in proportion to the width, with the first row as far down as there (originY, in key
     heights), so every desktop shows the same keys with the same marks. copyTop: where the hero copy starts (the copy
     block's layout position plus its top padding, so neither the scroll parallax nor the 90% text zoom skews it); marks
     that have to move stay above it. Round 11 tried no gap at all with a slimmer taper; the founder took it back ("I do not
     like them, please go back to how they were"), so the keys are as in round 10. Later the same day, on the founder's
     screen (1818 x 982 at 110%): "zoom in on the hero keys, if needed hide any keys under the red line": on desktop the
     keys were zoomed in (1.25, 1.12, then 1.08 times), and then (with a round 10 screenshot) "Can you make it back to this
     size", so every screen has the round 10 size again; the keyboard fades out toward the line (keysEnd) on desktop */
  var logos = JSON.parse(document.getElementById('tile-logos').textContent);
  var heroCanvas = document.getElementById('hero-tiles');
  var field = window.KeyField && heroCanvas ? new window.KeyField(heroCanvas, {
    logos: logos, base: 'assets/logos/', tilt: 0.58, thickness: 0.1, lift: 0.42, gap: 0.035, originX: 0.56,   // gap: 0.11 until 28 September 2026 ("I do not like the gaps between all the buttons"); gap 0 with inset 0.04 was tried and taken back
    size: function (w) { return Math.max(72, Math.min(300, w * 0.1086)); }, originY: 1.25,
    copyTop: function () { var c = document.querySelector('[data-hero-copy]');
      return c && c.offsetParent === heroCanvas.parentNode ? c.offsetTop + parseFloat(getComputedStyle(c).paddingTop) : heroCanvas.clientHeight * 0.42; },
    /* desktop (founder, 28 September 2026, a line drawn under the second line of the paragraph below the headline: "hide
       any keys under the red line"): the keyboard ends two thirds of the way down that paragraph, measured inside the copy
       block so the scroll parallax does not move it (and less the paragraph's own entrance offset) */
    keysEnd: function () {
      var c = document.querySelector('[data-hero-copy]'), l = c && c.querySelector('[data-hero="lead"]');
      if (!l || window.innerWidth < 1024 || c.offsetParent !== heroCanvas.parentNode) return Infinity;
      var cr = c.getBoundingClientRect(), lr = l.getBoundingClientRect(), dy = window.gsap ? parseFloat(gsap.getProperty(l, 'y')) || 0 : 0;
      return c.offsetTop + (lr.top - cr.top) - dy + lr.height * 0.66;
    }
  }) : null;
  if (field) heroCanvas.__field = field;          // read by tools/check_fresh.cjs (every mark on one key only)
  if (field && document.fonts) document.fonts.ready.then(function () { field.layout(); field.dirty = true; field.kick(); });   // the copy's first line settles once the fonts load

  /* the headline's last word: typed, held, erased, and the next one typed (after the founder's recording) */
  var rot = document.querySelector('[data-rotate]');
  function rotate() {
    var words = JSON.parse(rot.getAttribute('data-rotate')), i = 0, k = words[0].length, seen = true;
    var TYPE = 95, ERASE = 48, HOLD = 2600, GAP = 420;
    new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }).observe(rot);
    var show = function () { rot.textContent = words[i].slice(0, k); };
    (function erase() {
      setTimeout(function step() {
        if (window.__fxFreeze || document.hidden || !seen) return setTimeout(step, 500);
        rot.classList.add('is-typing');
        if (k > 0) { k--; show(); return setTimeout(step, ERASE); }
        i = (i + 1) % words.length;
        setTimeout(function type() {
          if (window.__fxFreeze) return setTimeout(type, 500);
          if (k < words[i].length) { k++; show(); return setTimeout(type, TYPE); }
          rot.classList.remove('is-typing'); erase();
        }, GAP);
      }, HOLD);
    })();
  }

  /* ---------- services: the list and the panels move together ---------- */
  var items = q('[data-service]'), panels = q('[data-panel]');
  function setService(i) {
    items.forEach(function (it, n) { it.classList.toggle('is-active', n === i); });
    panels.forEach(function (p, n) { p.classList.toggle('is-active', n === i); });
  }

  /* ---------- the code card's Copy button copies the workflow as plain text ---------- */
  var copy = document.querySelector('[data-copy]');
  if (copy && navigator.clipboard) copy.addEventListener('click', function () {
    var text = q('[data-cl]').map(function (l) { return Array.prototype.slice.call(l.childNodes).filter(function (n) { return !(n.classList && n.classList.contains('ln')); }).map(function (n) { return n.textContent; }).join(''); }).join('\n');
    navigator.clipboard.writeText(text).then(function () { copy.classList.add('is-done'); setTimeout(function () { copy.classList.remove('is-done'); }, 1600); });
  });

  if (!F.on) { F.done(); return; }

  /* pulses run only while the workflow section is on screen */
  var connect = document.querySelector('[data-connect]');
  if (connect) new IntersectionObserver(function (es) { connect.classList.toggle('is-live', es[0].isIntersecting); }, { threshold: 0.15 }).observe(connect);

  F.mm.add({ desktop: '(min-width: 1024px) and (min-height: 700px)', compact: '(max-width: 1023px), (max-height: 699px)', wide: '(min-width: 900px)', small: '(max-width: 767px)', reduceMotion: '(prefers-reduced-motion: reduce)' }, function (ctx) {
    var c = ctx.conditions;
    if (c.reduceMotion) return;

    /* ---- 1. hero: waits for the opening screen, then the eyebrow types and the copy follows ---- */
    var type = document.querySelector('[data-hero="eyebrow"] [data-typewriter]');
    if (type) F.typer(type);
    F.afterIntro(function () {
      if (rot) { rot.classList.add('is-live'); setTimeout(rotate, 900); }
      var intro = gsap.timeline({ delay: 0.05, defaults: { duration: 0.8, ease: 'power3.out' } });
      intro.fromTo('[data-hero="eyebrow"]', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0);
      if (type) intro.add(F.typeTween(type, 1.1), 0.1);
      /* the paragraph is on screen from the first paint (29 September 2026, so the page's main text never waits); the
         buttons, the note and the strip rise in */
      intro.fromTo('[data-hero="btns"]', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0 }, 0.6)
        .fromTo('[data-hero="note"]', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.75)
        .fromTo('[data-hero="strip"]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9 }, 0.8);
    });
    ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true,
      onUpdate: function (self) { if (field) field.setScroll(self.progress * window.innerHeight * 0.45, self.progress * -90); } });   // -90: the copy's own drift, below
    gsap.to('[data-hero-copy]', { y: -90, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    /* ---- 2. one workflow, scrubbed: plates, lines, card, lines of code ---- */
    var wf = gsap.timeline({ scrollTrigger: { trigger: '.connect-stage', start: 'top 85%', end: 'bottom 70%', scrub: F.scrub(0.6) } });
    wf.fromTo('.mini-key', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.04, duration: 0.3 }, 0);
    /* the lines on screen: the row of eight, or on phones the four under the two rows of plates (29 September 2026) */
    var lines = q('.cl-live').filter(function (l) { return l.ownerSVGElement && l.ownerSVGElement.getClientRects().length; });
    if (window.DrawSVGPlugin && lines.length) wf.fromTo(lines, { drawSVG: '0%' }, { drawSVG: '100%', stagger: 0.03, duration: 0.55, ease: 'none' }, 0.12);
    wf.fromTo('[data-code]', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35 }, 0.4)
      .fromTo('[data-cl]', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', stagger: 0.1, duration: 0.22, ease: 'none' }, 0.62);

    /* ---- 3. problems: the four columns drift at different speeds (yPercent, so the batched entrance keeps y) ---- */
    if (c.wide) q('[data-drift]').forEach(function (el) {
      var d = parseFloat(el.getAttribute('data-drift')) / 4;
      gsap.fromTo(el, { yPercent: d }, { yPercent: -d, ease: 'none', scrollTrigger: { trigger: '.problem-grid', start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* ---- 4. what we automate ---- */
    var services = document.querySelector('[data-services]'), rig = document.querySelector('[data-stack-rig]');
    if (c.desktop && services) {
      services.classList.add('is-pinned');
      ScrollTrigger.create({ trigger: services, start: 'top top', end: '+=' + (items.length * 55) + '%', pin: true, pinSpacing: true, anticipatePin: 1,
        snap: F.snap({ snapTo: 1 / (items.length - 1), duration: { min: 0.2, max: 0.5 }, delay: 0.05, ease: 'power1.inOut', inertia: false }),
        invalidateOnRefresh: true, refreshPriority: 1, id: 'services',
        onUpdate: function (self) { setService(Math.min(items.length - 1, Math.round(self.progress * (items.length - 1)))); } });
      if (rig) gsap.set(rig, { xPercent: -18, yPercent: 14, rotationX: -22 });
      if (rig) gsap.fromTo(rig, { rotationY: -50 }, { rotationY: -38, ease: 'none', scrollTrigger: { trigger: services, start: 'top top', end: '+=' + (items.length * 55) + '%', scrub: true } });
    } else {
      /* not pinned (29 September 2026, founder: "no motion effects on scroll sections ... 'What we automate'"): the stack
         stays in view (site.css); the service crossing two thirds of the way down the screen lights its panel and its
         green line, each service slides in as it arrives (fully legible throughout), and the stack turns a little with the scroll. All scrubbed, so
         scrolling back undoes them */
      /* the line a service crosses to light up: a little under the stack, which stays under the header (30 September 2026,
         founder: "when I start scrolling in 01 it is already on 02"; two thirds of the way down the screen until then, so
         the next service lit while the one before was still being read) */
      var visual = services.querySelector('.services-visual');
      var line = function () {
        if (window.innerWidth >= 1024 || !visual) return Math.round(window.innerHeight * 0.5);   // short desktops: the stack stands beside the list
        var b = parseFloat(getComputedStyle(visual).top) + visual.offsetHeight;
        return Math.round(b + (window.innerHeight - b) * 0.28);
      };
      items.forEach(function (it, i) {
        ScrollTrigger.create({ trigger: it, start: function () { return 'top ' + line() + 'px'; }, end: function () { return 'bottom ' + line() + 'px'; },
          onToggle: function (self) { if (self.isActive) setService(i); } });
        gsap.fromTo(it, { x: -24 }, { x: 0, ease: 'none', scrollTrigger: { trigger: it, start: 'top 96%', end: 'top 74%', scrub: F.scrub(0.4) } });   // a slide only: faded text would fail the contrast check (PageSpeed)
      });
      if (rig) {
        gsap.set(rig, { xPercent: -18, yPercent: 14, rotationX: -22 });
        gsap.fromTo(rig, { rotationY: -54 }, { rotationY: -34, ease: 'none', scrollTrigger: { trigger: '.service-list', start: 'top bottom', end: 'bottom top', scrub: true } });
      }
    }

    /* ---- 5. how we work and 6. platforms: shared with the other pages (sections.js) ---- */

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    return function () { if (services) services.classList.remove('is-pinned'); };
  });

  F.done();
})();
