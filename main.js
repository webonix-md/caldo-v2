(function () {
  'use strict';
  var RO = document.documentElement.lang === 'ro';
  var T = RO ? {
    lei: 'lei', month: 'lei/lună', days: function (a, b) { return a + '–' + b + ' zile'; },
    kw: ' kW', unknown: 'Am calculat pentru centrală pe gaz — inginerul vă va recomanda varianta potrivită.',
    pumpFlat: 'Pentru apartament recomandăm pompă aer-aer sau centrală pe gaz — inginerul va verifica.',
    m2: 'm²', msg: 'Bună ziua! Am calculat încălzirea pe site-ul CALDO:', copied: 'Textul este copiat — lipiți-l în Viber',
    from: 'de la ', perPiece: '', area: 'Suprafața', src: 'Sursa de căldură', dist: 'Distribuție', opts: 'Opțional', sum: 'Preț aproximativ'
  } : {
    lei: 'лей', month: 'лей/мес.', days: function (a, b) { return a + '–' + b + ' дней'; },
    kw: ' кВт', unknown: 'Посчитали по газовому котлу — инженер подскажет, что подойдёт вашему дому.',
    pumpFlat: 'Для квартиры чаще ставим газовый котёл или насос «воздух-воздух» — инженер проверит на месте.',
    m2: 'м²', msg: 'Здравствуйте! Посчитал отопление на сайте CALDO:', copied: 'Текст скопирован — вставьте его в Viber',
    from: 'от ', perPiece: '', area: 'Площадь', src: 'Источник тепла', dist: 'Разводка', opts: 'Дополнительно', sum: 'Примерная цена'
  };
  var PHONE = '37300000000';
  var D = JSON.parse(document.getElementById('calc-data').textContent);

  /* ---------- стопка секций: каждая липнет, когда её низ дошёл до низа экрана ---------- */
  var stacks = [].slice.call(document.querySelectorAll('.stack'));
  function setTops() {
    var vh = window.innerHeight;
    stacks.forEach(function (el) {
      el.style.setProperty('--t', Math.min(0, vh - el.offsetHeight) + 'px');
    });
  }
  setTops();
  window.addEventListener('resize', setTops);
  window.addEventListener('load', setTops);
  if ('ResizeObserver' in window) { var ro = new ResizeObserver(setTops); stacks.forEach(function (el) { ro.observe(el); }); }

  /* ---------- стопка фото: следующее фото включается, пока «окно» ещё ниже экрана и фон закрыт секциями ---------- */
  var wins = [].slice.call(document.querySelectorAll('.win'));
  var shots = [].slice.call(document.querySelectorAll('.bgstack img'));
  var cur = 0;
  function pickShot() {
    if (!shots.length) return;
    var lead = window.innerHeight + 120, n = 0;
    wins.forEach(function (w, i) { if (w.getBoundingClientRect().top < lead) n = i; });
    n = Math.min(n, shots.length - 1);
    if (n !== cur) { shots[cur].classList.remove('on'); shots[n].classList.add('on'); cur = n; }
  }
  window.addEventListener('scroll', pickShot, { passive: true });
  window.addEventListener('resize', pickShot);
  window.addEventListener('load', pickShot); // браузер восстанавливает прокрутку после перезагрузки
  pickShot();

  /* ---------- лента ошибок ---------- */
  var mis = document.getElementById('mis');
  if (mis) {
    var mb = document.querySelectorAll('.mis__btn');
    var misState = function () {
      mb[0].disabled = mis.scrollLeft < 4;
      mb[1].disabled = mis.scrollLeft + mis.clientWidth > mis.scrollWidth - 4;
    };
    mb.forEach(function (b) {
      b.addEventListener('click', function () {
        var card = mis.firstElementChild.getBoundingClientRect().width + 16;
        mis.scrollBy({ left: card * +b.dataset.dir, behavior: 'smooth' });
      });
    });
    mis.addEventListener('scroll', misState, { passive: true });
    window.addEventListener('resize', misState);
    misState();
  }

  /* ---------- меню ---------- */
  var burger = document.getElementById('burger'), nav = document.getElementById('nav');
  burger.addEventListener('click', function () {
    var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o);
  });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') { nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); } });

  /* ---------- расчёт ---------- */
  function fmt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function r500(n) { return Math.round(n / 500) * 500; }

  function calc(p) {
    var srcKey = p.src === 'unknown' ? 'gas' : p.src;
    var s = D.src[srcKey], d = D.dist[p.dist], k = D.obj[p.obj].k;
    var kw = Math.max(D.kwMin, Math.ceil(p.area * D.kwPerM2));
    var equip = s.equipBase + s.equipPerKw * kw;
    var work = s.install + d.perM2 * p.area * k;
    if (p.boiler) equip += D.options.boiler.price;
    if (p.wifi) equip += D.options.wifi.price;
    if (p.chimney && srcKey === 'solid') work += D.options.chimney.price;
    if (p.demount) work += D.options.demount.perM2 * p.area;
    var total = equip + work;
    var days = 2 + Math.ceil(p.area / 45) + (srcKey === 'pump' ? 2 : 0) + (p.dist !== 'rad' ? 2 : 0);
    return { kw: kw, equip: equip, work: work, lo: r500(total * D.range[0]), hi: r500(total * D.range[1]), days: [days, days + 2], run: s.runPerM2 * p.area };
  }

  // цифры «система на 120 м²» и «в месяц» в карточках и таблице
  var sample = { area: D.sampleArea, dist: 'rad', obj: 'house', boiler: true };
  document.querySelectorAll('[data-sys]').forEach(function (el) {
    var c = calc(Object.assign({}, sample, { src: el.dataset.sys, chimney: el.dataset.sys === 'solid' }));
    el.textContent = T.from + fmt(c.lo) + ' ' + T.lei;
  });
  document.querySelectorAll('[data-run]').forEach(function (el) {
    var c = calc(Object.assign({}, sample, { src: el.dataset.run }));
    el.textContent = '≈ ' + fmt(r500(c.run)) + ' ' + T.month;
  });
  document.querySelectorAll('[data-pack]').forEach(function (el) {
    var c = calc({ area: +el.dataset.pack, src: 'gas', dist: 'rad', obj: 'house', boiler: el.dataset.pack !== '100' });
    el.textContent = T.from + fmt(c.lo) + ' ' + T.lei;
  });

  // прайс
  var pl = document.getElementById('priceList');
  function money(s) {
    if (!/\d/.test(s)) return s;
    var i = s.indexOf(' / ');
    return i < 0 ? s + ' ' + T.lei : s.slice(0, i) + ' ' + T.lei + s.slice(i);
  }
  if (pl) pl.innerHTML = D.priceList.map(function (r) {
    return '<div class="price__row"><b>' + r[0] + '</b><span>' + r[1] + '</span><em>' + money(r[2]) + '</em></div>';
  }).join('');

  /* ---------- калькулятор ---------- */
  var form = document.getElementById('calcForm');
  var range = document.getElementById('area'), num = document.getElementById('areaNum');
  var chim = document.getElementById('optChimney');
  var $ = function (id) { return document.getElementById(id); };
  var last = '';

  function val(name) { var el = form.querySelector('[name=' + name + ']:checked'); return el ? el.value : null; }
  function state() {
    return {
      obj: val('obj'), area: Math.max(20, Math.min(1000, +num.value || 120)), src: val('src'), dist: val('dist'),
      boiler: form.boiler.checked, wifi: form.wifi.checked, chimney: form.chimney.checked, demount: form.demount.checked
    };
  }
  function paintRange() {
    var p = (range.value - range.min) / (range.max - range.min) * 100;
    range.style.setProperty('--p', p + '%');
  }
  function label(group, v) { var i = form.querySelector('[name=' + group + '][value=' + v + '] + span'); return i ? i.textContent : v; }

  function update() {
    var p = state(), c = calc(p);
    chim.hidden = p.src !== 'solid';
    $('resSum').textContent = fmt(c.lo) + ' – ' + fmt(c.hi) + ' ' + T.lei;
    $('resEq').textContent = fmt(r500(c.equip)) + ' ' + T.lei;
    $('resWork').textContent = fmt(r500(c.work)) + ' ' + T.lei;
    $('resKw').textContent = c.kw + T.kw;
    $('resDays').textContent = T.days(c.days[0], c.days[1]);
    $('resNote').textContent = p.src === 'unknown' ? T.unknown : (p.src === 'pump' && p.obj === 'flat' ? T.pumpFlat : '');
    var opts = ['boiler', 'wifi', 'chimney', 'demount'].filter(function (o) { return p[o] && !(o === 'chimney' && p.src !== 'solid'); })
      .map(function (o) { return form[o].parentNode.textContent.trim(); });
    last = T.msg + '\n' +
      '— ' + label('obj', p.obj) + ', ' + T.area.toLowerCase() + ' ' + p.area + ' ' + T.m2 + '\n' +
      '— ' + T.src + ': ' + label('src', p.src) + '\n' +
      '— ' + T.dist + ': ' + label('dist', p.dist) + '\n' +
      (opts.length ? '— ' + T.opts + ': ' + opts.join(', ') + '\n' : '') +
      '— ' + T.sum + ': ' + fmt(c.lo) + '–' + fmt(c.hi) + ' ' + T.lei;
    $('sendWa').href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(last);
  }

  range.addEventListener('input', function () { num.value = range.value; paintRange(); update(); });
  num.addEventListener('input', function () {
    var v = +num.value; if (v >= +range.min && v <= +range.max) range.value = v; else range.value = v < +range.min ? range.min : range.max;
    paintRange(); update();
  });
  num.addEventListener('blur', function () { num.value = state().area; });
  form.addEventListener('change', update);

  $('sendViber').addEventListener('click', function () {
    var b = this, old = b.textContent;
    function done() { b.textContent = T.copied; setTimeout(function () { b.textContent = old; }, 2600); }
    if (navigator.clipboard) navigator.clipboard.writeText(last).then(done, done); else done();
    setTimeout(function () { location.href = 'viber://chat?number=%2B' + PHONE; }, 400);
  });

  // кнопки «Посчитать для моего дома» и ситуации: выставляют варианты и ведут к калькулятору
  document.querySelectorAll('[data-pick]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      var p = JSON.parse(b.dataset.pick);
      ['obj', 'src', 'dist'].forEach(function (g) {
        if (p[g]) { var r = form.querySelector('[name=' + g + '][value=' + p[g] + ']'); if (r) r.checked = true; }
      });
      if (p.area) { num.value = p.area; range.value = p.area; paintRange(); }
      if (p.src === 'solid') form.chimney.checked = true;
      update();
      e.preventDefault();
      document.getElementById('calc').scrollIntoView({ behavior: 'smooth' });
    });
  });

  paintRange(); update();
})();
