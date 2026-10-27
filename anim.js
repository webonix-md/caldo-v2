(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  root.classList.add('js-anim');

  /* первый экран: строки заголовка выезжают из-под маски */
  var h1 = document.querySelector('.hero h1');
  if (h1) {
    h1.innerHTML = h1.innerHTML.split(/<br\s*\/?>/i).map(function (l, i) {
      return '<span class="ln"><span style="--i:' + i + '">' + l + '</span></span>';
    }).join('');
  }
  requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.add('ready'); }); });

  /* фото в карточках систем — в обёртку, чтобы при наведении приближать внутри рамки */
  document.querySelectorAll('.scard > img').forEach(function (img) {
    var w = document.createElement('div'); w.className = 'scard__ph';
    img.parentNode.insertBefore(w, img); w.appendChild(img);
  });

  /* появление при прокрутке: элементы одного ряда — с небольшой задержкой друг за другом */
  var SEL = '.sec .tag, .sec h2, .head2 > p, .kick:not(.hero .kick), .sys2__head h2, .scard, .steps2__list li, .steps2__panels, ' +
    '.comp__text h2, .comp__text > p, .comp__list li, .comp__pic, .band2 h2, .band2 .btn, .split__img, .split__text > p, .opt__item, ' +
    '.scheme__step, .mis__card, .mis__nav, .calc__intro, .calc__box, .pack, .price__row, .price__note, .cmp-wrap, .advice p, .work, ' +
    '.guar > div, .brands, .reviews blockquote, .faq__head, .faq__list details, .contacts > div, .contacts__info > div';
  var els = [].slice.call(document.querySelectorAll(SEL));
  els.forEach(function (el) {
    var sib = [].slice.call(el.parentNode.children).filter(function (x) { return els.indexOf(x) > -1; });
    el.style.setProperty('--d', (Math.min(sib.indexOf(el), 6) * 0.08) + 's');
    el.classList.add('rv');
  });

  /* счётчики: «3 года», «0 лей», «1 день» и плашка «3 года гарантии» */
  function count(el) {
    var m = el.textContent.match(/^(\D*)(\d+)(.*)$/);
    if (!m || +m[2] === 0) return;
    var to = +m[2], t0 = null, dur = 900;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 3)));
      el.textContent = m[1] + v + m[3];
      if (k < 1) requestAnimationFrame(step);
    }
    el.textContent = m[1] + '0' + m[3];
    requestAnimationFrame(step);
  }
  var counters = [].slice.call(document.querySelectorAll('.hero__facts b, .comp__pic b, .guar b'));

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (counters.indexOf(e.target) > -1) count(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
    counters.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  /* сумма в калькуляторе вспыхивает при пересчёте */
  var sum = document.getElementById('resSum');
  if (sum && 'MutationObserver' in window) {
    var tm;
    new MutationObserver(function () {
      sum.classList.add('flash'); clearTimeout(tm);
      tm = setTimeout(function () { sum.classList.remove('flash'); }, 350);
    }).observe(sum, { childList: true, characterData: true, subtree: true });
  }

  /* лёгкий параллакс фото-полосы перед калькулятором и фото мастера */
  var par = [].slice.call(document.querySelectorAll('.band2 img, .comp__pic img'));
  var ticking = false;
  function parallax() {
    ticking = false;
    var vh = window.innerHeight;
    par.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var k = (r.top + r.height / 2 - vh / 2) / vh;   // −1…1 вокруг центра экрана
      img.style.transform = 'translate3d(0,' + (k * -40).toFixed(1) + 'px,0) scale(1.12)';
    });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
  window.addEventListener('resize', parallax);
  parallax();
})();
