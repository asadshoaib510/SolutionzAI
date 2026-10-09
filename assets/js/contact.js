/* The Contact page form (28 September 2026). With JavaScript the browser's own messages are held back until the visitor
   presses Send; then every empty required field or badly typed email is marked and the first one is focused. A complete
   form is sent to its action: since 8 October 2026 the Apps Script receiver (07-website/form/contact-form.gs) once
   FORM['endpoint'] holds its address, else api/contact, the small function planned for launch (Stage 4a technical plan: it checks
   Turnstile, emails info@solutionzai.com and forwards to an n8n webhook). The approved success message shows when the
   function answers yes; the approved "did not send" message, with the email address, shows otherwise, which is what
   happens until that function exists. A filled hidden field means a bot: the form is cleared without sending.
   Without JavaScript the browser checks the fields itself and posts the form normally.
   The signal beside the heading (founder's recording, 28 September 2026) leans toward the pointer, and the phone rings
   while the pointer is near it (desktop pointers, with motion on; its loop is CSS, pages.css). */
(function () {
  'use strict';
  var sig = document.querySelector('[data-signal] .signal');
  if (sig && window.gsap && document.documentElement.classList.contains('fx-on') && matchMedia('(pointer: fine)').matches) {
    var rx = gsap.quickTo(sig, 'rotationX', { duration: 0.8, ease: 'power3.out' }), ry = gsap.quickTo(sig, 'rotationY', { duration: 0.8, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) {
      var r = sig.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      ry(Math.max(-1, Math.min(1, dx / window.innerWidth * 2)) * 18); rx(Math.max(-1, Math.min(1, dy / window.innerHeight * 2)) * -14);
      sig.classList.toggle('is-near', Math.sqrt(dx * dx + dy * dy) < r.width * 0.8);
    }, { passive: true });
  }

  var form = document.querySelector('[data-contact-form]');
  if (!form) return;
  var ok = form.querySelector('[data-form-ok]'), err = form.querySelector('[data-form-err]'), btn = form.querySelector('button[type="submit"]');
  /* t: the milliseconds spent on the page before sending, measured here so the visitor's clock never matters (until
     8 October 2026 the time the page opened, which the receiver compared with Google's clock); the receiver takes a form
     sent within 3 seconds for a bot */
  var opened = form.querySelector('[data-form-t]'), openedAt = Date.now();
  form.noValidate = true;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    ok.hidden = true; err.hidden = true;
    form.classList.add('was-checked');
    if (!form.checkValidity()) { var bad = form.querySelector(':invalid'); if (bad) { bad.focus(); bad.reportValidity(); } return; }
    if (form.elements.website && form.elements.website.value) { form.reset(); form.classList.remove('was-checked'); return; }
    if (opened) opened.value = String(Date.now() - openedAt);
    btn.disabled = true; form.setAttribute('aria-busy', 'true');
    /* sent as an ordinary form (no preflight, so the Apps Script receiver can take it from any address); its answer is
       {"ok": true} once the email has gone (8 October 2026) */
    fetch(form.action, { method: 'POST', body: new URLSearchParams(new FormData(form)), headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { if (!j || j.ok !== true) throw new Error('not sent'); form.reset(); openedAt = Date.now(); form.classList.remove('was-checked'); ok.hidden = false; })
      .catch(function () { err.hidden = false; })
      .then(function () { btn.disabled = false; form.removeAttribute('aria-busy'); });
  });
})();
