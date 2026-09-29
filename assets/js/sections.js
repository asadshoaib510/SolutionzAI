/* Sections shared by every page of the fresh site (27 September 2026, moved out of console.js when the Services and service
   pages were added). Loaded after the page's own script (base.html), so its ScrollTriggers come after the page's in the
   flow; it sorts and refreshes them at the end and then marks the page ready.
   - F.setPanel(i)   lifts panel i out of the glass panel stack (partials/stack.html) and lights it green
   - [data-tilt]     glass cards lean toward the pointer (desktop pointers only)
   - [data-platforms] Platforms we build on (partials/platforms.html, homepage and About since 28 September 2026): the code
                     object's rows draw in (after the gsap-scroll variant), the two columns of names drift at three depths
                     and lean toward the pointer
   - [data-process]  How we work (partials/process.html): a timeline. Desktop: pinned, the track slides sideways (ease none,
                     so scroll and position line up), the green axis grows with it, and each step draws its stem, shows its
                     card and types its text as it passes the middle (containerAnimation triggers, scrubbed, so scrolling
                     back undoes them). Smaller screens: the same timeline down the page, the axis drawn with the scroll.
   Scrubs follow ?exact=1 (engine.js). Reduced motion, ?motion=off or no GSAP: everything stays as authored in CSS. */
(function () {
  'use strict';
  var F = window.__fresh;
  if (!F) { window.__freshReady = true; return; }
  var q = F.q, fine = matchMedia('(pointer: fine)').matches;

  var panels = q('[data-panel]');
  F.setPanel = function (i) { panels.forEach(function (p, n) { p.classList.toggle('is-active', n === i); }); };

  if (!F.on) { F.done(); return; }

  if (fine) q('[data-tilt]').forEach(function (card) {
    var rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' }), ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    gsap.set(card, { transformPerspective: 900 });
    card.addEventListener('pointermove', function (e) { var r = card.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 12); rx(((e.clientY - r.top) / r.height - 0.5) * -12); });
    card.addEventListener('pointerleave', function () { rx(0); ry(0); });
  });

  /* an answer opening or closing changes the page's length: every trigger below it is measured again */
  var refreshSoon;
  document.addEventListener('toggle', function (e) {
    if (e.target.tagName !== 'DETAILS') return;
    clearTimeout(refreshSoon); refreshSoon = setTimeout(function () { ScrollTrigger.refresh(); }, 60);
  }, true);

  /* the columns of platform names lean with the pointer, deeper names further (sideways only, away from the card) */
  var cloud = document.querySelector('.cloud');
  if (cloud && fine) {
    var movers = q('.cloud .cloud-chip').map(function (ch) { var d = parseFloat(ch.getAttribute('data-depth')) || 0.5; return { x: gsap.quickTo(ch, 'x', { duration: 0.8, ease: 'power3.out' }), d: d, left: !!ch.closest('.cloud-left') }; });
    cloud.addEventListener('pointermove', function (e) { var r = cloud.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5; movers.forEach(function (m) { m.x((m.left ? -1 : 1) * Math.abs(nx) * 30 * m.d); }); });
    cloud.addEventListener('pointerleave', function () { movers.forEach(function (m) { m.x(0); }); });
  }

  /* "any" always matches: gsap.matchMedia runs the function only while at least one condition is true */
  F.mm.add({ any: 'all', desktop: '(min-width: 1024px) and (min-height: 700px)', wide: '(min-width: 900px)', reduceMotion: '(prefers-reduced-motion: reduce)' }, function (ctx) {
    var c = ctx.conditions;
    if (c.reduceMotion) return;

    /* platforms: rows draw in (variant lines 158-168); the names drift at three depths.
       Each row plays once and its trigger stays (toggleActions, not once: true), and the trigger is made after its
       timeline: 29 September 2026, the founder saw "What we automate" freeze after coming back up from the bottom. When
       these triggers were made while the page was already scrolled past them (a reload at the bottom, or a window size
       or zoom change that rebuilds the animations there), several of them killed themselves inside ScrollTrigger's
       refresh of a later trigger, GSAP 3.13 lost its place and threw, and both pinned sections were left broken. */
    q('[data-platform-row]').forEach(function (row) {
      var chips = q('[data-chip]', row), label = row.querySelector('.pr-key');
      gsap.set(row, { '--rule': 0 }); gsap.set(label, { autoAlpha: 0, x: -12 }); gsap.set(chips, { autoAlpha: 0, y: 14 });
      var tl = gsap.timeline({ paused: true })
        .fromTo(row, { '--rule': 0 }, { '--rule': 1, duration: 0.7, ease: 'power2.inOut' }, 0)
        .to(label, { autoAlpha: 1, x: 0, duration: 0.5 }, 0.1)
        .to(chips, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.03 }, 0.2);
      ScrollTrigger.create({ trigger: row, start: 'top 90%', animation: tl, toggleActions: 'play none none none' });
    });
    if (c.wide) q('.cloud .cloud-chip').forEach(function (chip) {          // the platforms section only (service pages use the chips alone)
      var d = parseFloat(chip.getAttribute('data-depth')) || 0.5;
      gsap.fromTo(chip, { y: 16 * d }, { y: -16 * d, ease: 'none', scrollTrigger: { trigger: '.cloud', start: 'top bottom', end: 'bottom top', scrub: true } });   // small, so neighbours never overlap
    });

    var process = document.querySelector('[data-process]');
    if (process) {
      var track = process.querySelector('[data-tl-track]'), win = process.querySelector('.tl-window'), fill = process.querySelector('[data-tl-fill]');
      var axis = process.querySelector('.tl-axis'), steps = q('[data-tl-step]', process), end = process.querySelector('[data-tl-end]');
      var reveal = function (tl, st, at) {
        var ty = F.typer(st.querySelector('[data-tl-text]')), p = { n: 0 }, up = st.classList.contains('tl-up');
        tl.fromTo(st.querySelector('[data-tl-stem]'), { '--g': 0 }, { '--g': 1, duration: 0.35, ease: 'none' }, at)
          .fromTo(st.querySelector('[data-tl-dot]'), { scale: 0 }, { scale: 1, duration: 0.12, ease: 'none' }, at + 0.3)
          .fromTo(st.querySelector('[data-tl-card]'), { autoAlpha: 0, y: up ? 26 : -26 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, at + 0.28)
          .to(p, { n: ty.length, duration: 0.5, ease: 'none', onUpdate: function () { ty.set(p.n); } }, at + 0.45);
      };
      if (c.desktop) {
        process.classList.add('is-pinned');
        var dist = function () { return Math.max(0, win.getBoundingClientRect().left + track.scrollWidth - window.innerWidth); };
        /* the axis is lit up to 62% of the screen width, wherever the track has moved */
        var lit = function (prog) { var x = window.innerWidth * 0.62 - win.getBoundingClientRect().left + prog * dist(); return Math.max(0, Math.min(1, (x - axis.offsetLeft) / Math.max(1, axis.offsetWidth))); };
        var move = gsap.timeline({ scrollTrigger: { trigger: process, start: 'top top', end: function () { return '+=' + Math.round(dist() * 1.3); },
          pin: true, pinSpacing: true, scrub: F.scrub(0.5), anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1, id: 'process' } });
        move.fromTo(track, { x: 0 }, { x: function () { return -dist(); }, ease: 'none', duration: 1 }, 0)
            .fromTo(fill, { scaleX: function () { return lit(0); } }, { scaleX: function () { return lit(1); }, ease: 'none', duration: 1 }, 0);
        steps.concat(end ? [end] : []).forEach(function (st) {
          var tl = gsap.timeline();
          if (st === end) tl.fromTo(end, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 1, ease: 'power2.out' }, 0);
          else reveal(tl, st, 0);
          /* a step already on screen when the pin starts appears as the section scrolls up into place */
          var early = st.getBoundingClientRect().left < window.innerWidth * 0.88;
          ScrollTrigger.create(early
            ? { trigger: process, start: 'top 75%', end: 'top 10%', scrub: F.scrub(0.5), animation: tl }
            : { trigger: st, containerAnimation: move, start: 'left 88%', end: st === end ? 'left 60%' : 'left 52%', scrub: F.scrub(0.5), animation: tl });
        });
      } else {
        gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: track, start: 'top 70%', end: 'bottom 70%', scrub: F.scrub(0.4) } });
        steps.forEach(function (st) {
          var tl = gsap.timeline({ scrollTrigger: { trigger: st, start: 'top 85%', end: 'top 45%', scrub: F.scrub(0.4) } });
          reveal(tl, st, 0);
        });
      }
    }
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    return function () { if (process) process.classList.remove('is-pinned'); };
  });

  F.done();
})();
