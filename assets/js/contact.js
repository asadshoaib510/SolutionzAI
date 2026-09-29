/* The Contact page form (28 September 2026). With JavaScript the browser's own messages are held back until the visitor
   presses Send; then every empty required field or badly typed email is marked and the first one is focused. A complete
   form is sent to its action, api/contact: the small function planned for launch (Stage 4a technical plan: it checks
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
  form.noValidate = true;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    ok.hidden = true; err.hidden = true;
    form.classList.add('was-checked');
    if (!form.checkValidity()) { var bad = form.querySelector(':invalid'); if (bad) { bad.focus(); bad.reportValidity(); } return; }
    if (form.elements.website && form.elements.website.value) { form.reset(); form.classList.remove('was-checked'); return; }
    btn.disabled = true; form.setAttribute('aria-busy', 'true');
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); form.reset(); form.classList.remove('was-checked'); ok.hidden = false; })
      .catch(function () { err.hidden = false; })
      .then(function () { btn.disabled = false; form.removeAttribute('aria-busy'); });
  });
})();
