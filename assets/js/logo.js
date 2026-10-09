/* The header logo comes alive (founder, 25 September 2026: "can you make the logo animate"). After the opening screen the
   ribbon symbol assembles from its four faces (the navy left leg rises in, the green right leg drops in, the inner return
   and the fold unfold at the join), the SOLUTIONZ AI letters rise one by one and AI AUTOMATION AGENCY types itself in.
   Hovering the logo gives the mark a small ripple, once the entrance has finished (8 October 2026: arriving on the
   homepage from the logo left the pointer on it, the ripple started while the letters were still rising and froze the first
   ones half way down, the founder: "when I go back to home page 'SOLUTIONZ AI' logo gets messed up"). The colours never change (navy and green, memory: logo-never-white),
   and nothing moves under reduced motion or ?motion=off. Needs GSAP; without it the logo simply stands. */
(function () {
  'use strict';
  var F = window.__fresh;
  if (!F || !F.on || !window.gsap) return;
  var logo = document.querySelector('.site-header .logo-svg');
  if (!logo) return;
  var q = function (s) { return Array.prototype.slice.call(logo.querySelectorAll(s)); };
  var f = q('.lg-f'), letters = q('.lg-l'), desc = q('.lg-d');
  gsap.set(f.concat(letters, desc), { transformOrigin: '50% 50%' });
  gsap.set(f[0], { x: -320, y: 480, autoAlpha: 0 });              // navy left leg, from below left
  gsap.set(f[3], { x: 320, y: -480, autoAlpha: 0 });              // green right leg, from above right
  gsap.set([f[1], f[2]], { scale: 0, autoAlpha: 0, transformOrigin: '0% 0%' });   // inner return and fold, from the join
  gsap.set(letters, { y: 70, autoAlpha: 0 });
  gsap.set(desc, { autoAlpha: 0 });

  var busy = true;                                             // no ripple until the logo has come in
  function play() {
    gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: function () { busy = false; } })
      .to([f[0], f[3]], { x: 0, y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1 }, 0)
      .to([f[1], f[2]], { scale: 1, autoAlpha: 1, duration: 0.55, ease: 'back.out(1.8)', stagger: 0.08 }, 0.55)
      .to(letters, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.035 }, 0.35)
      .to(desc, { autoAlpha: 1, duration: 0.01, stagger: 0.045, ease: 'none' }, 0.95);   // typed in, one letter at a time
  }
  F.afterIntro(play);

  /* hover: the legs part a little and snap back, the letters ripple (up, then back to 0, never to a value caught mid-way) */
  logo.closest('a').addEventListener('pointerenter', function () {
    if (busy) return; busy = true;
    gsap.timeline({ onComplete: function () { busy = false; } })
      .to(f[0], { x: -42, duration: 0.18, ease: 'power2.out' }, 0).to(f[3], { x: 42, duration: 0.18, ease: 'power2.out' }, 0)
      .to([f[1], f[2]], { y: 36, duration: 0.18, ease: 'power2.out' }, 0)
      .to(f, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.45)' }, 0.18)
      .to(letters, { y: -18, duration: 0.16, stagger: 0.025, ease: 'power2.out' }, 0.05)
      .to(letters, { y: 0, duration: 0.16, stagger: 0.025, ease: 'power2.in' }, 0.21);
  });
})();
