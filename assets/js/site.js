/* Solutionz AI site script: theme toggle, menus, scroll reveal. No dependencies. */
(function () {
  'use strict';
  var html = document.documentElement;
  var THEME_KEY = 'sz-theme';

  /* ---------- theme ---------- */
  function systemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function currentTheme() {
    var t = html.getAttribute('data-theme');
    return t === 'light' || t === 'dark' ? t : systemTheme();
  }
  function labelToggle(btn) {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    btn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    btn.setAttribute('title', 'Switch to ' + next + ' theme');
  }
  var toggles = document.querySelectorAll('[data-theme-toggle]');
  Array.prototype.forEach.call(toggles, function (btn) {
    labelToggle(btn);
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode: the choice lasts for this page only */ }
      Array.prototype.forEach.call(toggles, labelToggle);
    });
  });
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      Array.prototype.forEach.call(toggles, labelToggle);
    });
  }

  /* ---------- header shadow once the page has scrolled ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 4); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- services menu (desktop) ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var menu = menuBtn && document.getElementById(menuBtn.getAttribute('aria-controls'));
  function closeMenu() { if (!menu) return; menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); }
  function openMenu() { if (!menu) return; menu.hidden = false; menuBtn.setAttribute('aria-expanded', 'true'); }
  if (menuBtn && menu) {
    closeMenu();
    var hoverOpened = false;
    menuBtn.addEventListener('click', function () {
      if (menu.hidden) { openMenu(); hoverOpened = false; }
      else if (hoverOpened) { hoverOpened = false; }      /* the pointer already opened it: a click keeps it open */
      else { closeMenu(); }
    });
    document.addEventListener('click', function (e) { if (!menu.hidden && !menuBtn.parentNode.contains(e.target)) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { closeMenu(); menuBtn.focus(); } });
    /* open on hover with a mouse, close when the pointer leaves the whole item. 30 September 2026 (founder: "Sometimes when
       I click on the 'Services' ... and hover my mouse to any service, the dropdown menu disappear"): coming back into the
       item or its menu now always cancels a pending close (it was cancelled only while the menu was shut, so crossing the
       gap above the menu let it close under the pointer), the gap is bridged (fresh.css .menu::before), and the close
       waits a little longer */
    var item = menuBtn.parentNode;
    var leaveTimer;
    item.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'mouse') return; clearTimeout(leaveTimer); if (menu.hidden) { openMenu(); hoverOpened = true; } });
    item.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'mouse') return; clearTimeout(leaveTimer); leaveTimer = setTimeout(function () { closeMenu(); hoverOpened = false; }, 300); });
  }

  /* ---------- mobile navigation ---------- */
  var navBtn = document.querySelector('.menu-toggle');
  var mobileNav = navBtn && document.getElementById(navBtn.getAttribute('aria-controls'));
  function setNav(open) {
    if (!mobileNav) return;
    mobileNav.hidden = !open;
    navBtn.setAttribute('aria-expanded', String(open));
    navBtn.querySelector('.label').textContent = open ? 'Close' : 'Menu';
    document.body.classList.toggle('nav-open', open);
  }
  if (navBtn && mobileNav) {
    setNav(false);
    navBtn.addEventListener('click', function () { setNav(mobileNav.hidden); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mobileNav.hidden) { setNav(false); navBtn.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1024 && !mobileNav.hidden) setNav(false); });
  }

  /* ---------- reveal as you scroll ---------- */
  var motionOn = html.getAttribute('data-motion') === 'on' && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var revealed = document.querySelectorAll('.reveal');
  if (motionOn && 'IntersectionObserver' in window) {
    Array.prototype.forEach.call(document.querySelectorAll('.reveal-stagger'), function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) { child.style.setProperty('--i', i); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(revealed, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(revealed, function (el) { el.classList.add('in'); });
  }
})();
