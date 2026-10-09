/* Keyboard field for the hero, drawn live on a canvas (Site A "Console", after the meetstream.ai hero, whose field is a
   looping video; drawing it live keeps it crisp at any size and lets it answer the pointer).
   Founder, 25 September 2026: the keys must read as keyboard keys, the marks must lie the way meetstream's do, and a key
   rises only under the pointer (no keys popping up by themselves). Round 3: lower keys, the field zoomed in like
   meetstream's, and every mark in the platform's own colours ("if it looks bad, I might ask you to put it back").
   - Each key is a keycap seen from above at an angle (an affine projection, drawn with ctx.setTransform): a rounded
     footprint on the ground, low sides that taper in to a bevelled top, and a dished top face carrying the platform mark.
     opts.gap is the ground left between neighbouring footprints and opts.inset how far the sides taper in, both as a share
     of a key; neither changes where the keys are, so neither adds or removes keys.
     The mark lies along the key's edges (its baseline runs up to the right, like meetstream's).
   - Marks are the official-colour SVG files (assets/logos, see SOURCE.txt), each drawn once into a small bitmap; marks
     that are black by design are tinted white, and Zapier uses its own dark-background file.
   - The key under the pointer rises out of the grid and turns brand green (#42CE33); it sinks back with a short trail
     when the pointer moves on.
   - Colours come from CSS custom properties (--key-*, resolved through a probe element). The page is dark only (founder,
     25 September 2026). Draws only while something moves; pauses off screen and in a hidden tab.
   No dependencies. */
(function () {
  'use strict';
  var GREEN_HI = [104, 226, 88], GREEN = [66, 206, 51], GREEN_L = [47, 165, 36], GREEN_R = [34, 128, 27], SPRITE = 192;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOn = document.documentElement.classList.contains('fx-on');

  function parse(c) { var m = c.match(/[\d.]+/g) || [0, 0, 0]; return [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function css(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a === undefined ? (c[3] === undefined ? 1 : c[3]) : a) + ')'; }

  /* the lower outline of a unit rounded square (leftmost point -> bottom point -> rightmost point), corner radius r */
  function outline(r) {
    var pts = [], split;
    function arc(cu, cv, a0, a1) { for (var i = 0; i <= 3; i++) { var a = (a0 + (a1 - a0) * i / 3) * Math.PI / 180; pts.push([cu + r * Math.cos(a), cv + r * Math.sin(a)]); } }
    arc(r, 1 - r, 135, 90);
    arc(1 - r, 1 - r, 90, 45); split = pts.length - 1;
    arc(1 - r, 1 - r, 45, 0);
    arc(1 - r, r, 0, -45);
    return { pts: pts, split: split };
  }

  function KeyField(canvas, opts) {
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.o = opts;
    var self = this;
    /* each mark: its image file, and a bitmap made from it once it loads (sprites()) */
    this.marks = (opts.logos || []).map(function (l) {
      var m = { l: l, img: null, sprite: null, wide: false }, im = new Image();
      im.decoding = 'async'; im.onload = function () { m.img = im; self.sprites(); self.dirty = true; self.kick(); };
      if (l.src) im.src = (opts.base || '') + l.src;      // no src: a place kept blank (8 October 2026), so no other mark moves
      return m;
    });
    /* the order marks are dealt to keys, most visible key first: the ranked marks (n8n, Claude, Salesforce and the others
       the founder asked to see) in their order, then the rest shuffled (a fixed seed, so the field looks the same on every
       visit) */
    var seed = 7, rnd = function () { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    var rest = [], firsts = [];
    this.marks.forEach(function (m, i) { (m.l.rank != null ? firsts : rest).push(i); });
    firsts.sort(function (p, q) { return self.marks[p].l.rank - self.marks[q].l.rank; });
    for (var r = rest.length - 1; r > 0; r--) { var q = (rnd() * (r + 1)) | 0, tmp = rest[r]; rest[r] = rest[q]; rest[q] = tmp; }
    this.deal = firsts.concat(rest);
    this.keys = []; this.px = -1e4; this.py = -1e4; this.pointerIn = false;
    this.shiftX = 0; this.shiftY = 0; this.tShiftX = 0; this.tShiftY = 0; this.scrollY = 0; this.tilt = opts.tilt || 0.58;
    this.running = false; this.visible = true; this.last = 0; this.dirty = true;
    this.shape = outline(0.24);
    this.probe = document.createElement('i'); this.probe.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none';
    canvas.parentNode.appendChild(this.probe);
    this.palette(); this.resize();
    if (window.ResizeObserver) new ResizeObserver(function () { self.resize(); self.kick(); }).observe(canvas);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; if (self.visible) self.kick(); }).observe(canvas);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) self.kick(); });
    if (motionOn && !reduce) {
      var host = opts.pointerHost || canvas.parentNode;
      var move = function (e) { var b = canvas.getBoundingClientRect(); self.px = e.clientX - b.left; self.py = e.clientY - b.top; self.pointerIn = true;
        self.tShiftX = (self.px / self.w - 0.5) * -22; self.tShiftY = (self.py / self.h - 0.5) * -14; self.kick(); };
      host.addEventListener('pointermove', move, { passive: true });
      host.addEventListener('pointerdown', move, { passive: true });
      host.addEventListener('pointerleave', function () { self.pointerIn = false; self.tShiftX = 0; self.tShiftY = 0; self.kick(); });
    }
    this.kick();
  }

  KeyField.prototype.palette = function () {
    var p = this.probe, get = function (name) { p.style.color = 'var(' + name + ')'; return parse(getComputedStyle(p).color); };
    this.col = { dishHi: get('--key-dish-hi'), dish: get('--key-dish'), bevel: get('--key-bevel'), sideL: get('--key-side-l'), sideR: get('--key-side-r'),
                 edge: get('--key-edge'), glow: get('--key-glow') };
    var d = this.col.dish; this.darkTheme = (0.2126 * d[0] + 0.7152 * d[1] + 0.0722 * d[2]) < 110;
    this.markAlpha = this.darkTheme ? 0.82 : 0.92;
    this.grad = null; this.dirty = true;
    if (this.marks) this.sprites();
  };

  /* one bitmap per mark: contain-fitted in a square, black marks tinted white on dark keys */
  KeyField.prototype.sprites = function () {
    var dark = this.darkTheme;
    this.marks.forEach(function (m) {
      var im = m.img;
      if (!im || !im.naturalWidth) return;
      var c = m.sprite || document.createElement('canvas'), x = c.getContext('2d');
      c.width = c.height = SPRITE; x.clearRect(0, 0, SPRITE, SPRITE);
      var r = im.naturalWidth / im.naturalHeight, w = r >= 1 ? SPRITE : SPRITE * r, h = r >= 1 ? SPRITE / r : SPRITE;
      x.drawImage(im, (SPRITE - w) / 2, (SPRITE - h) / 2, w, h);
      if (dark && m.l.mono) { x.globalCompositeOperation = 'source-in'; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, SPRITE, SPRITE); x.globalCompositeOperation = 'source-over'; }
      m.sprite = c; m.wide = r > 1.8;
    });
  };

  KeyField.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5), b = this.c.getBoundingClientRect();
    this.w = Math.max(1, b.width); this.h = Math.max(1, b.height); this.dpr = dpr;
    this.c.width = Math.round(this.w * dpr); this.c.height = Math.round(this.h * dpr);
    this.hw = this.o.size(this.w, this.h);
    this.gap = this.o.gap != null ? this.o.gap : 0.1; this.s = 1 - this.gap;
    this.layout(); this.grad = null; this.dirty = true;
    this.draw();                        // setting the canvas size clears it, so paint straight away
  };

  /* every mark appears once (founder, 26 September 2026: "make sure it appears once") and keeps its own key (founder,
     28 September 2026: "do not change the placement of any logo"). A mark's pin (tools/build_fresh.py KEY_PINS) is a key
     counted from the origin, so it is the same key at any screen size. Each mark sits on its key while that key is on
     screen. Marks whose key is off screen (on a phone), and marks without a pin, go in the deal order to the most visible
     blank keys: inside the frame and clear of the hero copy (above its first line, opts.copyTop, or right of it on wide screens), nearest
     the upper right first, then (founder, 28 September 2026: "add random logos to the empty buttons") any other blank
     key on screen. A mark with nowhere to go stays on its own key off screen. The first row sits the same part of a key below the top on every screen (opts.originY, in key
     heights), so a taller screen adds keys at the bottom, under the copy, and keeps the founder's top rows.
     opts.keysEnd() (founder, 28 September 2026, a line drawn across the hero: "hide any keys under the red line"; then,
     after seeing them cut off: "Hiding those keys does not look good, can you make it fade out?", then "fading should
     start below the line"): the keys fade out from FADE_TOP key heights above that height to fully gone FADE_END key
     heights below it, marks included (28 September 2026, back at the round 10 key size: "make last two lines noticeable
     fade", so the last two rows over the platform strip are clearly fainter and the rows beside the headline stay whole). A key in the fade still lights green under the pointer ("the faded area is not turning
     green when I hover the mouse"): draw() paints it again over the fade. A key wholly past the fade is dropped (not
     drawn, never lit, given no mark, so its mark moves up like an off-screen one). */
  var FADE_TOP = 0.6, FADE_END = 2;           // the fade runs from this many key heights above the founder's line to this many below it
  KeyField.prototype.layout = function () {
    var old = {}, keys = [], at = {}, loose = [], self = this, hw = this.hw, hh = hw * this.tilt, w = this.w, h = this.h;
    var fx = w * (this.o.focusX || 0.62), fy = h * (this.o.focusY || 0.3);
    this.keys.forEach(function (k) { old[k.i + ',' + k.j] = k; });
    this.ox = w * (this.o.originX || 0.5); this.oy = this.o.originY ? -hh * this.o.originY : -h * 0.18;
    var top = this.o.copyTop ? this.o.copyTop() : h * 0.42;
    var end = this.end = this.o.keysEnd ? this.o.keysEnd() : Infinity;
    var span = 3 + Math.ceil(w / hw / 2) + Math.ceil((h * 1.4) / hh / 2);
    for (var a = -span; a <= span * 2; a++) for (var b = -span; b <= span * 2; b++) {
      var cx = this.ox + (a - b) * hw, cy = this.oy + (a + b + 1) * hh;
      if (cx < -hw * 1.5 || cx > w + hw * 1.5 || cy < -hh * 2 || cy > h + hh * 3) continue;
      var inside = cx > hw * 0.3 && cx < w - hw * 0.3 && cy > hh * 0.4 && cy < h - hh * 0.4, was = old[a + ',' + b];
      var clear = cy + hh * 0.4 < top || (w >= 1280 && cx > w * 0.78);         // narrower screens: the copy runs the full width
      var hidden = cy - hh > end + hh * FADE_END;
      var key = { i: a, j: b, g: -1, heat: was ? was.heat : 0, hidden: hidden, shown: !hidden && cx > 0 && cx < w && cy > 0 && cy < h, open: !hidden && inside && clear, inside: inside,
                  rank: (cx - fx) * (cx - fx) + (cy - fy) * (cy - fy) * 2.5 };
      keys.push(key); at[a + ',' + b] = key;
    }
    this.deal.forEach(function (g) {
      var pin = self.marks[g].l.pin, k = pin && at[pin[0] + ',' + pin[1]];
      if (k && k.shown) k.g = g; else loose.push({ g: g, home: k });
    });
    var byRank = function (p, q) { return p.rank - q.rank; };
    var open = keys.filter(function (k) { return k.g < 0 && k.open; }).sort(byRank)
      .concat(keys.filter(function (k) { return k.g < 0 && !k.open && k.shown; }).sort(byRank));
    loose.forEach(function (m, n) { if (n < open.length) open[n].g = m.g; else if (m.home) m.home.g = m.g; });
    keys.sort(function (p, q) { return (p.i + p.j) - (q.i + q.j) || p.i - q.i; });
    this.keys = keys;
  };

  /* px: how far the keys have slid down as the hero scrolls away; endPx: how far the copy (and with it the keyboard's end)
     has moved, so the end stays on the founder's line under the text while the keys slide under it */
  KeyField.prototype.setScroll = function (px, endPx) { this.scrollY = px; this.endShift = endPx || 0; this.dirty = true; this.kick(); };

  KeyField.prototype.kick = function () {
    if (this.running || !this.visible || document.hidden) return;
    var self = this; this.running = true; this.last = 0;
    requestAnimationFrame(function f(t) { if (!self.frame(t)) { self.running = false; return; } requestAnimationFrame(f); });
  };

  /* one animation step; returns false once everything has settled */
  KeyField.prototype.frame = function (t) {
    if (!this.visible || document.hidden) return false;
    var dt = this.last ? Math.min(0.05, (t - this.last) / 1000) : 0.016; this.last = t;
    var moving = false, hh = this.hw * this.tilt, T = hh * (this.o.thickness || 0.22);
    var e = 1 - Math.exp(-dt * 6);
    var sx = this.shiftX + (this.tShiftX - this.shiftX) * e, sy = this.shiftY + (this.tShiftY - this.shiftY) * e;
    if (Math.abs(sx - this.shiftX) > 0.05 || Math.abs(sy - this.shiftY) > 0.05) moving = true;
    this.shiftX = sx; this.shiftY = sy;
    /* the key under the pointer (measured on the plane of the key tops) */
    var hu = null, hv = null;
    if (this.pointerIn) {
      var X = (this.px - this.ox - this.shiftX) / this.hw, Y = (this.py + T - (this.oy + this.shiftY + this.scrollY)) / hh;
      hu = Math.floor((X + Y) / 2); hv = Math.floor((Y - X) / 2);
    }
    var up = 1 - Math.exp(-dt * 14), down = 1 - Math.exp(-dt * 3.2);
    for (var n = 0; n < this.keys.length; n++) {
      var k = this.keys[n], target = (!k.hidden && k.i === hu && k.j === hv) ? 1 : 0, h0 = k.heat;
      k.heat += (target - k.heat) * (target > k.heat ? up : down);
      if (Math.abs(target - k.heat) < 0.002) k.heat = target;
      if (k.heat !== h0) moving = true;
    }
    if (moving || this.dirty) { this.draw(); this.dirty = false; }
    return moving;
  };

  KeyField.prototype.draw = function () {
    var ctx = this.ctx, dpr = this.dpr, hw = this.hw, hh = hw * this.tilt, s = this.s, g = this.gap / 2, C = this.col, o = this.o, self = this;
    var pts = this.shape.pts, split = this.shape.split;
    var T = hh * (o.thickness || 0.22), L = hh * (o.lift || 0.95);
    var inset = (o.inset || 0.07) * s, top = s - 2 * inset, dishIn = 0.075 * s, dish = top - 2 * dishIn;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.c.width, this.c.height);
    if (!this.grad) { this.grad = ctx.createLinearGradient(0, 0, dish, dish); this.grad.addColorStop(0, css(C.dishHi)); this.grad.addColorStop(1, css(C.dish)); }
    var ox = this.ox + this.shiftX, oy = this.oy + this.shiftY + this.scrollY, litGrad = null;
    var sideL = css(C.sideL), sideR = css(C.sideR), bevel = css(C.bevel), edge = css(C.edge), alpha = this.markAlpha;
    /* one key; ka scales its whole opacity (a lit key drawn again over the fade, below) */
    function key(k, ka) {
      var heat = k.heat;
      var bx = ox + (k.i - k.j) * hw, by = oy + (k.i + k.j + 2 * g) * hh;          // screen point of the footprint's back corner
      if (bx < -hw * 3 || bx > self.w + hw * 3 || by < -hh * 4 || by > self.h + hh * 2) return;
      var lift = T + heat * L;
      ctx.globalAlpha = ka;
      if (heat > 0.02) {                                   // green light pooling on the ground under a rising key
        ctx.setTransform(hw * dpr, hh * dpr, -hw * dpr, hh * dpr, bx * dpr, by * dpr);
        var rg = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, 1.3);
        rg.addColorStop(0, css(C.glow, 0.5 * heat)); rg.addColorStop(1, css(C.glow, 0));
        ctx.fillStyle = rg; ctx.fillRect(s / 2 - 1.4, s / 2 - 1.4, 2.8, 2.8);
      }
      /* sides: from the footprint's lower outline on the ground up to the bevel's lower outline, tapering inward */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (var face = 0; face < 2; face++) {
        var a0 = face ? split : 0, a1 = face ? pts.length - 1 : split, p, q, u, v;
        ctx.beginPath();
        for (p = a0; p <= a1; p++) { q = pts[p]; u = inset + q[0] * top; v = inset + q[1] * top; ctx.lineTo(bx + (u - v) * hw, by + (u + v) * hh - lift); }
        for (p = a1; p >= a0; p--) { q = pts[p]; u = q[0] * s; v = q[1] * s; ctx.lineTo(bx + (u - v) * hw, by + (u + v) * hh); }
        ctx.closePath();
        ctx.fillStyle = heat > 0.02 ? css(mix(face ? C.sideR : C.sideL, face ? GREEN_R : GREEN_L, heat)) : (face ? sideR : sideL);
        ctx.fill();
      }
      /* bevel ring and dished top, in grid space, lifted */
      ctx.setTransform(hw * dpr, hh * dpr, -hw * dpr, hh * dpr, bx * dpr, (by - lift) * dpr);
      if (heat > 0.02) { ctx.shadowColor = css(C.glow, 0.6 * heat); ctx.shadowBlur = 40 * heat * dpr; }
      ctx.beginPath(); ctx.roundRect(inset, inset, top, top, top * 0.24);
      ctx.fillStyle = heat > 0.02 ? css(mix(C.bevel, GREEN_L, heat)) : bevel; ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
      ctx.lineWidth = 0.014; ctx.strokeStyle = heat > 0.4 ? 'rgba(255,255,255,0.4)' : edge; ctx.stroke();
      ctx.save(); ctx.translate(inset + dishIn, inset + dishIn);
      ctx.beginPath(); ctx.roundRect(0, 0, dish, dish, dish * 0.22);
      ctx.fillStyle = self.grad; ctx.fill();
      if (heat > 0.02) {
        if (!litGrad) { litGrad = ctx.createLinearGradient(0, 0, dish, dish); litGrad.addColorStop(0, css(GREEN_HI)); litGrad.addColorStop(1, css(GREEN)); }
        ctx.globalAlpha = ka * Math.min(1, heat * 1.2); ctx.fillStyle = litGrad; ctx.fill(); ctx.globalAlpha = ka;
      }
      /* the mark lies on the dish along the key's edges: its baseline runs up to the right on screen */
      var m = self.marks[k.g];
      if (m && m.sprite) {
        var ms = dish * (m.wide ? 0.8 : 0.52);
        ctx.translate(dish / 2, dish / 2); ctx.rotate(-Math.PI / 2);
        ctx.globalAlpha = ka * (alpha + (1 - alpha) * heat);
        ctx.drawImage(m.sprite, -ms / 2, -ms / 2, ms, ms);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    for (var n = 0; n < this.keys.length; n++) if (!this.keys[n].hidden) key(this.keys[n], 1);
    /* toward the founder's line the keyboard fades out, gently at first; the fade stays with the copy as the hero scrolls away */
    if (isFinite(this.end) && this.end < this.h) {
      var line = this.end + (this.endShift || 0), e0 = line - hh * FADE_TOP, e1 = line + hh * FADE_END;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var fade = ctx.createLinearGradient(0, e0, 0, e1);
      /* "make last two lines noticeable fade" (28 September 2026): on the founder's screen the second-last row loses about a
         third, the last row over the strip about four fifths */
      fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(0.1, 'rgba(0,0,0,0.12)'); fade.addColorStop(0.2, 'rgba(0,0,0,0.34)');
      fade.addColorStop(0.4, 'rgba(0,0,0,0.6)'); fade.addColorStop(0.6, 'rgba(0,0,0,0.8)'); fade.addColorStop(0.8, 'rgba(0,0,0,0.93)');
      fade.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = fade; ctx.fillRect(0, e0, this.w, e1 - e0);
      ctx.fillStyle = '#000'; ctx.fillRect(0, e1, this.w, Math.max(0, this.h - e1));
      ctx.globalCompositeOperation = 'source-over';
      /* a key lit under the pointer in the faded part (founder: "the faded area is not turning green when I hover the
         mouse") is drawn again over the fade, as strongly as it is lit, so it rises out of the dark and sinks back */
      for (n = 0; n < this.keys.length; n++) {
        var k = this.keys[n];
        if (k.hidden || k.heat <= 0.02) continue;
        if (oy + (k.i + k.j + 2 * g + 2) * hh > e0) key(k, k.heat);
      }
    }
  };

  window.KeyField = KeyField;
})();
