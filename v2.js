(function () {
  'use strict';

  /* шапка: прозрачная над первым экраном, тёмная после */
  var top = document.getElementById('top');
  function solid() { top.classList.toggle('solid', window.scrollY > 60); }
  window.addEventListener('scroll', solid, { passive: true });
  solid();

  /* лента систем: стрелки */
  document.querySelectorAll('.arr[data-strip]').forEach(function (b) {
    var strip = document.getElementById(b.dataset.strip);
    function state() {
      var dir = +b.dataset.dir;
      b.disabled = dir < 0 ? strip.scrollLeft < 4 : strip.scrollLeft + strip.clientWidth > strip.scrollWidth - 4;
    }
    b.addEventListener('click', function () {
      var w = strip.firstElementChild.getBoundingClientRect().width + 24;
      strip.scrollBy({ left: w * +b.dataset.dir, behavior: 'smooth' });
    });
    strip.addEventListener('scroll', state, { passive: true });
    window.addEventListener('resize', state);
    state();
  });
  /* стрелки систем прячем, когда все карточки и так помещаются */
  document.querySelectorAll('.arrows').forEach(function (box) {
    var strip = document.getElementById(box.querySelector('[data-strip]').dataset.strip);
    function fit() { box.hidden = strip.scrollWidth <= strip.clientWidth + 2; }
    window.addEventListener('resize', fit);
    window.addEventListener('load', fit);
    fit();
  });

  /* лента «9 ошибок»: стрелки и счётчик у заголовка, перетаскивание мышкой, подсказка */
  var mis = document.getElementById('mis');
  if (mis) {
    var cards = [].slice.call(mis.children), total = cards.length;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var bar = document.createElement('div');
    bar.className = 'misbar';
    bar.innerHTML = '<span class="misbar__n"><b>01</b> / ' + pad(total) + '</span><span class="misbar__line"><i></i></span>';
    var btns = mis.parentNode.querySelectorAll('.mis__btn');   // те же кнопки, что листают в main.js
    btns.forEach(function (b) { bar.appendChild(b); });
    mis.parentNode.querySelector('.head2').appendChild(bar);
    var num = bar.querySelector('b'), line = bar.querySelector('i');

    function step() { return cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(mis).columnGap || 16); }
    // ширина карточек от ширины экрана: на любом мониторе видно ~3,4 карточки (на планшете ~2,3), последняя обрезана
    function sizeCards() {
      var vw = document.documentElement.clientWidth;   // без полосы прокрутки, в отличие от 100vw
      var p = mis.parentNode, pr = p.getBoundingClientRect().right - parseFloat(getComputedStyle(p).paddingRight);
      mis.style.marginRight = -(vw - pr) + 'px';         // лента до правого края окна
      if (vw <= 640) { mis.style.removeProperty('--cw'); return; }
      var gap = parseFloat(getComputedStyle(mis).columnGap) || 20, n = vw > 980 ? 3.4 : 2.3;
      var vis = vw - mis.getBoundingClientRect().left;
      var w = Math.max(240, Math.min(520, (vis - Math.floor(n) * gap) / n));
      mis.style.setProperty('--cw', w.toFixed(1) + 'px');
    }
    sizeCards();

    // счётчик показывает карточки, которые видны целиком: «01–03 / 09», на телефоне «01 / 09»
    function upd() {
      var box = mis.getBoundingClientRect(), right = Math.min(box.right, document.documentElement.clientWidth);
      var first = 0, last = 0;
      cards.forEach(function (c, i) {
        var r = c.getBoundingClientRect();
        if (r.left >= box.left - 2 && r.right <= right + 2) { if (!first) first = i + 1; last = i + 1; }
      });
      if (!first) { first = last = Math.min(total, Math.round(mis.scrollLeft / step()) + 1); }
      num.textContent = first === last ? pad(first) : pad(first) + '–' + pad(last);
      line.style.transform = 'scaleX(' + (last / total) + ')';
    }
    mis.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', function () { sizeCards(); upd(); });
    window.addEventListener('load', function () { sizeCards(); upd(); });
    if ('ResizeObserver' in window) new ResizeObserver(function () { upd(); }).observe(mis);
    upd();

    // перетаскивание мышкой (на телефоне и так работает свайп)
    var down = false, sx = 0, sl = 0, moved = false;
    mis.querySelectorAll('img').forEach(function (i) { i.draggable = false; });
    mis.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = mis.scrollLeft;
      mis.classList.add('drag');
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 4) moved = true;
      mis.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      var target = Math.round(mis.scrollLeft / step()) * step();
      mis.classList.remove('drag');
      mis.scrollTo({ left: target, behavior: 'smooth' });
    });
    mis.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

    // один раз качнуть ленту, когда она впервые видна, — чтобы было понятно, что она листается
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var io = new IntersectionObserver(function (list) {
        if (!list[0].isIntersecting) return;
        io.disconnect();
        setTimeout(function () { if (mis.scrollLeft < 4) mis.classList.add('nudge'); }, 900);
      }, { threshold: 0.6 });
      io.observe(mis);
      mis.addEventListener('animationend', function () { mis.classList.remove('nudge'); });
    }
  }

  /* шаги: вкладки */
  var tabs = [].slice.call(document.querySelectorAll('.steps2__list [role=tab]'));
  function show(t) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.classList.toggle('on', on);
      x.setAttribute('aria-selected', on);
      var p = document.getElementById(x.getAttribute('aria-controls'));
      if (on && p.hidden) { p.classList.remove('anim'); void p.offsetWidth; p.classList.add('anim'); }
      p.hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t); });
    t.addEventListener('mouseenter', function () { if (window.matchMedia('(hover:hover)').matches) show(t); });
    t.addEventListener('keydown', function (e) {
      var k = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (k) { e.preventDefault(); var n = tabs[(i + k + tabs.length) % tabs.length]; show(n); n.focus(); }
    });
  });
})();
