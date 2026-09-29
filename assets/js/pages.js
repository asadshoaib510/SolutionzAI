/* The Services overview and the service pages (27 September 2026). Runs before sections.js, which adds the timeline,
   the leaning glass cards, sorts every ScrollTrigger into page order and marks the page ready.
   Services overview
     [data-group]     as each group passes the middle of the screen, the panel stack beside it lifts that group's panel
                      and its line in the services.json jump card lights; the stack turns a little with the scroll
   Service page
     [data-scene]     the group's panel and its ring of platform logos lean toward the pointer (desktop pointers)
     [data-practice]  the scenario is typed one sentence per line as the section scrolls, and the diagram beside it lights
                      the step each sentence is on (scrubbed, so scrolling back undoes it); pulses run down the diagram
                      while it is on screen
     [data-cover]     Websites & SEO: the AI Visibility Audit's checks tick in one by one as the list scrolls through
                      (tied to the scroll, so scrolling back unticks them)
   About (28 September 2026)
     [data-rule-line] each of the five rules draws its line in as it scrolls up (scrubbed)
   Privacy (28 September 2026) reuses [data-group] and [data-jump]
   Reduced motion, ?motion=off or no GSAP: the pages stay as authored (every line shown and ticked, the first panel lifted). */
(function () {
  'use strict';
  var F = window.__fresh;
  if (!F || !F.on) return;
  var q = F.q, fine = matchMedia('(pointer: fine)').matches;
  var panels = q('[data-panel]'), jumps = q('[data-jump]');
  function setGroup(i) {
    panels.forEach(function (p, n) { p.classList.toggle('is-active', n === i); });
    jumps.forEach(function (j, n) { j.classList.toggle('is-current', n === i); });
  }

  /* the service page's panel and platform ring lean toward the pointer */
  var scene = document.querySelector('[data-scene]');
  if (scene && fine) {
    var inner = scene.querySelector('.svc-3d');
    var rx = gsap.quickTo(inner, 'rotationX', { duration: 0.8, ease: 'power3.out' }), ry = gsap.quickTo(inner, 'rotationY', { duration: 0.8, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) { ry((e.clientX / window.innerWidth - 0.5) * 16); rx((e.clientY / window.innerHeight - 0.5) * -10); }, { passive: true });
  }

  /* the scenario diagram's pulses run only while it is on screen */
  var flow = document.querySelector('[data-flow]');
  if (flow) new IntersectionObserver(function (es) { flow.classList.toggle('is-live', es[0].isIntersecting); }, { threshold: 0.2 }).observe(flow);

  /* "any" always matches: gsap.matchMedia runs the function only while at least one condition is true */
  F.mm.add({ any: 'all', desktop: '(min-width: 1024px)', reduceMotion: '(prefers-reduced-motion: reduce)' }, function (ctx) {
    var c = ctx.conditions;
    if (c.reduceMotion) return;

    /* ---- Services overview: the group in view lifts its panel ---- */
    var groups = q('[data-group]');
    groups.forEach(function (g, i) {
      ScrollTrigger.create({ trigger: g, start: 'top 55%', end: 'bottom 55%', onToggle: function (self) {
        if (self.isActive) setGroup(i);
        else if (i === 0 && self.direction < 0) jumps.forEach(function (j) { j.classList.remove('is-current'); });   // back above the groups: no line lit
      } });
    });
    var rig = document.querySelector('.groups [data-stack-rig]');
    if (rig && c.desktop) gsap.fromTo(rig, { rotationY: -52 }, { rotationY: -36, ease: 'none', scrollTrigger: { trigger: '.groups', start: 'top center', end: 'bottom center', scrub: true } });

    /* ---- service page: the scenario typed line by line, the diagram lighting each step ---- */
    var practice = document.querySelector('[data-practice]');
    if (practice) {
      var lines = q('[data-scenario-text]', practice).map(function (el) { return F.typer(el); });
      var nodes = q('[data-flow-node]', practice), total = lines.reduce(function (a, t) { return a + t.length; }, 0), p = { n: 0 };
      var show = function () {
        var left = p.n;
        lines.forEach(function (t, i) {
          var k = Math.max(0, Math.min(t.length, left)); left -= t.length;
          t.set(k);
          if (nodes[i]) { nodes[i].classList.toggle('is-lit', k > 0); nodes[i].classList.toggle('is-done', k >= t.length); }
        });
      };
      show();
      gsap.to(p, { n: total, ease: 'none', onUpdate: show, scrollTrigger: { trigger: practice.querySelector('.practice-grid'), start: 'top 78%', end: 'bottom 55%', scrub: F.scrub(0.4) } });
    }
    /* ---- About: each rule draws its line in as it scrolls up ---- */
    q('[data-rule-line]').forEach(function (l) {
      gsap.fromTo(l, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: l.parentNode, start: 'top 94%', end: 'top 62%', scrub: F.scrub(0.4) } });
    });

    /* ---- Websites & SEO: the audit's checks tick in as the list scrolls through ---- */
    var covers = q('[data-cover]');
    if (covers.length) {
      var tick = function (self) { var k = Math.round(self.progress * covers.length); covers.forEach(function (li, i) { li.classList.toggle('is-wait', i >= k); }); };
      ScrollTrigger.create({ trigger: covers[0].parentNode, start: 'top 80%', end: 'bottom 50%', onUpdate: tick, onRefresh: tick });
    }
    return function () { setGroup(0); covers.forEach(function (li) { li.classList.remove('is-wait'); }); };
  });
})();
