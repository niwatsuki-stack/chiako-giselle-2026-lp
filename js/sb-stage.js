/* ===========================================================================
   『眠れる森の美女 #shorts』トップの、触れる舞台の小さな仕掛け
   ① 舞台の明かりが、マウスを追う（金の題字を光が通り過ぎる）。幕と房は、マウスや指が触れると揺れて止まる
   ② 眠っている役に触れると、少しだけ身じろぎする
   ③ 公演についての日時の下に「目覚めまで あと○日」（見えた時に、数字が回って止まる）
   どれも飾り。動きを減らす設定の時は ①② は動かさず、③ は数字を回さずに出す
   ========================================================================== */
(function () {
  'use strict';
  if (window.__sbStageLoaded) return;
  window.__sbStageLoaded = true;

  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var nextFrame = window.requestAnimationFrame
    ? function (fn) { return window.requestAnimationFrame(fn); }
    : function (fn) { return setTimeout(fn, 16); };
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  /* ---------- ① 舞台の明かり・幕と房 ---------- */
  function initStage() {
    var hero = document.querySelector('.th-hero');
    if (!hero || REDUCED) return;
    var foil = hero.querySelector('.th-foil');
    var drapes = { l: hero.querySelector('.th-hero__drape--l'), r: hero.querySelector('.th-hero__drape--r') };
    var tassels = { l: hero.querySelector('.th-hero__tassel--l'), r: hero.querySelector('.th-hero__tassel--r') };

    // 明かりの今の位置（cur）と行き先（tgt）。x・y は真ん中からのずれ(px)、f は題字の上の光の帯の位置（0=左端・1=右端。外は見えない）
    var OFF_L = -0.9, OFF_R = 1.9;
    var cur = { x: 0, y: 0, f: OFF_L }, tgt = { x: 0, y: 0, f: OFF_L };
    var rect = null, foilRect = null, stale = true, running = false, foilTimer = null;

    function measure() {
      rect = hero.getBoundingClientRect();
      foilRect = foil ? foil.getBoundingClientRect() : null;
      stale = false;
    }
    function apply() {
      var h = rect ? rect.height : 800;
      hero.style.setProperty('--spot-x', cur.x.toFixed(1) + 'px');
      hero.style.setProperty('--spot-y', cur.y.toFixed(1) + 'px');
      hero.style.setProperty('--beam-skew', (Math.atan2(cur.x, h * 0.86) * 180 / Math.PI).toFixed(2) + 'deg');
      if (foil) foil.style.setProperty('--foil-p', ((1.3 - cur.f) / 1.6 * 100).toFixed(1) + '%');
    }
    // 人が操る明かりのように、少し遅れて追いつく
    function tick() {
      cur.x += (tgt.x - cur.x) * 0.085;
      cur.y += (tgt.y - cur.y) * 0.085;
      cur.f += (tgt.f - cur.f) * 0.11;
      apply();
      if (Math.abs(tgt.x - cur.x) > 0.3 || Math.abs(tgt.y - cur.y) > 0.3 || Math.abs(tgt.f - cur.f) > 0.004) nextFrame(tick);
      else running = false;
    }
    function go() { if (!running) { running = true; nextFrame(tick); } }
    function aim(px, py) {
      if (stale || !rect) measure();
      if (!rect.width || !rect.height) return;
      var nx = (px - rect.left) / rect.width - 0.5;
      var ny = (py - rect.top) / rect.height - 0.58;
      // 動く幅は小さく（左右に幅の 8%・上下に背の 7% まで）。端へやっても、題字は明かりの中に残る
      tgt.x = clamp(nx * rect.width * 0.3, -rect.width * 0.08, rect.width * 0.08);
      tgt.y = clamp(ny * rect.height * 0.3, -rect.height * 0.07, rect.height * 0.07);
      if (foilRect && foilRect.width) tgt.f = clamp((px - foilRect.left) / foilRect.width, OFF_L, OFF_R);
      // 題字の上の光は「通り過ぎる」だけ。マウスが止まったら、近い側の外へ逃がす（題字に白い色むらを残さない）
      clearTimeout(foilTimer);
      foilTimer = setTimeout(function () { tgt.f = cur.f > 0.5 ? OFF_R : OFF_L; go(); }, 450);
      go();
    }
    function home() {
      clearTimeout(foilTimer);
      tgt.x = 0; tgt.y = 0;
      tgt.f = cur.f > 0.5 ? OFF_R : OFF_L;
      go();
    }

    // 幕と房: 触れた側が、動いて来た向きへ揺れる（揺れているあいだは重ねない）
    function play(el, cls, dir, ms) {
      if (!el || el.classList.contains(cls)) return;
      el.style.setProperty('--dir', String(dir));
      el.classList.add(cls);
      setTimeout(function () { el.classList.remove(cls); }, ms);
    }
    var inside = { l: false, r: false, tl: false, tr: false };
    function near(el, px, py, pad) {
      if (!el) return false;
      var b = el.getBoundingClientRect();
      return px >= b.left - pad && px <= b.right + pad && py >= b.top - pad && py <= b.bottom + pad;
    }
    function touchCurtain(px, py, dx, byTap) {
      if (stale || !rect) measure();
      var dw = drapes.l ? drapes.l.offsetWidth : 0;
      if (!dw) return;
      var inL = px - rect.left < dw * 0.6, inR = rect.right - px < dw * 0.6;
      var onTL = near(tassels.l, px, py, 14), onTR = near(tassels.r, px, py, 14);
      // 向き: 右へ動いて来た時は右へ押す（房は下が右へ＝角度は負）。指で軽く触れた時は、舞台の内側へ
      var push = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
      if ((inL && !inside.l) || (byTap && inL)) play(drapes.l, 'is-sway', push || 1, 1950);
      if ((inR && !inside.r) || (byTap && inR)) play(drapes.r, 'is-sway', push || -1, 1950);
      if ((onTL && !inside.tl) || (byTap && (onTL || inL))) play(tassels.l, 'is-swing', -(push || 1), 2250);
      if ((onTR && !inside.tr) || (byTap && (onTR || inR))) play(tassels.r, 'is-swing', -(push || -1), 2250);
      inside.l = inL; inside.r = inR; inside.tl = onTL; inside.tr = onTR;
    }

    var lastX = null;
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var dx = lastX === null ? 0 : e.clientX - lastX;
      lastX = e.clientX;
      aim(e.clientX, e.clientY);
      touchCurtain(e.clientX, e.clientY, dx, false);
    });
    hero.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      lastX = null; inside.l = inside.r = inside.tl = inside.tr = false;
      home();
    });
    // 指: 幕や房に触れた時だけ揺らす。明かりは追わせない（スマホでは差が見えず、ページを送っているあいだ計算だけが走るため）
    hero.addEventListener('touchstart', function (e) {
      var t = e.touches && e.touches[0];
      if (t) touchCurtain(t.clientX, t.clientY, 0, true);
    }, { passive: true });
    function markStale() { stale = true; }
    window.addEventListener('scroll', markStale, { passive: true });
    window.addEventListener('resize', markStale);
  }

  /* ---------- ② 眠っている役の身じろぎ ---------- */
  function initSleepers() {
    var list = document.querySelector('.sb-cast-list');
    if (!list || REDUCED) return;
    function stir(card) {
      if (!card || !card.classList.contains('is-asleep') || card.classList.contains('is-stirring')) return;
      if (!card.querySelector('.sb-cast-zzz')) {
        var z = document.createElement('p');
        z.className = 'sb-cast-zzz';
        z.setAttribute('aria-hidden', 'true');
        z.textContent = 'すやすや…';
        card.appendChild(z);
      }
      card.classList.add('is-stirring');
      setTimeout(function () { card.classList.remove('is-stirring'); }, 2700);
    }
    each(list.querySelectorAll('.sb-cast-card'), function (card) {
      var passes = 0;
      card.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        passes += 1;
        if (passes <= 2) stir(card);   // マウスが通るだけで動くのは、1枚につき2回まで
      });
      card.addEventListener('click', function (e) {
        if (e.target && e.target.closest && e.target.closest('a, button')) return;
        stir(card);
      });
    });
    // はじめて見えた時に、画面の真ん中に近い1人だけが身じろぎする（触れると動く、という合図）
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setTimeout(function () {
          var mid = window.innerHeight / 2, best = null, bestGap = Infinity;
          each(list.querySelectorAll('.sb-cast-card.is-asleep'), function (card) {
            var b = card.getBoundingClientRect();
            if (b.bottom < 0 || b.top > window.innerHeight) return;
            var gap = Math.abs((b.top + b.bottom) / 2 - mid);
            if (gap < bestGap) { bestGap = gap; best = card; }
          });
          stir(best);
        }, 1100);
      });
    }, { threshold: 0, rootMargin: '-40% 0px -40% 0px' });
    io.observe(list);
  }

  /* ---------- ③ 目覚めまで あと○日 ---------- */
  var DAY = 24 * 60 * 60 * 1000;
  var SHOW_DAY = Date.UTC(2027, 7, 4);
  function daysUntilShow() {
    var now = new Date(Date.now() + 9 * 60 * 60 * 1000);   // 日本の日付で数える
    var today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Math.round((SHOW_DAY - today) / DAY);
  }
  function initCount() {
    var host = document.querySelector('.th-fact--date dd');
    if (!host) return;
    var days = daysUntilShow();
    if (days < 0) return;
    var el = document.createElement('span');
    el.className = 'th-fact__count';
    if (days === 0) {
      el.textContent = '今夜、目覚めます';
      host.appendChild(el);
      return;
    }
    var read = document.createElement('span');
    read.className = 'th-vh';
    read.textContent = '目覚めまで あと' + days + '日';
    var show = document.createElement('span');
    show.setAttribute('aria-hidden', 'true');
    var num = document.createElement('b');
    num.textContent = String(days);
    show.appendChild(document.createTextNode('目覚めまで'));
    var gap = document.createElement('i');
    show.appendChild(gap);
    show.appendChild(document.createTextNode('あと'));
    show.appendChild(num);
    show.appendChild(document.createTextNode('日'));
    el.appendChild(read);
    el.appendChild(show);
    host.appendChild(el);
    if (REDUCED || !('IntersectionObserver' in window)) return;
    // 見えた時に、少し先の数字から今日の数字まで、だんだん遅くなって止まる
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.disconnect();
        var from = days + 36, t0 = null, LEN = 1500;
        function step(now) {
          if (t0 === null) t0 = now;
          var p = clamp((now - t0) / LEN, 0, 1);
          var eased = 1 - Math.pow(1 - p, 4);
          num.textContent = String(Math.round(from - (from - days) * eased));
          if (p < 1) window.requestAnimationFrame(step);
          else num.textContent = String(days);
        }
        if (window.requestAnimationFrame) { num.textContent = String(from); window.requestAnimationFrame(step); }
      });
    }, { threshold: 1, rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
  }

  function init() { initStage(); initSleepers(); initCount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
