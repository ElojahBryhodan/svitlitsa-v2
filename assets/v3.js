/* Світлиця – поведінка сторінки */
(function () {
  'use strict';
  var root = document.documentElement;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!hasGsap || reduce) root.classList.remove('motion');
  var motion = root.classList.contains('motion');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  var header = $('.hdr');

  /* ───────── Меню ───────── */
  var burger = $('.hdr__burger');
  var menu = $('#menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    header.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.classList.toggle('is-menu', open);
    if (open) {
      menu.hidden = false;
      if (hasGsap && !reduce) {
        gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .6, ease: 'expo.out' });
        gsap.fromTo($$('a', menu), { yPercent: 60, autoAlpha: 0 }, {
          yPercent: 0, autoAlpha: 1, duration: .6, stagger: .05, ease: 'power3.out', delay: .1,
          onComplete: function () { $('a', menu).focus({ preventScroll: true }); }
        });
      } else {
        $('a', menu).focus({ preventScroll: true });
      }
    } else {
      menu.hidden = true;
    }
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });

  /* ───────── FAQ ───────── */
  $$('.acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.acc__item');
      var open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ───────── Тема шапки за секцією під нею ───────── */
  var themed = $$('[data-header]');
  function updateHeader() {
    var probe = (header.offsetHeight || 60) * .5;
    var theme = 'dark';
    for (var i = 0; i < themed.length; i++) {
      var r = themed[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { theme = themed[i].getAttribute('data-header'); }
    }
    header.setAttribute('data-theme', theme);
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  /* Активний пункт навігації */
  var navLinks = $$('.hdr__nav a');
  function updateNav() {
    var mid = window.innerHeight * .4, active = null;
    navLinks.forEach(function (a) {
      var s = document.querySelector(a.getAttribute('href'));
      if (!s) return;
      var r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) active = a;
    });
    navLinks.forEach(function (a) { a.classList.toggle('is-active', a === active); });
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { updateHeader(); updateNav(); ticking = false; });
  }, { passive: true });
  updateHeader(); updateNav();

  if (!motion) return;

  /* ═════════════════ Далі – тільки режим руху ═════════════════ */
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  /* Скрол нативний: анімації мають оновлюватися і з клавіатури, і зі смуги прокрутки */
  gsap.ticker.lagSmoothing(0);

  /* ───────── 1 · Двері в світлицю ───────── */
  var hero = $('.hero'), stage = $('.hero__stage'), slot = $('.hero__slot');
  var doorSvg = $('.door'), doorG = $('.door__g'), wall = $('.door__wall'), frame = $('.door__frame');
  var photo = $('.hero__photo img');
  var spark = $('.spark');
  var l1 = $('.hero__l1'), l2 = $('.hero__l2'), intro = $('.hero__intro'), status = $('.hero__status');
  var MARK_H = 369.6, OPEN_CX = 139.15, OPEN_CY = 128.1, OPEN_W = 163.5, OPEN_H = 258.2;
  var DOT_CX = 138.2, DOT_CY = 178, DOT_DIAG = 62;
  var geo = {};
  var easeDoor = gsap.parseEase('power2.in');
  var easeSpark = gsap.parseEase('power2.inOut');
  var easeText = gsap.parseEase('power2.in');
  var doorState = { t: 0 };
  var isDesk = function () { return window.innerWidth >= 1024; };

  function measureDoor() {
    var sr = stage.getBoundingClientRect(), r = slot.getBoundingClientRect();
    var W = sr.width, H = sr.height;
    doorSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var s0 = r.height / MARK_H;
    geo = {
      W: W, H: H, s0: s0,
      x0: r.left - sr.left, y0: r.top - sr.top,
      s1: Math.max(W / OPEN_W, H / OPEN_H) * 1.14
    };
  }

  function renderDoor() {
    var t = doorState.t;
    var p = easeDoor(clamp((t - .12) / .88, 0, 1));
    var s = geo.s0 * Math.pow(geo.s1 / geo.s0, p);
    var c0x = geo.x0 + OPEN_CX * geo.s0, c0y = geo.y0 + OPEN_CY * geo.s0;
    var cx = lerp(c0x, geo.W / 2, p), cy = lerp(c0y, geo.H / 2, p);
    doorG.setAttribute('transform', 'translate(' + cx + ' ' + cy + ') scale(' + s + ') translate(' + (-OPEN_CX) + ' ' + (-OPEN_CY) + ')');
    doorSvg.style.visibility = p >= .999 ? 'hidden' : 'visible';
    frame.style.opacity = String(1 - clamp((p - .55) / .3, 0, 1));
    /* На мобільному світла частина кадру стоїть у прорізі, далі кадр сідає на місце */
    var pt = clamp(t, 0, 1);
    photo.style.transform = isDesk()
      ? 'scale(' + lerp(1.14, 1, pt) + ')'
      : 'translate3d(0,' + lerp(-20, 0, easeDoor(pt)) + '%,0) scale(' + lerp(1.34, 1, easeDoor(pt)) + ')';

    /* Тексти розходяться, як стулки */
    var q = easeText(clamp(t / .32, 0, 1));
    if (isDesk()) {
      l1.style.transform = 'translate3d(' + (-q * 12) + 'vw,0,0)';
      l2.style.transform = 'translate3d(' + (q * 12) + 'vw,0,0)';
      intro.style.transform = 'translate3d(' + (-q * 12) + 'vw,0,0)';
      status.style.transform = 'translate3d(' + (q * 12) + 'vw,0,0)';
    } else {
      var y = -q * 48;
      l1.style.transform = l2.style.transform = intro.style.transform = status.style.transform = 'translate3d(0,' + y + 'px,0)';
    }
    l1.style.opacity = l2.style.opacity = intro.style.opacity = status.style.opacity = String(1 - q);
    intro.style.pointerEvents = q > .5 ? 'none' : '';

    /* Вогник: із прорізу – на рейку нитки, далі лінію веде вона */
    var k = easeSpark(clamp((t - .04) / .55, 0, 1));
    var dx = cx + (DOT_CX - OPEN_CX) * s, dy = cy + (DOT_CY - OPEN_CY) * s;
    var side0 = DOT_DIAG * s / Math.SQRT2;
    var wm = $('.wm__dot').getBoundingClientRect();
    var sideT = Math.max(wm.width, 10) / Math.SQRT2;
    var sx = lerp(dx, wm.left + wm.width / 2, k), sy = lerp(dy, wm.top + wm.height / 2, k);
    var side = lerp(Math.min(side0, 400), sideT, k);
    var landed = k >= .999;
    spark.style.visibility = landed ? 'hidden' : 'visible';
    spark.style.width = spark.style.height = side + 'px';
    spark.style.transform = 'translate3d(' + (sx - side / 2) + 'px,' + (sy - side / 2) + 'px,0) rotate(45deg)';

  }

  measureDoor(); renderDoor();
  window.addEventListener('pageshow', function () { ScrollTrigger.refresh(); });
  var heroTrigger = ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: function () { return '+=' + $('.hero__spacer').offsetHeight; },
    scrub: fine ? .6 : true,
    invalidateOnRefresh: true,
    onRefresh: function (self) { measureDoor(); doorState.t = self.progress; renderDoor(); },
    onUpdate: function (self) { doorState.t = self.progress; renderDoor(); }
  });
  /* Коли хіро пройдено – вогник уже в лого */
  ScrollTrigger.create({
    trigger: hero, start: 'bottom top',
    onEnter: function () { spark.style.visibility = 'hidden'; },
    onLeaveBack: function () { renderDoor(); }
  });

  /* Інтро при завантаженні */
  gsap.from(slot.parentNode.querySelectorAll('.hero__l1, .hero__l2'), { yPercent: 40, autoAlpha: 0, duration: 1, stagger: .12, ease: 'power3.out', delay: .15, clearProps: 'visibility' });
  gsap.from([intro, status], { y: 24, autoAlpha: 0, duration: .9, stagger: .1, ease: 'power3.out', delay: .45, clearProps: 'visibility' });
  gsap.from(doorG, { opacity: 0, duration: 1.1, ease: 'power2.out' });
  gsap.from(spark, { opacity: 0, duration: .8, delay: .6, ease: 'power2.out' });

  /* ───────── Заголовки по рядках ───────── */
  if (window.SplitText) {
    gsap.registerPlugin(SplitText);
    $$('.split').forEach(function (el) {
      SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, {
            yPercent: 105, duration: .9, stagger: .08, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 86%', once: true }
          });
        }
      });
    });
  }

  /* ───────── Секції: спокійні появи ───────── */
  $$('.frame__img').forEach(function (box) {
    /* мʼяка поява: кадр підростає з меншого розміру */
    gsap.fromTo(box, { scale: .86, autoAlpha: 0, y: 34 }, {
      scale: 1, autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: box, start: 'top 88%', once: true }
    });
  });
  gsap.from('.plate', { y: 32, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: '.space__grid', start: 'top 78%', once: true } });
  gsap.from('.flow__item', { autoAlpha: 0, duration: .7, ease: 'power2.out', stagger: .1, scrollTrigger: { trigger: '.flow', start: 'top 82%', once: true } });
  gsap.from('.flow__arrow', { autoAlpha: 0, duration: .5, stagger: .12, delay: .2, scrollTrigger: { trigger: '.flow', start: 'top 82%', once: true } });
  /* партнери: ряди заїжджають назустріч, блок трохи підростає */
  (function () {
    var stage = $('.pstage'), a = $('.prow--a'), b = $('.prow--b');
    if (!stage || !a || !b) return;
    var travel = function (row) { return Math.max(0, row.scrollWidth - window.innerWidth); };
    gsap.set([a, b], { x: function (i, el) { return i === 0 ? -travel(el) * .55 : -travel(el) * .1; } });
    ScrollTrigger.create({
      trigger: '.partners', start: 'top bottom', end: 'bottom top', scrub: .8, invalidateOnRefresh: true,
      onUpdate: function (self) {
        var p = self.progress;
        gsap.set(a, { x: -travel(a) * (.62 - p * .5) });
        gsap.set(b, { x: -travel(b) * (.08 + p * .5) });
      }
    });
    gsap.fromTo(stage, { scale: .94, transformOrigin: '50% 0%' }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.partners', start: 'top 85%', end: 'top 25%', scrub: .6 }
    });
    gsap.from('.pcard', { autoAlpha: 0, duration: .6, stagger: .04, ease: 'power2.out', scrollTrigger: { trigger: '.partners', start: 'top 80%', once: true } });
  })();
  gsap.from('.doc__card', { y: 28, autoAlpha: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: '.doc__card', start: 'top 88%', once: true } });
  /* фінал: кадр розкривається на весь екран, темніє, проявляється знак */
  (function () {
    var fin = $('.final'), media = $('.final__media'), scrim = $('.final__scrim');
    var ftext = $('.final__text'), brand = $('.final__brand');
    if (!fin || !media) return;
    var closed = window.innerWidth >= 900 ? 'inset(8% 5% 8% 48% round 40px)' : 'inset(46% 5% 6% 5% round 26px)';
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: fin, start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true }
    });
    tl.fromTo(media, { clipPath: closed }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: .5, ease: 'power2.inOut' }, 0)
      .fromTo(media.firstElementChild, { scale: 1.12 }, { scale: 1, duration: .6 }, 0)
      .to(ftext, { autoAlpha: 0, y: -40, duration: .18, ease: 'power2.in' }, .12)
      .to(scrim, { opacity: .82, duration: .28 }, .42)
      .fromTo(brand, { autoAlpha: 0, scale: .94 }, { autoAlpha: 1, scale: 1, duration: .28, ease: 'power2.out' }, .58);
    /* коли кадр темніє – шапка стає світлою на темному */
    ScrollTrigger.create({
      trigger: fin, start: 'top top', end: 'bottom bottom',
      onUpdate: function (self) {
        var dark = self.progress > .34;
        if ((fin.getAttribute('data-header') === 'dark') !== dark) {
          fin.setAttribute('data-header', dark ? 'dark' : 'light');
          updateHeader();
        }
      },
      onLeave: function () { fin.setAttribute('data-header', 'dark'); updateHeader(); },
      onLeaveBack: function () { fin.setAttribute('data-header', 'light'); updateHeader(); }
    });
  })();
  gsap.from('.ftr__strip svg', { rotation: 90, scale: .4, autoAlpha: 0, duration: .8, stagger: .03, ease: 'power3.out', scrollTrigger: { trigger: '.ftr', start: 'top 92%', once: true } });

  /* ───────── Кроки: помаранчевий блок стрибає по картках ───────── */
  var flowWrap = $('.flow-wrap'), token = $('.token'), steps = $$('.flow__item');
  if (flowWrap && token && steps.length === 3) {
    var spots = [];
    function measureToken() {
      /* offset* не враховує анімаційні трансформи карток */
      spots = steps.map(function (el) {
        return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
      });
      token.style.width = spots[0].w + 'px';
      token.style.height = spots[0].h + 'px';
    }
    function placeToken(i, lift, tilt) {
      var s = spots[i];
      token.style.width = s.w + 'px';
      token.style.height = s.h + 'px';
      gsap.set(token, { x: s.x, y: s.y - (lift || 0), rotation: tilt || 0 });
      steps.forEach(function (el, k) { el.classList.toggle('is-on', k === i); });
    }
    measureToken(); placeToken(0);
    gsap.delayedCall(1.4, function () { measureToken(); placeToken(current); });

    /* переліт: підскок із нахилом і мʼяка «вага» на приземленні */
    function hopTo(i, dir) {
      var s = spots[i];
      var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, overwrite: true });
      tl.to(token, { width: s.w, height: s.h, duration: .45 }, 0)
        .to(token, { y: s.y - Math.min(46, s.h * .35), rotation: dir * 6, duration: .28, ease: 'power2.out' }, 0)
        .to(token, { x: s.x, duration: .56 }, 0)
        .to(token, { y: s.y, rotation: 0, duration: .3, ease: 'power2.in' }, .28)
        .to(token, { scaleY: .94, scaleX: 1.03, duration: .1, ease: 'power2.out' }, .58)
        .to(token, { scaleY: 1, scaleX: 1, duration: .42, ease: 'elastic.out(1, .55)' }, .68);
      steps.forEach(function (el, k) { el.classList.toggle('is-on', k === i); });
    }

    var current = 0;
    var desk = window.matchMedia('(min-width: 900px)').matches;
    if (desk) {
      /* три картки в ряд – блок іде за прогресом секції */
      ScrollTrigger.create({
        trigger: '.mission', start: 'top 62%', end: 'bottom 62%', invalidateOnRefresh: true,
        onUpdate: function (self) {
          var i = self.progress < .42 ? 0 : self.progress < .72 ? 1 : 2;
          if (i !== current) { hopTo(i, i > current ? 1 : -1); current = i; }
        }
      });
    } else {
      /* картки одна під одною: активна та, що найближча до центру екрана */
      var pick = function () {
        var mid = window.innerHeight * .5, best = 0, bestD = Infinity;
        steps.forEach(function (el, i) {
          var r = el.getBoundingClientRect();
          var d = Math.abs(r.top + r.height / 2 - mid);
          if (d < bestD) { bestD = d; best = i; }
        });
        if (best !== current) { hopTo(best, best > current ? 1 : -1); current = best; }
      };
      ScrollTrigger.create({
        trigger: '.mission', start: 'top bottom', end: 'bottom top',
        onUpdate: pick, onRefresh: pick
      });
    }

    ScrollTrigger.addEventListener('refreshInit', function () { measureToken(); });
    ScrollTrigger.addEventListener('refresh', function () { measureToken(); placeToken(current); });
  }

  /* ───────── Напрями: плитки рушника + цифра 1→4 ───────── */
  gsap.fromTo('.tile', { rotation: 90, scale: .6, autoAlpha: 0 }, {
    rotation: 0, scale: 1, autoAlpha: 1, ease: 'power3.out',
    stagger: { each: .03, grid: 'auto', from: 'start' },
    scrollTrigger: { trigger: '.towel', start: 'top 86%', end: 'top 30%', scrub: .6 }
  });
  gsap.from('.row', { y: 24, autoAlpha: 0, duration: .8, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: '.rows', start: 'top 82%', once: true } });

  var roll = $('.towel__roll'), dirRows = $$('.row');
  if (roll && dirRows.length) {
    gsap.set(roll, { yPercent: 0 });
    var setDir = function (i) {
      gsap.to(roll, { yPercent: -25 * i, duration: .75, ease: 'power3.out', overwrite: true });
      dirRows.forEach(function (r, k) { r.classList.toggle('is-active', k === i); });
    };
    dirRows.forEach(function (r, i) {
      ScrollTrigger.create({
        trigger: r, start: 'top 64%', end: 'bottom 64%',
        onEnter: function () { setDir(i); }, onEnterBack: function () { setDir(i); }
      });
      if (fine) r.addEventListener('pointerenter', function () { setDir(i); });
    });
  }

  /* ───────── Фото: нахил за курсором, внутрішній паралакс, блік ───────── */
  $$('.frame__img').forEach(function (box) {
    var img = $('img', box);
    /* насичення набирається на вході в екран */
    gsap.fromTo(img, { filter: 'saturate(.72) brightness(.96)' }, {
      filter: 'saturate(1) brightness(1)', duration: 1.2, ease: 'power2.out',
      scrollTrigger: { trigger: box, start: 'top 88%', once: true }
    });
    if (!fine) return;
    var rx = gsap.quickTo(box, 'rotationX', { duration: .5, ease: 'power3.out' });
    var ry = gsap.quickTo(box, 'rotationY', { duration: .5, ease: 'power3.out' });
    var ix = gsap.quickTo(img, 'xPercent', { duration: .6, ease: 'power3.out' });
    var iy = gsap.quickTo(img, 'yPercent', { duration: .6, ease: 'power3.out' });
    gsap.set(box, { transformPerspective: 900 });
    box.addEventListener('pointerenter', function () {
      gsap.to(img, { scale: 1.07, duration: .7, ease: 'power3.out' });
      gsap.fromTo(getShine(box), { xPercent: -130, autoAlpha: 1 }, { xPercent: 130, duration: 1.05, ease: 'power2.inOut', onComplete: function () { gsap.set(this.targets()[0], { autoAlpha: 0 }); } });
    });
    box.addEventListener('pointermove', function (e) {
      var r = box.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - .5;
      var dy = (e.clientY - r.top) / r.height - .5;
      ry(dx * 5); rx(-dy * 4); ix(dx * -2.6); iy(dy * -2.6);
    });
    box.addEventListener('pointerleave', function () {
      rx(0); ry(0); ix(0); iy(0);
      gsap.to(img, { scale: 1, duration: .8, ease: 'power3.out' });
    });
  });

  /* блік – окремий шар, щоб не чіпати псевдоелемент */
  function getShine(box) {
    var el = box.querySelector('.shine');
    if (!el) {
      el = document.createElement('span');
      el.className = 'shine';
      el.setAttribute('aria-hidden', 'true');
      box.appendChild(el);
    }
    return el;
  }

  /* ───────── Орнамент, що повільно обертається ───────── */
  (function () {
    var orn = $('.howit__orn');
    if (!orn) return;
    gsap.to(orn, { rotation: 360, duration: 48, ease: 'none', repeat: -1, transformOrigin: '50% 50%' });
    gsap.to(orn, {
      rotation: '+=120', ease: 'none',
      scrollTrigger: { trigger: '.howit', start: 'top bottom', end: 'bottom top', scrub: .8 }
    });
  })();

  /* ───────── Магнітна кнопка ───────── */
  if (fine) {
    $$('.magnet').forEach(function (btn) {
      var xTo = gsap.quickTo(btn, 'x', { duration: .35, ease: 'power3.out' });
      var yTo = gsap.quickTo(btn, 'y', { duration: .35, ease: 'power3.out' });
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        xTo(clamp((e.clientX - r.left - r.width / 2) * .25, -10, 10));
        yTo(clamp((e.clientY - r.top - r.height / 2) * .25, -10, 10));
      });
      btn.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* Висоти змінюються після шрифтів і фото */
  var refresh = function () { ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh);
  if (photo.decode) photo.decode().then(refresh).catch(function () {});
})();
