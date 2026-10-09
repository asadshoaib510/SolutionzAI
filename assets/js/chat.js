/* The answers-only chat assistant (8 October 2026; the founder: "build the free answers-only version first"). A round green
   button at the bottom right opens a small panel. A question typed there is matched, in the browser, against the site's own
   approved answers (assets/js/chat.json, written by tools/build_fresh.py chat_data() from site_content.py: the ten
   questions, each service's questions, the services, how we work, the case studies, contact, booking, privacy). There is no
   AI and no server: nothing typed leaves the browser or is kept. When nothing matches well enough it offers the booking page
   and the email address. The answers load the first time the panel opens.
   Matching: the question's words, lower-cased, without the small words, cut to a stem, and folded into shared meanings
   (price, cost, fee... all count as "cost"), each weighted by how rare it is across the answers; a word found in an
   answer's question (or its extra words) counts three times one found only in the answer. The best answer above a floor is
   given, with up to three runners-up offered as next questions.
   The mouse wheel and touch scroll the conversation itself: the panel carries data-lenis-prevent, so the smooth page
   scroll (Lenis) leaves those events to the browser.
   Keyboard: the button opens and closes the panel, Esc closes it and returns to the button; the conversation is a live
   region, so a screen reader reads each answer. Reduced motion: no slide and no typing dots. */
(function () {
  'use strict';
  var me = document.currentScript;
  if (!me || !window.fetch) return;
  var SRC = me.getAttribute('data-src'), ROOT = me.getAttribute('data-root') || '', LABEL = me.getAttribute('data-label') || 'Ask a question';
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('fx-off');

  /* ---------- words ---------- */
  var STOP = {};
  ('a an the and or but if of to in on at by for from with about into over as is are was were be been being am do does did done ' +
   'i me my mine we us our ours you your yours he she it its they them their this that these those there here what which who whom ' +
   'whose why where when how can could would should will shall may might must have has had having get gets got just also please ' +
   'any some all each every no not so than then too very really want wanted like need needs one ones thing things kind sort way ' +
   'tell know let lets make makes made help offer able hi hello hey ok okay yes work works working person people someone somebody').split(' ').forEach(function (w) { STOP[w] = 1; });
  var MEAN = {};
  [['cost', 'cost costs costing price prices pricing priced fee fees charge charges charging quote quotes quoted budget expensive cheap afford affordable much rate rates pay paying'],
   ['time', 'long time timeline timelines week weeks day days fast quick quickly quicker duration soon month months turnaround'],
   ['data', 'hipaa secure security safe safety privacy private data protected phi compliant compliance confidential gdpr encrypt encrypted encryption'],
   ['call', 'phone phones call calls calling voice receptionist voicemail missed answer answering answered ring'],
   ['website', 'website websites site sites web seo google rank ranking ranked search searches page pages domain visibility'],
   ['agent', 'chatbot chatbots chat bot bots agent agents assistant assistants gpt chatgpt llm'],
   ['book', 'book books booking bookings booked appointment appointments meeting meetings schedule schedules scheduling consult consultation discovery calendar demo'],
   ['contact', 'contact contacts email emails mail reach talk speak touch'],
   ['software', 'crm software tool tools system systems integrate integrates integrated integration integrations connect connects connected connecting app apps platform platforms api apis'],
   ['invoice', 'invoice invoices invoicing billing bill bills payment payments paid reminder reminders'],
   ['lead', 'lead leads marketing prospect prospects followup follow outreach campaign campaigns sale sales'],
   ['report', 'dashboard dashboards report reports reporting numbers metric metrics kpi kpis analytics'],
   ['industry', 'industry industries healthcare health clinic clinics medical dental dentist dentists doctor doctors practice practices trade trades retail sector sectors field ' +
    'law lawyer lawyers legal attorney attorneys firm firms contractor contractors plumber plumbers hvac restaurant restaurants salon salons spa spas realtor realtors therapist therapists chiropractor chiropractors'],
   ['staff', 'staff team technical tech developer developers employee employees maintain maintenance manage training train'],
   ['automate', 'automate automates automated automating automation automations automatic'],
   ['example', 'example examples case cases study studies client clients result results proof portfolio'],
   ['founder', 'founder founders owner owners ceo background experience founded'],
   ['staff', 'technician technicians engineer engineers programmer programmers coder coders'],
   ['start', 'start starts started begin step steps onboard onboarding first'],
   ['service', 'service services']
  ].forEach(function (g) { g[1].split(' ').forEach(function (w) { MEAN[w] = g[0]; }); });
  function stem(w) {
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
    if (w.length > 4 && /ed$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /s$/.test(w) && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function words(s) {
    var out = [];
    String(s).toLowerCase().replace(/&/g, ' and ').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').split(' ').forEach(function (w) {
      if (!w || STOP[w]) return;
      out.push(MEAN[w] || MEAN[stem(w)] || stem(w));
    });
    return out;
  }
  function set(list) { var o = {}; list.forEach(function (w) { o[w] = 1; }); return o; }

  /* ---------- the answers ---------- */
  var data = null, items = [], idf = {}, byId = {};
  function prep(d) {
    data = d;
    items = d.items.map(function (it, i) { var q = set(words(it.q + ' ' + (it.k || ''))); return { i: i, it: it, q: q, qn: Object.keys(q).length, a: set(words(it.a)) }; });
    items.forEach(function (x) { byId[x.it.id] = x; });
    var df = {};
    items.forEach(function (x) { var seen = {}; Object.keys(x.q).concat(Object.keys(x.a)).forEach(function (w) { if (!seen[w]) { seen[w] = 1; df[w] = (df[w] || 0) + 1; } }); });
    Object.keys(df).forEach(function (w) { idf[w] = Math.log(1 + items.length / df[w]); });
  }
  /* a question's words, with two hints: "IT" in capitals is the staff question, and a "work with" / "connect" question
     naming a product the answers do not know is the "will it work with the software we already use" question */
  function terms(text) {
    var list = words(text);
    if (/\bIT\b/.test(text)) list.push('staff', 'staff');
    if (list.indexOf('agent') >= 0) list.push('agent', 'agent');   // a chatbot or an assistant decides it, even beside "website"
    if (/\b(work|works|working) with\b|\bintegrat|\bconnect|\bsupport|\bcompatible|\bdo you use\b/i.test(text) && list.some(function (w) { return !idf[w]; })) list.push('software');
    return list;
  }
  function rank(text) {
    var list = terms(text), n = list.length;
    if (!n) return [];
    var count = {}; list.forEach(function (w) { count[w] = (count[w] || 0) + 1; });
    return items.map(function (x) {
      var s = 0;
      Object.keys(count).forEach(function (w) { var f = (idf[w] || 0) * count[w]; if (x.q[w]) s += 3 * f; else if (x.a[w]) s += f; });
      // an answer whose own words are few (a focused question) wins a tie over one with a long list of extra words
      return { x: x, s: s / Math.sqrt(n) / (1 + 0.015 * x.qn) };
    }).filter(function (r) { return r.s > 0; }).sort(function (a, b) { return b.s - a.s; });
  }
  var FLOOR = 2.5;

  /* ---------- the panel ---------- */
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'chat-launch'; btn.setAttribute('aria-label', LABEL); btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'chat-panel'); btn.title = LABEL;
  btn.innerHTML = '<svg class="chat-ico-open" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01"/></svg>' +
    '<svg class="chat-ico-close" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  document.body.appendChild(btn);
  var panel = null, log = null, input = null, busy = false;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function href(h) { return /^(mailto:|tel:|https?:)/.test(h) ? h : ROOT + h; }
  function build() {
    var ui = data.ui;
    panel = el('section', 'chat-panel'); panel.id = 'chat-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-labelledby', 'chat-title'); panel.hidden = true;
    panel.setAttribute('data-lenis-prevent', '');   // the smooth page scroll leaves the wheel to the conversation (founder, 8 October 2026)
    var head = el('div', 'chat-head'), title = el('p', 'chat-title', ui.title); title.id = 'chat-title';
    var x = el('button', 'chat-x'); x.type = 'button'; x.setAttribute('aria-label', ui.close);
    x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    x.addEventListener('click', function () { close(true); });
    head.appendChild(title); head.appendChild(x);
    log = el('div', 'chat-log'); log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite');
    var form = el('form', 'chat-form');
    input = el('input', 'chat-input'); input.type = 'text'; input.maxLength = 300; input.autocomplete = 'off';
    input.placeholder = ui.placeholder; input.setAttribute('aria-label', ui.placeholder);
    var send = el('button', 'chat-send'); send.type = 'submit'; send.setAttribute('aria-label', ui.send);
    send.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
    form.appendChild(input); form.appendChild(send);
    form.addEventListener('submit', function (e) { e.preventDefault(); var t = input.value.trim(); if (!t || busy) return; input.value = ''; ask(t); });
    panel.appendChild(head); panel.appendChild(log); panel.appendChild(form);   // no line under the box (founder, 8 October 2026)
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); close(true); } });
    document.body.appendChild(panel);
    bot(ui.hello, null, data.starters.map(function (i) { return items[i]; }));
  }
  function scroll() { log.scrollTop = log.scrollHeight; }
  function you(text) { var m = el('div', 'chat-msg chat-you'); m.appendChild(el('p', null, text)); log.appendChild(m); scroll(); }
  function bot(text, links, chips) {
    var m = el('div', 'chat-msg chat-bot');
    String(text).split('\n').forEach(function (line) { if (line.trim()) m.appendChild(el('p', null, line)); });
    if (links && links.length) {
      var row = el('div', 'chat-links');
      links.forEach(function (l) { var a = el('a', 'chat-link', l.t); a.href = href(l.h); if (/^https?:/.test(l.h)) { a.target = '_blank'; a.rel = 'noopener'; } row.appendChild(a); });
      m.appendChild(row);
    }
    log.appendChild(m);
    if (chips && chips.length) {
      // the suggested questions: a labelled set of option buttons, so they never read as part of the conversation
      var label = log.children.length > 1 ? data.ui.more : (data.ui.pick || data.ui.more);
      var box = el('div', 'chat-chips'); box.setAttribute('role', 'group'); box.setAttribute('aria-label', label);
      box.appendChild(el('p', 'chat-more', label));
      chips.forEach(function (x) {
        var c = el('button', 'chat-chip', x.it.q); c.type = 'button';
        c.addEventListener('click', function () { if (busy) return; box.remove(); you(x.it.q); answer(x, rankRunners(x)); });
        box.appendChild(c);
      });
      log.appendChild(box);
    }
    scroll();
  }
  function rankRunners(x) {
    // next questions after a chosen one: the answers nearest to it, never itself
    return rank(x.it.q + ' ' + (x.it.k || '')).filter(function (r) { return r.x !== x; }).slice(0, 3).map(function (r) { return r.x; });
  }
  function answer(x, next) { reply(function () { bot(x.it.a, x.it.l, next); }); }
  function reply(fn) {
    if (still) { fn(); return; }
    busy = true;
    var dots = el('div', 'chat-msg chat-bot chat-typing'); dots.setAttribute('aria-hidden', 'true'); dots.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(dots); scroll();
    setTimeout(function () { dots.remove(); busy = false; fn(); }, 450);
  }
  function ask(text) {
    you(text);
    var ui = data.ui, w = text.toLowerCase();
    if (/^\s*(hi|hello|hey|good (morning|afternoon|evening)|salam|assalam)/.test(w) && words(text).length < 2) {
      return reply(function () { bot(ui.hello, null, data.starters.map(function (i) { return items[i]; })); });
    }
    if (/\b(thanks|thank you|thx|cheers|great|perfect)\b/.test(w) && words(text).length < 3) {
      return reply(function () { bot(ui.thanks, null, data.starters.map(function (i) { return items[i]; })); });
    }
    /* a few questions are clearest by their shape: booking a call (not the AI booking appointments for a business), and
       "who are you", "what do you do", "how do you work", which have no telling words of their own */
    var direct = null;
    if (/\b(book|schedule|arrange|set up|setup)\b/.test(w) && /\b(call|meeting|appointment|consultation|demo|time)s?\b/.test(w) &&
        !/\b(ai|agent|bot|chatbot|receptionist|customer|patient|client|caller)s?\b/.test(w)) direct = 'book';
    else if (/\b(your|ur) (phone|number|email|e-mail|address)\b|\bphone number\b|\bcall you\b|\bemail you\b/.test(w)) direct = 'contact';
    else if (/\bwho (are|is) (you|solutionz)\b|\babout (you|your company|the company)\b/.test(w)) direct = 'about';
    else if (/\bwhat (do|does) (you|solutionz|your (company|agency))( guys)? do\b/.test(w)) direct = 'agency';
    else if (/\bhow (do|does) (you|it|this|solutionz) work\b/.test(w)) direct = 'process';
    if (direct && byId[direct]) return answer(byId[direct], rankRunners(byId[direct]));
    var r = rank(text);
    if (!r.length || r[0].s < FLOOR) {
      return reply(function () { bot(ui.none, [ui.book, ui.email], data.starters.map(function (i) { return items[i]; })); });
    }
    var best = r[0].x;
    answer(best, r.slice(1).filter(function (o) { return o.s >= FLOOR * 0.6; }).slice(0, 3).map(function (o) { return o.x; }));
  }

  /* ---------- open and close ---------- */
  var loading = null;
  function load() {
    if (data) return Promise.resolve();
    if (!loading) loading = fetch(SRC).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(prep);
    return loading;
  }
  function open() {
    load().then(function () {
      if (!panel) build();
      panel.hidden = false; document.documentElement.classList.add('chat-open');
      btn.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(function () { panel.classList.add('is-in'); });
      if (matchMedia('(pointer: fine)').matches) input.focus();
    }).catch(function () { loading = null; window.location.href = ROOT + 'contact/'; });   // the answers could not load: the Contact page instead
  }
  function close(focus) {
    if (!panel || panel.hidden) return;
    panel.classList.remove('is-in'); panel.hidden = true; document.documentElement.classList.remove('chat-open');
    btn.setAttribute('aria-expanded', 'false');
    if (focus) btn.focus();
  }
  btn.addEventListener('click', function () { if (panel && !panel.hidden) close(false); else open(); });

  /* read by the checks: what the panel would answer to a question, and its scores */
  window.__chat = { FLOOR: FLOOR, ask: function (t) { return load().then(function () {
    var w = t.toLowerCase(), r = rank(t);
    var d = /\b(book|schedule|arrange|set up|setup)\b/.test(w) && /\b(call|meeting|appointment|consultation|demo|time)s?\b/.test(w) && !/\b(ai|agent|bot|chatbot|receptionist|customer|patient|client|caller)s?\b/.test(w) ? 'book'
      : /\b(your|ur) (phone|number|email|e-mail|address)\b|\bphone number\b|\bcall you\b|\bemail you\b/.test(w) ? 'contact'
      : /\bwho (are|is) (you|solutionz)\b|\babout (you|your company|the company)\b/.test(w) ? 'about' : /\bwhat (do|does) (you|solutionz|your (company|agency))( guys)? do\b/.test(w) ? 'agency'
      : /\bhow (do|does) (you|it|this|solutionz) work\b/.test(w) ? 'process' : null;
    if (d && byId[d]) return [[byId[d].it.q, 'direct']];
    return r.slice(0, 3).map(function (o) { return [o.x.it.q, Math.round(o.s * 10) / 10]; });
  }); } };
})();
