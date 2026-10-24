/* ==========================================================================
   2027『眠れる森の美女 #shorts』出演者の ♡推し・推しカード・目を覚ます演出
   使う所: トップの CAST（index.html）と、出演者のページ（cast/*.html の 2027 版）。

   ・カード（data-cast-slug を持つ要素）が正本。名前・役・写真は、その data-* から読む。
   ・♡ は 1台の端末で 1人につき 1つ（localStorage）。もう一度押すと外れる（2026 と同じ）。
   ・数は Firebase RTDB（chiako-oshi-2026）の castVotes/y2027_<slug> に、runTransaction で 1 ずつ足し引きする。
   ・数は公開しない。URL に #admin-chiako を付けた時だけ、カードごとの数と順位を出す。
     2027 の ♡ の合計が 30 以上になった時だけ、合計を CAST の下に出す（2026 と同じ）。
   ・テスト: localhost（127.0.0.1 なども）で開いた時は、最初から本番のデータベースに一切つながず、この端末の中だけで数える。
     localhost でも本番に書くのは ?oshi=live を付けた時だけ。公開のサイトでは、いつも本番に書く。
   ・推しカード: この端末の中で canvas に描く（1080×1350 と 1080×1920）。写真は同じサイトの物だけ使う。
   ・GA4: oshi_vote / oshi_card_create / oshi_card_share（個人の情報は送らない。送るのは出演者の slug と押した物だけ）
   ========================================================================== */
(function () {
  'use strict';
  if (window.__sbOshiLoaded) return;
  window.__sbOshiLoaded = true;

  // ---------- 決まっている値 ----------
  var FIREBASE = {
    apiKey: 'AIzaSyCAT4eDtAkp8eoOPwoRq6sdz-g6ciFWgvs',
    authDomain: 'chiako-oshi-2026.firebaseapp.com',
    databaseURL: 'https://chiako-oshi-2026-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'chiako-oshi-2026',
    storageBucket: 'chiako-oshi-2026.firebasestorage.app',
    messagingSenderId: '948733958615',
    appId: '1:948733958615:web:cb4a58d2d3912455ad1392'
  };
  var SDK = 'https://www.gstatic.com/firebasejs/10.13.2/';
  var PREFIX = 'y2027_';
  var LS_OSHI = 'sb_oshi_2027_v1';
  var LS_WOKEN = 'sb_cast_woken_2027_v1';
  var PUBLIC_MIN = 30;
  var ADMIN_HASH = 'admin-chiako';
  var SITE = 'https://balletshorts.confy.co.jp';
  var TITLE = '眠れる森の美女';
  var HASHTAG = '#眠れる森の美女shorts';
  var VENUE = '練馬文化センター 大ホール';
  var DATE_JP = '2027年8月4日(水) 18:30開演';
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var MOCK = LOCAL && !/(?:^|&)oshi=live(?:&|$)/.test(location.search.slice(1));

  // ---------- 小物 ----------
  function all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 保存できない端末でも動く */ } }
  function track(name, params) { try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) {} }
  function slugOk(s) { return typeof s === 'string' && /^[a-z0-9][a-z0-9-]{0,47}$/.test(s); }
  function param(name) { var m = location.search.match(new RegExp('[?&]' + name + '=([^&]*)')); return m ? decodeURIComponent(m[1]) : null; }
  function sameOrigin(src) { try { return new URL(src, location.href).origin === location.origin; } catch (e) { return false; } }

  // ---------- カードの情報（data-* が正本）----------
  function castOf(el) {
    var d = el.dataset;
    return {
      slug: d.castSlug,
      roleJp: d.roleJp || '', roleEn: d.roleEn || '',
      nameJp: d.nameJp || '', nameEn: d.nameEn || '',
      affil: d.affil || '',
      photo: d.photo || '', pos: d.photoPos || '50% 30%',
      page: d.page || '', video: d.video || ''
    };
  }
  function castEls() { return all('[data-cast-slug]').filter(function (el) { return slugOk(el.getAttribute('data-cast-slug')); }); }
  function castBySlug(slug) { var el = castEls().filter(function (e) { return e.getAttribute('data-cast-slug') === slug; })[0]; return el ? castOf(el) : null; }

  // ---------- データベース ----------
  function realDb() {
    var ready = null;
    function sdk() {
      if (ready) return ready;
      ready = new Promise(function (resolve, reject) {
        // Firebase の部品は、最初に ♡ を押した時（と管理の表示の時）だけ読む
        window.addEventListener('sb-oshi-fb', function () { window.__sbOshiFB ? resolve(window.__sbOshiFB) : reject(new Error('firebase load failed')); }, { once: true });
        var s = document.createElement('script');
        s.type = 'module';
        s.textContent =
          'import { initializeApp } from "' + SDK + 'firebase-app.js";' +
          'import { getDatabase, ref, runTransaction, onValue } from "' + SDK + 'firebase-database.js";' +
          'try { const app = initializeApp(' + JSON.stringify(FIREBASE) + ', "sb-oshi-2027");' +
          'window.__sbOshiFB = { db: getDatabase(app), ref, runTransaction, onValue }; } catch (e) { console.warn("[oshi]", e); }' +
          'window.dispatchEvent(new Event("sb-oshi-fb"));';
        s.onerror = function () { reject(new Error('firebase load failed')); };
        document.head.appendChild(s);
        setTimeout(function () { reject(new Error('firebase timeout')); }, 15000);
      });
      return ready;
    }
    return {
      vote: function (slug, delta) {
        return sdk().then(function (f) {
          return f.runTransaction(f.ref(f.db, 'castVotes/' + PREFIX + slug), function (cur) {
            var v = (typeof cur === 'number' ? cur : 0) + delta;
            return v < 0 ? 0 : v;
          });
        }).catch(function (e) { console.warn('[oshi] ♡ を送れませんでした', e && e.message); });
      },
      readAll: function () {
        return fetch(FIREBASE.databaseURL + '/castVotes.json', { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : {}; })
          .then(function (d) { return d || {}; })
          .catch(function () { return {}; });
      },
      watch: function (cb) {
        sdk().then(function (f) { f.onValue(f.ref(f.db, 'castVotes'), function (snap) { cb(snap.val() || {}); }); })
          .catch(function (e) { console.warn('[oshi] 数を読めませんでした', e && e.message); });
      }
    };
  }
  function mockDb() {
    // テスト用（localhost では最初からこれ。?oshi=live の時だけ本番）。本番のデータベースには一切つながない
    var KEY = 'sb_oshi_mock_db';
    var data = {};
    try { data = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch (e) { data = {}; }
    var seed = parseInt(param('oshiSeed') || '0', 10);
    if (seed > 0 && !Object.keys(data).length) {
      var slugs = castEls().map(function (e) { return e.getAttribute('data-cast-slug'); }).filter(function (s, i, a) { return a.indexOf(s) === i; });
      slugs.forEach(function (s, i) { data[PREFIX + s] = 0; });
      for (var i = 0; i < seed && slugs.length; i++) data[PREFIX + slugs[(i * 7 + 3) % slugs.length]] += 1;
    }
    var subs = [];
    function save() { try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
    function copy() { return JSON.parse(JSON.stringify(data)); }
    console.info('[oshi] テスト（mock）: 本番のデータベースにはつながりません');
    return {
      vote: function (slug, delta) {
        var k = PREFIX + slug;
        data[k] = Math.max(0, (data[k] || 0) + delta);
        save();
        console.info('[oshi mock] ' + k + ' ' + (delta > 0 ? '+1' : '-1') + ' → ' + data[k]);
        subs.forEach(function (cb) { cb(copy()); });
        return Promise.resolve();
      },
      readAll: function () { return Promise.resolve(copy()); },
      watch: function (cb) { subs.push(cb); cb(copy()); },
      _data: data
    };
  }
  var db = MOCK ? mockDb() : realDb();

  // ---------- ♡推し ----------
  function oshiList() { var l = lsGet(LS_OSHI, []); return Array.isArray(l) ? l.filter(slugOk) : []; }
  function isOshi(slug) { return oshiList().indexOf(slug) !== -1; }
  function syncHearts(slug) {
    all('[data-cast-slug="' + slug + '"] [data-oshi="toggle"]').forEach(function (b) { b.setAttribute('aria-pressed', isOshi(slug) ? 'true' : 'false'); });
  }
  function toggleOshi(slug, btn) {
    var list = oshiList();
    var on = list.indexOf(slug) === -1;
    if (on) list.push(slug); else list.splice(list.indexOf(slug), 1);
    lsSet(LS_OSHI, list);
    syncHearts(slug);
    db.vote(slug, on ? 1 : -1);
    track('oshi_vote', { cast_slug: slug, oshi_action: on ? 'add' : 'remove' });
    if (on && !REDUCED && btn) { btn.classList.remove('is-bloom'); void btn.offsetWidth; btn.classList.add('is-bloom'); }
  }
  function initHearts() {
    castEls().forEach(function (el) {
      var c = castOf(el);
      all('[data-oshi="toggle"]', el).forEach(function (b) {
        if (b.__sbOshi) return; b.__sbOshi = true;
        if (!b.getAttribute('aria-label') && c.nameJp) b.setAttribute('aria-label', c.nameJp + 'を推しにする');
        b.setAttribute('aria-pressed', isOshi(c.slug) ? 'true' : 'false');
        b.addEventListener('click', function (e) { e.preventDefault(); toggleOshi(c.slug, b); });
      });
      all('[data-oshi="card"]', el).forEach(function (b) {
        if (b.__sbOshi) return; b.__sbOshi = true;
        if (!b.getAttribute('aria-label') && c.nameJp) b.setAttribute('aria-label', c.nameJp + 'の推しカードを作る');
        b.setAttribute('aria-haspopup', 'dialog');
        b.addEventListener('click', function (e) { e.preventDefault(); openSheet(c.slug, b); });
      });
    });
  }

  // ---------- 目を覚ます（トップの CAST だけ・1台につき 1回・動きを減らす設定の時はしない）----------
  function initAwakening() {
    var cards = all('.sb-cast-card.is-awake[data-cast-slug]');
    if (!cards.length || REDUCED || !('IntersectionObserver' in window) || !document.getElementById('sb-cast-veil')) return;
    var woken = lsGet(LS_WOKEN, []);
    if (!Array.isArray(woken)) woken = [];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting || en.intersectionRatio < 0.4) return;
        var card = en.target;
        io.unobserve(card);
        setTimeout(function () {
          card.classList.add('is-waking');
          setTimeout(function () {
            var v = card.querySelector('.sb-cast-veil--waking');
            if (v && v.parentNode) v.parentNode.removeChild(v);
            card.classList.remove('is-waking-pre', 'is-waking');
          }, 2800);
        }, 250);
        var w = lsGet(LS_WOKEN, []); if (!Array.isArray(w)) w = [];
        if (w.indexOf(card.getAttribute('data-cast-slug')) === -1) { w.push(card.getAttribute('data-cast-slug')); lsSet(LS_WOKEN, w); }
      });
    }, { threshold: [0.4] });
    cards.forEach(function (card) {
      var slug = card.getAttribute('data-cast-slug');
      if (woken.indexOf(slug) !== -1) return;
      var oval = card.querySelector('.sb-cast-oval');
      if (!oval) return;
      var NS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'sb-cast-veil sb-cast-veil--waking');
      svg.setAttribute('viewBox', '0 0 200 250');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      var use = document.createElementNS(NS, 'use');
      use.setAttribute('href', '#sb-cast-veil');
      svg.appendChild(use);
      oval.appendChild(svg);
      card.classList.add('is-waking-pre');
      io.observe(card);
    });
  }

  // ---------- 数（公開は 2027 の合計が 30 以上の時だけ／管理は #admin-chiako）----------
  function sum2027(data) {
    // このページにあるカード（data-cast-slug）の分だけを足す。ほかの名前の項目は数えない
    var t = 0, seen = {};
    castEls().forEach(function (el) {
      var k = PREFIX + el.getAttribute('data-cast-slug');
      if (seen[k]) return;
      seen[k] = true;
      var v = data && data[k];
      if (typeof v === 'number' && isFinite(v) && v > 0) t += Math.floor(v);
    });
    return t;
  }
  function showTotal(data) {
    var t = sum2027(data);
    all('[data-oshi-total]').forEach(function (el) {
      if (t >= PUBLIC_MIN) { var n = el.querySelector('.sb-oshi-num'); if (n) n.textContent = t.toLocaleString('ja-JP'); el.hidden = false; }
      else el.hidden = true;
    });
  }
  function isAdmin() { return location.hash.indexOf(ADMIN_HASH) !== -1; }
  function renderAdmin(data) {
    document.documentElement.classList.add('sb-oshi-admin');
    castEls().forEach(function (el) {
      var slug = el.getAttribute('data-cast-slug');
      all('[data-oshi="toggle"]', el).forEach(function (b) {
        var badge = b.parentNode.querySelector('.sb-oshi-count[data-for="' + slug + '"]');
        if (!badge) { badge = document.createElement('span'); badge.className = 'sb-oshi-count'; badge.setAttribute('data-for', slug); b.insertAdjacentElement('afterend', badge); }
        badge.textContent = String(data[PREFIX + slug] || 0);
      });
    });
    var box = document.getElementById('sb-oshi-ranking');
    if (!box) { box = document.createElement('aside'); box.id = 'sb-oshi-ranking'; box.setAttribute('aria-label', '推しの数（管理用）'); document.body.appendChild(box); }
    var rows = Object.keys(data).filter(function (k) { return k.indexOf(PREFIX) === 0; })
      .map(function (k) { var s = k.slice(PREFIX.length); var c = castBySlug(s); return { name: c ? c.nameJp + '（' + c.roleJp + '）' : s, v: data[k] || 0 }; })
      .sort(function (a, b) { return b.v - a.v; });
    box.innerHTML = '';
    var h = document.createElement('h2'); h.textContent = 'OSHI 2027 — 管理用'; box.appendChild(h);
    var ol = document.createElement('ol');
    rows.forEach(function (r) { var li = document.createElement('li'); li.textContent = r.name; var b = document.createElement('b'); b.textContent = r.v; li.appendChild(b); ol.appendChild(li); });
    box.appendChild(ol);
    var p = document.createElement('p'); p.textContent = '合計 ' + sum2027(data) + '（公開は ' + PUBLIC_MIN + ' 以上の時だけ）' + (MOCK ? '・テスト' : ''); box.appendChild(p);
  }
  function initCounts() {
    if (isAdmin()) { db.watch(function (d) { renderAdmin(d); showTotal(d); }); return; }
    if (!castEls().length || !document.querySelector('[data-oshi-total]')) return;
    db.readAll().then(showTotal);
  }
  window.addEventListener('hashchange', function () {
    if (isAdmin() && !document.documentElement.classList.contains('sb-oshi-admin')) db.watch(function (d) { renderAdmin(d); showTotal(d); });
    if (!isAdmin()) { document.documentElement.classList.remove('sb-oshi-admin'); var b = document.getElementById('sb-oshi-ranking'); if (b) b.parentNode.removeChild(b); }
  });

  // ---------- 推しカード（canvas で描く）----------
  var ORN = {"corner":{"stems":["M-6,26C30,10 60,36 98,24C130,14 150,38 186,30C218,23 238,8 266,16C282,21 284,36 272,38","M22,-6C8,30 34,52 20,88C10,116 30,136 18,166C12,182 20,196 30,198","M40,20C58,48 52,66 70,80","M144.6,27.4Q142.4,32 145.2,36.4","M251.5,13.7Q255.6,11.4 255.3,6.7","M17.9,115.2Q21.8,118.6 26.7,117","M68.9,79.2Q67.2,82.2 70.2,84","M95.7,24.7Q95.7,29 99.7,30.4"],"thorns":["M23.5,20.7Q25,19.1 23.6,15.5Q26.7,19.7 26.9,20.9Z","M72.2,27.2Q73.6,28.9 71.9,32.4Q75.3,28.4 75.6,27.3Z","M169.1,31.7Q170.5,30 168.9,26.5Q172.2,30.5 172.5,31.7Z","M229.6,16.8Q230.6,15 228.2,12.4Q232.4,15 232.9,15.9Z","M18.3,26.2Q16.9,27.8 13.2,26.7Q17.6,29.4 18.8,29.5Z","M21.7,139.5Q20.2,141.1 16.5,139.6Q20.8,142.7 21.9,142.9Z"],"blades":["M110.5,18.9C116.2,18.4 118.8,11.9 117,6.5C111.6,8.1 107.7,14 110.5,18.9Z","M144.7,36.3C143,32.4 137.6,32.1 134.2,34.6C136.7,38 141.8,39.4 144.7,36.3Z","M210.6,25.7C210,30.7 215.1,33.9 219.9,33.2C219.5,28.4 215.2,24.1 210.6,25.7Z","M26.8,60.1C27.3,65.3 33.4,67.8 38.3,66.1C36.8,61.1 31.4,57.5 26.8,60.1Z","M26.5,117.5C22.7,118 21.2,122.6 22.5,126.1C26.1,124.8 28.5,120.7 26.5,117.5Z","M13.5,181.6C9.3,180.1 5.3,184 4.9,188.4C9.3,189 14,186.1 13.5,181.6Z","M57.2,53.2C58.4,57.7 63.8,58.6 67.7,56.2C65.7,52.1 60.6,50 57.2,53.2Z","M99.3,30.6C95,27.6 89.1,30.6 87.1,35.4C91.9,37.6 98.2,35.8 99.3,30.6Z"],"ribs":["M109,21.8L115.7,9","M145.2,36.4L136.3,34.9","M208.1,23.7L218.1,31.7","M24,58.6L36,64.9","M26.7,117L23.3,124.4","M16.1,179.6L6.6,187","M54.1,52.3L65.6,55.6","M99.7,30.4L89.5,34.5"],"roseOut":["M152,41.2C155.7,42.6 154.3,49.3 150.3,49C150.1,53 143.3,53.7 142.3,49.9C138.5,50.9 135.7,44.7 139.1,42.6C136.9,39.2 142,34.7 145,37.2C147.5,34.1 153.4,37.5 152,41.2Z","M39.5,118.8C41.8,121.5 37.9,126.1 34.9,124.3C33,127.3 27.4,125.1 28.2,121.6C24.8,120.8 25.2,114.7 28.7,114.5C28.4,110.9 34.3,109.4 35.7,112.7C38.9,111.3 42.2,116.5 39.5,118.8Z","M111.2,32.3C116.1,32.4 117.3,40.7 112.6,42.1C114,46.8 106.5,50.5 103.7,46.4C99.7,49.3 93.8,43.2 96.8,39.3C92.9,36.4 96.8,29 101.5,30.6C103,26 111.3,27.4 111.2,32.3Z","M255.3,6.7C259.8,5.6 260.3,2.1 259.4,-1C256.4,-0.1 253.7,2.3 255.3,6.7Z","M70.2,84C67.8,87.6 69.7,90.3 72.3,91.8C73.8,89.2 74.1,85.9 70.2,84Z"],"roseIn":["M146.5,44.3L146.5,44.7 146.2,45 145.8,45.3 145.2,45.3 144.7,45.1 144.2,44.6 143.9,44 143.9,43.2 144.3,42.5 144.9,41.9 145.8,41.6 146.8,41.7 147.7,42.1 148.4,43 148.7,44.1 148.6,45.3 147.9,46.4 146.9,47.2 145.6,47.5 144.2,47.3 142.9,46.5 142,45.2 141.7,43.7 142,42.1 142.9,40.7 144.4,39.7 146.1,39.4 148,39.8 149.5,40.9 150.6,42.5 150.9,44.5 150.4,46.6 149.1,48.3 147.2,49.4","M33.7,119.1L33.4,119.3 33,119.3 32.6,119.2 32.2,118.8 32,118.3 32,117.7 32.3,117.2 32.8,116.7 33.5,116.5 34.3,116.6 35,116.9 35.5,117.6 35.8,118.5 35.6,119.5 35.1,120.4 34.2,121 33.1,121.2 32,121 31,120.4 30.3,119.3 30,118 30.3,116.7 31.1,115.5 32.4,114.7 33.9,114.5 35.4,114.9 36.7,115.9 37.5,117.3 37.7,119 37.3,120.7 36.1,122.1 34.5,123 32.6,123.2 30.7,122.6","M106.2,37.9L106.3,38.4 106.3,38.9 106,39.5 105.5,39.9 104.8,40.1 104,39.9 103.3,39.4 102.8,38.7 102.6,37.7 102.8,36.6 103.5,35.7 104.6,35.1 105.8,34.9 107.1,35.3 108.2,36.2 108.9,37.5 109,39.1 108.5,40.6 107.4,41.9 105.8,42.6 104,42.7 102.2,42 100.8,40.7 100,38.8 100,36.7 100.8,34.7 102.4,33.2 104.5,32.3 106.9,32.4 109.1,33.3 110.8,35.2 111.7,37.6 111.6,40.2 110.4,42.7","M255.3,6.7Q260.3,6.2 259.2,2.7M255.3,6.7Q252.9,2.2 256.4,1.3","M70.2,84Q67.1,87.5 70.1,89.1M70.2,84Q74.7,85.5 72.9,88.4"]},"bloom":{"stems":["M4,80C20,74 30,62 44,56C60,49 74,52 88,44C98,38 104,30 100,22","M62.4,51.1Q65.5,47.6 63.8,43.2","M100.5,23.2Q104,22.8 103.6,19.3"],"thorns":["M34.6,61.1Q36.5,61.5 36.6,64.8Q37.7,60.2 37.4,59.3Z"],"blades":["M22.7,66.2C26.8,63.3 25.9,57.4 22.2,54.2C18.8,57.7 18.4,63.7 22.7,66.2Z","M64.2,43.4C65.1,48.1 70.7,49.9 75.1,48.1C73.4,43.7 68.2,40.8 64.2,43.4Z","M84.3,48.8C83.9,53 88.2,55.6 92.3,54.8C91.8,50.7 88.2,47.3 84.3,48.8Z"],"ribs":["M22.9,69.3L22.3,56.6","M63.8,43.2L73,47.2","M81.7,46.9L90.7,53.6"],"roseOut":["M72.5,32.4C76.5,34.4 74.2,41.6 69.8,40.9C69.1,45.3 61.5,45.3 60.8,40.9C56.4,41.6 54.1,34.4 58.1,32.4C56,28.5 62.2,24 65.3,27.2C68.4,24 74.6,28.5 72.5,32.4Z","M103.6,19.3C107.6,19.1 108.6,16.1 108.2,13.4C105.6,13.8 102.9,15.4 103.6,19.3Z"],"roseIn":["M66.1,35.3L66,35.7 65.6,36 65.1,36.2 64.5,36.1 63.9,35.8 63.5,35.2 63.3,34.4 63.4,33.6 64,32.8 64.8,32.3 65.8,32.1 66.9,32.4 67.8,33.1 68.4,34.2 68.5,35.5 68.1,36.7 67.2,37.8 65.9,38.5 64.4,38.6 62.9,38.1 61.7,37 61,35.4 60.9,33.7 61.5,31.9 62.8,30.6 64.6,29.8 66.7,29.8 68.6,30.6 70.1,32.1 70.9,34.1 70.9,36.4 69.9,38.5 68.2,40.2 65.9,41","M103.6,19.3Q107.9,19.6 107.5,16.5M103.6,19.3Q102.3,15.2 105.4,14.9"]},"bud":["M12.2 1.8c2.9 2.3 3.7 5.9.6 9.9-.3.4-.6.7-.8.9-3-2.6-3.6-6.4.2-10.8z","M12 12.9c-2.5-.2-4.1-2-4.4-4.6-.1-.6-.4-1-.9-1.3 1.2-.1 2 .6 2.3 1.6.5 1.9 1.5 3.2 3 4.3z","M12 12.9c2.5-.2 4.1-2 4.4-4.6.1-.6.4-1 .9-1.3-1.2-.1-2 .6-2.3 1.6-.5 1.9-1.5 3.2-3 4.3z","M11.45 12.4h1.1v9.4h-1.1z","M12.5 17.2c1.4-1.8 3.7-2.4 5.8-1.6-1.5 1.6-3.7 2.2-5.8 1.6zM11.5 19.3c-1.4-1.4-3.4-1.8-5.1-1 1.4 1.2 3.4 1.6 5.1 1z"]};
  var SIZES = {
    post: { w: 1080, h: 1350, label: '1080x1350' },
    story: { w: 1080, h: 1920, label: '1080x1920' }
  };
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function fontsFor(c) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var jp = 'わたしの推し『』（）・' + TITLE + VENUE + DATE_JP + c.roleJp + c.nameJp + '0123456789.:';
    var lat = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZÉé.#' + c.roleEn + c.nameEn;
    var loads = [
      document.fonts.load('500 80px "Noto Serif JP"', jp),
      document.fonts.load('400 34px "Noto Serif JP"', jp),
      document.fonts.load('500 26px "Cinzel"', lat.toUpperCase()),
      document.fonts.load('italic 400 40px "Cormorant Garamond"', lat),
      document.fonts.load('400 26px "Cormorant Garamond"', 'balletshorts.confy.co.jp'),
      document.fonts.load('400 64px "Italianno"', 'mon étoile #shorts')
    ];
    return Promise.race([Promise.all(loads).catch(function () {}), new Promise(function (r) { setTimeout(r, 5000); })]);
  }
  function loadImg(src) {
    return new Promise(function (resolve) {
      if (!src || !sameOrigin(src)) { resolve(null); return; }   // ほかのサイトの写真は使わない（canvas が汚れて保存できなくなるため）
      var im = new Image();
      im.onload = function () { resolve(im); };
      im.onerror = function () { resolve(null); };
      im.src = src;
    });
  }
  function posOf(s) {
    var p = String(s || '50% 30%').trim().split(/\s+/);
    function v(x, d) { if (x === 'left' || x === 'top') return 0; if (x === 'right' || x === 'bottom') return 1; if (x === 'center') return 0.5; var n = parseFloat(x); return isNaN(n) ? d : n / 100; }
    return { x: v(p[0], 0.5), y: v(p.length > 1 ? p[1] : '50%', 0.5) };
  }
  // 1文字ずつ並べる（字間をそろえる）。runs = [{t, font, color, dy?, sp?}]。中央にそろえて描く
  function measureRuns(x, runs) {
    var w = 0;
    runs.forEach(function (r, i) {
      x.font = r.font;
      var chars = Array.from(r.t);
      r._w = chars.map(function (ch) { return x.measureText(ch).width; });
      r._sp = r.sp || 0;
      r._total = r._w.reduce(function (a, b) { return a + b; }, 0) + r._sp * Math.max(0, chars.length - 1) + (r.gap || 0);
      w += r._total;
    });
    return w;
  }
  function drawRuns(x, runs, cx, y, maxW) {
    var w = measureRuns(x, runs);
    if (maxW && w > maxW) {
      var k = maxW / w;
      runs.forEach(function (r) { r.font = r.font.replace(/(\d+(?:\.\d+)?)px/, function (m, n) { return (parseFloat(n) * k).toFixed(1) + 'px'; }); if (r.sp) r.sp *= k; if (r.gap) r.gap *= k; });
      w = measureRuns(x, runs);
    }
    var px = cx - w / 2;
    runs.forEach(function (r) {
      x.font = r.font; x.fillStyle = r.color; x.textBaseline = 'alphabetic'; x.textAlign = 'left';
      var chars = Array.from(r.t);
      chars.forEach(function (ch, i) { x.fillText(ch, px, y + (r.dy || 0)); px += r._w[i] + (i < chars.length - 1 ? r._sp : 0); });
      px += (r.gap || 0);
    });
  }
  function drawOrn(x, set, opt) {
    x.save();
    x.translate(opt.x, opt.y);
    if (opt.rot) x.rotate(opt.rot);
    x.scale(opt.sx || opt.s, opt.sy || opt.s);
    var lw = 1 / (opt.s || 1);
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = opt.line; x.lineWidth = 1.6 * lw;
    set.stems.forEach(function (d) { x.stroke(new Path2D(d)); });
    x.fillStyle = opt.line;
    set.thorns.forEach(function (d) { x.fill(new Path2D(d)); });
    set.blades.forEach(function (d) { var p = new Path2D(d); x.globalAlpha = 0.18; x.fill(p); x.globalAlpha = 1; x.lineWidth = 1.2 * lw; x.stroke(p); });
    x.lineWidth = 0.9 * lw;
    set.ribs.forEach(function (d) { x.stroke(new Path2D(d)); });
    x.strokeStyle = opt.rose; x.fillStyle = opt.roseFill; x.lineWidth = 1.3 * lw;
    set.roseOut.forEach(function (d) { var p = new Path2D(d); x.fill(p); x.stroke(p); });
    x.lineWidth = 1.1 * lw;
    set.roseIn.forEach(function (d) { x.stroke(new Path2D(d)); });
    x.restore();
  }
  function drawBud(x, cx, cy, size, color) {
    x.save(); x.translate(cx - size / 2, cy - size / 2); x.scale(size / 24, size / 24); x.fillStyle = color;
    ORN.bud.forEach(function (d) { x.fill(new Path2D(d)); });
    x.restore();
  }
  function archPath(x, x0, y0, x1, y1, ah, br) {
    var cx = (x0 + x1) / 2, rx = (x1 - x0) / 2;
    x.beginPath();
    x.moveTo(x0, y1 - br);
    x.lineTo(x0, y0 + ah);
    x.ellipse(cx, y0 + ah, rx, ah, 0, Math.PI, 2 * Math.PI);
    x.lineTo(x1, y1 - br);
    x.quadraticCurveTo(x1, y1, x1 - br, y1);
    x.lineTo(x0 + br, y1);
    x.quadraticCurveTo(x0, y1, x0, y1 - br);
    x.closePath();
  }
  function drawCard(c, sizeKey, img) {
    var S = SIZES[sizeKey] || SIZES.post;
    var W = S.w, H = S.h, story = sizeKey === 'story';
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var x = cv.getContext('2d');
    // 縦の位置（投稿用とストーリーズ用で、空気の量を変える。ストーリーズは上下の 250px に大事な物を置かない）
    var L = story ? {
      frame: [60, 132, W - 60, H - 112], arch: 196, kicker: 316, lead: 382,
      oval: { cy: 748, rx: 254, ry: 318 }, roleEn: 1146, roleJp: 1196, name: 1296, nameEn: 1350,
      divider: 1402, title: 1462, date: 1512, tag: 1572, url: 1616
    } : {
      frame: [46, 46, W - 46, H - 46], arch: 156, kicker: 146, lead: 206,
      oval: { cy: 504, rx: 205, ry: 256 }, roleEn: 826, roleJp: 872, name: 958, nameEn: 1006,
      divider: 1048, title: 1102, date: 1148, tag: 1202, url: 1240
    };
    var CX = W / 2;
    // 1) 夜空（真夜中の藍 → 下に夜明けのバラとリラの光）
    var g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#191731'); g.addColorStop(0.42, '#221F4C'); g.addColorStop(0.78, '#302A5B'); g.addColorStop(1, '#41366A');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    var dawn = x.createRadialGradient(CX, H * 1.06, 10, CX, H * 1.06, H * 0.66);
    dawn.addColorStop(0, 'rgba(212,154,176,0.36)'); dawn.addColorStop(0.42, 'rgba(169,145,207,0.16)'); dawn.addColorStop(1, 'rgba(169,145,207,0)');
    x.fillStyle = dawn; x.fillRect(0, 0, W, H);
    var moon = x.createRadialGradient(W * 0.8, H * 0.1, 0, W * 0.8, H * 0.1, W * 0.55);
    moon.addColorStop(0, 'rgba(235,221,184,0.14)'); moon.addColorStop(1, 'rgba(235,221,184,0)');
    x.fillStyle = moon; x.fillRect(0, 0, W, H);
    var glow = x.createRadialGradient(CX, L.oval.cy, L.oval.rx * 0.6, CX, L.oval.cy, L.oval.rx * 1.9);
    glow.addColorStop(0, 'rgba(217,204,235,0.20)'); glow.addColorStop(1, 'rgba(217,204,235,0)');
    x.fillStyle = glow; x.fillRect(0, 0, W, H);
    // 2) 星（小さく・少なく・毎回同じ並び）
    var r = rng(story ? 1920 : 1350);
    for (var i = 0; i < (story ? 90 : 70); i++) {
      var sx = 20 + r() * (W - 40), sy = 20 + r() * (H * 0.8);
      var dx = (sx - CX) / (L.oval.rx + 40), dy = (sy - L.oval.cy) / (L.oval.ry + 40);
      if (dx * dx + dy * dy < 1) continue;
      if (Math.abs(sx - CX) < 330 && sy > L.roleEn - 60 && sy < L.url + 20) continue;   // 文字の後ろには置かない
      x.globalAlpha = 0.25 + r() * 0.5;
      x.fillStyle = '#FFFFFF';
      x.beginPath(); x.arc(sx, sy, 0.9 + r() * 1.6, 0, Math.PI * 2); x.fill();
    }
    x.globalAlpha = 1;
    // 3) 枠: 城の窓のアーチ。月の金と、内側にリラの細い線（招待状と同じ）
    var f = L.frame;
    archPath(x, f[0], f[1], f[2], f[3], L.arch, 18);
    x.strokeStyle = 'rgba(214,193,142,0.78)'; x.lineWidth = 2.2; x.stroke();
    archPath(x, f[0] + 14, f[1] + 14, f[2] - 14, f[3] - 14, L.arch - 10, 12);
    x.strokeStyle = 'rgba(169,145,207,0.55)'; x.lineWidth = 1.3; x.stroke();
    // 4) いばら（下の2つの角だけ。文字には重ねない）
    var bs = story ? 1.08 : 0.96;
    drawOrn(x, ORN.corner, { x: f[0] + 6, y: f[3] - 6, s: bs, sx: bs, sy: -bs, line: 'rgba(214,193,142,0.62)', rose: 'rgba(230,175,196,0.85)', roseFill: 'rgba(230,175,196,0.16)' });
    drawOrn(x, ORN.corner, { x: f[2] - 6, y: f[3] - 6, s: bs, sx: -bs, sy: -bs, line: 'rgba(214,193,142,0.62)', rose: 'rgba(230,175,196,0.85)', roseFill: 'rgba(230,175,196,0.16)' });
    // 5) 写真（楕円・object-position と同じ考え方で中心を合わせる）
    var o = L.oval, bx = CX - o.rx, by = o.cy - o.ry, bw = o.rx * 2, bh = o.ry * 2;
    x.save();
    x.beginPath(); x.ellipse(CX, o.cy, o.rx, o.ry, 0, 0, Math.PI * 2); x.closePath();
    x.shadowColor = 'rgba(8,6,28,0.55)'; x.shadowBlur = 50; x.shadowOffsetY = 18;
    x.fillStyle = '#2A2756'; x.fill();
    x.restore();
    x.save();
    x.beginPath(); x.ellipse(CX, o.cy, o.rx, o.ry, 0, 0, Math.PI * 2); x.closePath(); x.clip();
    if (img) {
      var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      var sc = Math.max(bw / iw, bh / ih), dw = iw * sc, dh = ih * sc, p = posOf(c.pos);
      x.drawImage(img, bx + (bw - dw) * p.x, by + (bh - dh) * p.y, dw, dh);
    } else {
      var mist = x.createRadialGradient(CX, o.cy - o.ry * 0.3, 10, CX, o.cy, o.ry * 1.1);
      mist.addColorStop(0, '#FFFFFF'); mist.addColorStop(0.4, '#F1EAF4'); mist.addColorStop(1, '#D9CCEB');
      x.fillStyle = mist; x.fillRect(bx, by, bw, bh);
    }
    x.restore();
    x.beginPath(); x.ellipse(CX, o.cy, o.rx, o.ry, 0, 0, Math.PI * 2);
    x.strokeStyle = 'rgba(214,193,142,0.9)'; x.lineWidth = 2.4; x.stroke();
    x.beginPath(); x.ellipse(CX, o.cy, o.rx + 16, o.ry + 16, 0, 0, Math.PI * 2);
    x.strokeStyle = 'rgba(214,193,142,0.38)'; x.lineWidth = 1.2; x.stroke();
    // 縁に咲いたバラ（目を覚ました印）
    drawOrn(x, ORN.bloom, { x: CX - o.rx - 52, y: o.cy + o.ry * 0.5, s: story ? 1.9 : 1.7, line: 'rgba(214,193,142,0.85)', rose: 'rgba(240,190,210,0.95)', roseFill: 'rgba(230,175,196,0.30)' });
    // 6) 文字（白い文字に、やわらかい影を重ねる）
    x.shadowColor = 'rgba(12,10,32,0.55)'; x.shadowBlur = 16; x.shadowOffsetY = 2;
    drawRuns(x, [{ t: 'mon étoile', font: '400 ' + (story ? 76 : 66) + 'px "Italianno"', color: '#E3CF9D' }], CX, L.kicker);
    drawRuns(x, [{ t: 'わたしの推し', font: '400 ' + (story ? 44 : 38) + 'px "Noto Serif JP"', color: '#F4EFF7', sp: story ? 12 : 10 }], CX, L.lead);
    drawRuns(x, [{ t: (c.roleEn || '').toUpperCase(), font: '500 ' + (story ? 26 : 23) + 'px "Cinzel"', color: '#D6C18E', sp: story ? 8 : 7 }], CX, L.roleEn, W - 220);
    drawRuns(x, [{ t: c.roleJp, font: '400 ' + (story ? 36 : 32) + 'px "Noto Serif JP"', color: '#E1D8F0', sp: 4 }], CX, L.roleJp, W - 220);
    x.shadowBlur = 24;
    drawRuns(x, [{ t: c.nameJp, font: '500 ' + (story ? 92 : 80) + 'px "Noto Serif JP"', color: '#FBF8FB', sp: story ? 8 : 6 }], CX, L.name, W - 200);
    x.shadowBlur = 14;
    drawRuns(x, [{ t: c.nameEn, font: 'italic 400 ' + (story ? 44 : 38) + 'px "Cormorant Garamond"', color: '#E3CF9D', sp: 1.5 }], CX, L.nameEn, W - 220);
    x.shadowBlur = 0; x.shadowOffsetY = 0;
    // 区切り（細い金の線のあいだにバラのつぼみ）
    x.strokeStyle = 'rgba(214,193,142,0.7)'; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(CX - 150, L.divider); x.lineTo(CX - 30, L.divider); x.moveTo(CX + 30, L.divider); x.lineTo(CX + 150, L.divider); x.stroke();
    drawBud(x, CX, L.divider - 2, story ? 40 : 36, 'rgba(214,193,142,0.95)');
    x.shadowColor = 'rgba(12,10,32,0.5)'; x.shadowBlur = 12; x.shadowOffsetY = 2;
    drawRuns(x, [
      { t: '『' + TITLE, font: '400 ' + (story ? 40 : 34) + 'px "Noto Serif JP"', color: '#F4EFF7', sp: 3, gap: story ? 14 : 12 },
      { t: '#shorts', font: '400 ' + (story ? 58 : 50) + 'px "Italianno"', color: '#E6AFC4', gap: 6 },
      { t: '』', font: '400 ' + (story ? 40 : 34) + 'px "Noto Serif JP"', color: '#F4EFF7' }
    ], CX, L.title, W - 220);
    // 日付の行: 数字だけ斜体（日本語は斜体にしない）・「18:30開演」・会場
    var dRuns = dateRuns(DATE_JP, story ? 31 : 28, '#F4EFF7');
    dRuns[dRuns.length - 1].gap = story ? 26 : 22;
    dRuns.push({ t: VENUE, font: '400 ' + (story ? 29 : 26) + 'px "Noto Serif JP"', color: '#E1D8F0', sp: 2 });
    drawRuns(x, dRuns, CX, L.date, W - 200);
    drawRuns(x, [{ t: HASHTAG, font: '400 ' + (story ? 28 : 25) + 'px "Noto Serif JP"', color: '#E6AFC4', sp: 1 }], CX, L.tag, W - 260);
    drawRuns(x, [{ t: 'balletshorts.confy.co.jp', font: '500 ' + (story ? 28 : 25) + 'px "Cormorant Garamond"', color: '#D3C9E6', sp: 2.5 }], CX, L.url, W - 260);
    x.shadowBlur = 0;
    return cv;
  }
  // 「2027年8月4日(水) 18:30開演」を、数字（斜体）と日本語（立てたまま）の区切りに分ける
  function dateRuns(text, px, color) {
    var out = [];
    String(text).split(/(\d+(?::\d+)?)/).forEach(function (part) {
      if (!part) return;
      var num = /^\d/.test(part);
      out.push({ t: part, font: (num ? 'italic ' : '') + '400 ' + px + 'px "Noto Serif JP"', color: color, sp: num ? 1 : 1.5, gap: num ? 3 : 0 });
    });
    return out;
  }
  function makeCard(c, sizeKey) {
    return Promise.all([fontsFor(c), loadImg(c.photo)]).then(function (res) {
      var cv = drawCard(c, sizeKey, res[1]);
      return new Promise(function (resolve, reject) {
        if (cv.toBlob) cv.toBlob(function (b) { b ? resolve({ blob: b, canvas: cv }) : reject(new Error('toBlob')); }, 'image/png');
        else reject(new Error('toBlob unsupported'));
      });
    });
  }

  // ---------- 推しカードの画面と共有 ----------
  var ICON = {
    close: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z"/></svg>',
    line: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 3.2c-5.2 0-9.4 3.4-9.4 7.6 0 3.8 3.3 6.9 7.8 7.5.3.1.7.2.8.5.1.3.1.6 0 .9l-.1.8c0 .2-.2.9.8.5s5.4-3.2 7.3-5.4c1.4-1.5 2-3 2-4.8 0-4.2-4.2-7.6-9.2-7.6zM8.3 13.2H6.5c-.3 0-.5-.2-.5-.5V9.1c0-.3.2-.5.5-.5s.5.2.5.5v3.1h1.3c.3 0 .5.2.5.5s-.2.5-.5.5zm1.9-.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V9.1c0-.3.2-.5.5-.5s.5.2.5.5v3.6zm4.3 0c0 .2-.1.4-.3.5h-.2c-.2 0-.3-.1-.4-.2l-1.9-2.5v2.2c0 .3-.2.5-.5.5s-.5-.2-.5-.5V9.1c0-.2.1-.4.3-.5h.2c.2 0 .3.1.4.2l1.9 2.6V9.1c0-.3.2-.5.5-.5s.5.2.5.5v3.6zm2.9-2.3c.3 0 .5.2.5.5s-.2.5-.5.5h-1.3v.8h1.3c.3 0 .5.2.5.5s-.2.5-.5.5h-1.8c-.3 0-.5-.2-.5-.5V9.1c0-.3.2-.5.5-.5h1.8c.3 0 .5.2.5.5s-.2.5-.5.5h-1.3v.8h1.3z"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    save: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 15V4m0 0L8 8m4-4l4 4M6 11.5v7a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  var sheet = null, state = { slug: null, size: 'post', blob: null, url: null, opener: null, seq: 0 };
  function shareUrl(c, src) {
    var u = new URL(c.page || '/', SITE + '/');
    u.searchParams.set('utm_source', src); u.searchParams.set('utm_medium', 'social'); u.searchParams.set('utm_campaign', 'oshi_card_2027');
    return u.toString();
  }
  function shareText(c, noTag) {
    return 'わたしの推しは、' + c.roleJp + 'の' + c.nameJp + 'さん。\n『' + TITLE + ' #shorts』' + DATE_JP + '　' + VENUE + (noTag ? '' : '\n' + HASHTAG);
  }
  function canShareFiles(file) {
    try { return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [file] })); } catch (e) { return false; }
  }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  }
  function buildSheet() {
    var native = typeof window.HTMLDialogElement === 'function';
    var d = el('dialog', { 'class': 'sb-oshi-sheet' + (native ? '' : ' sb-oshi-sheet--fallback'), 'aria-labelledby': 'sb-oshi-title', 'aria-describedby': 'sb-oshi-who' });
    if (!native) { d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); }
    d.innerHTML =
      '<div class="sb-oshi-inner">' +
        '<button type="button" class="sb-oshi-close" data-act="close" aria-label="閉じる">' + ICON.close + '</button>' +
        '<p class="sb-oshi-kicker" aria-hidden="true">mon étoile</p>' +
        '<h2 class="sb-oshi-title" id="sb-oshi-title">推しカード</h2>' +
        '<p class="sb-oshi-who" id="sb-oshi-who"></p>' +
        '<div class="sb-oshi-sizes" role="radiogroup" aria-label="カードの形">' +
          '<button type="button" class="sb-oshi-size" role="radio" data-size="post" aria-checked="true">投稿用<small>4:5</small></button>' +
          '<button type="button" class="sb-oshi-size" role="radio" data-size="story" aria-checked="false">ストーリーズ用<small>9:16</small></button>' +
        '</div>' +
        '<div class="sb-oshi-preview" data-busy="true"><img alt="" /></div>' +
        '<p class="sb-oshi-status" role="status" aria-live="polite"></p>' +
        '<div class="sb-oshi-actions"></div>' +
        '<p class="sb-oshi-tags">' + HASHTAG + '</p>' +
        '<p class="sb-oshi-note">カードは、この端末の中で作っています。写真や名前を、どこかへ送ることはありません。</p>' +
      '</div>';
    document.body.appendChild(d);
    d.addEventListener('click', function (e) {
      if (e.target === d) { closeSheet(); return; }
      var t = e.target.closest ? e.target.closest('[data-act],[data-size]') : null;
      if (!t) return;
      if (t.hasAttribute('data-size')) { if (t.getAttribute('aria-checked') !== 'true') setSize(t.getAttribute('data-size')); return; }
      var act = t.getAttribute('data-act');
      if (act === 'close') closeSheet();
      if (act === 'share') doShare();
      if (act === 'save') doSave();
      if (act === 'copy') doCopy();
      if (act === 'x' || act === 'line') track('oshi_card_share', { cast_slug: state.slug, method: act, card_size: SIZES[state.size].label });
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !native) { e.preventDefault(); closeSheet(); }
      if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && e.target.classList && e.target.classList.contains('sb-oshi-size')) {
        e.preventDefault(); setSize(state.size === 'post' ? 'story' : 'post'); var b = d.querySelector('.sb-oshi-size[aria-checked="true"]'); if (b) b.focus();
      }
    });
    d.addEventListener('close', function () { afterClose(); });
    return d;
  }
  function setStatus(t) { var s = sheet.querySelector('.sb-oshi-status'); if (s) s.textContent = t; }
  function renderActions(c) {
    // 画像は「共有する／保存する」、リンクは小さな丸3つ（X・LINE・コピー）。診断・招待状と同じ言葉と形
    var box = sheet.querySelector('.sb-oshi-actions');
    var file = state.blob ? new File([state.blob], fileName(c), { type: 'image/png' }) : null;
    var share = file && canShareFiles(file);
    var dis = state.blob ? '' : ' disabled aria-disabled="true"';
    var xHref = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText(c, true)) + '&url=' + encodeURIComponent(shareUrl(c, 'x')) + '&hashtags=' + encodeURIComponent(HASHTAG.replace(/^#/, ''));
    var lineHref = 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(shareUrl(c, 'line'));
    var links =
      '<div class="sb-oshi-links">' +
        '<span class="sb-oshi-links-label">リンクを送る</span>' +
        '<a class="sb-oshi-ico" data-act="x" href="' + xHref + '" target="_blank" rel="noopener" aria-label="X でポストする">' + ICON.x + '</a>' +
        '<a class="sb-oshi-ico" data-act="line" href="' + lineHref + '" target="_blank" rel="noopener" aria-label="LINE で送る">' + ICON.line + '</a>' +
        '<button type="button" class="sb-oshi-ico" data-act="copy" aria-label="リンクをコピーする">' + ICON.link + '</button>' +
      '</div>';
    box.innerHTML = share
      ? '<div class="sb-oshi-main">' +
          '<button type="button" class="sb-oshi-primary" data-act="share"' + dis + '>' + ICON.share + '画像を共有する</button>' +
          '<button type="button" class="sb-oshi-secondary" data-act="save"' + dis + '>' + ICON.save + '画像を保存する</button>' +
        '</div>' + links
      : '<div class="sb-oshi-main">' +
          '<button type="button" class="sb-oshi-primary" data-act="save"' + dis + '>' + ICON.save + '画像を保存する</button>' +
        '</div>' + links;
  }
  function fileName(c) { return 'oshi-card-' + c.slug + '-' + SIZES[state.size].label + '.png'; }
  function setSize(size) {
    state.size = SIZES[size] ? size : 'post';
    all('.sb-oshi-size', sheet).forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-size') === state.size ? 'true' : 'false'); b.tabIndex = b.getAttribute('data-size') === state.size ? 0 : -1; });
    generate();
  }
  function generate() {
    var c = castBySlug(state.slug);
    if (!c) return;
    var my = ++state.seq;
    state.blob = null;
    var pv = sheet.querySelector('.sb-oshi-preview');
    pv.setAttribute('data-busy', 'true');
    setStatus('カードを作っています…');
    renderActions(c);
    makeCard(c, state.size).then(function (res) {
      if (my !== state.seq) return;
      state.blob = res.blob;
      if (state.url) URL.revokeObjectURL(state.url);
      state.url = URL.createObjectURL(res.blob);
      var im = pv.querySelector('img');
      im.src = state.url;
      im.alt = '推しカードの見本: ' + c.roleJp + 'の' + c.nameJp + '（' + (state.size === 'story' ? 'ストーリーズ用' : '投稿用') + '）';
      pv.setAttribute('data-busy', 'false');
      setStatus('');
      renderActions(c);
      track('oshi_card_create', { cast_slug: c.slug, card_size: SIZES[state.size].label });
    }).catch(function (e) {
      if (my !== state.seq) return;
      console.warn('[oshi] カードを作れませんでした', e && e.message);
      setStatus('カードを作れませんでした。時間をおいて、もう一度お試しください。');
      pv.setAttribute('data-busy', 'false');
    });
  }
  function doShare() {
    var c = castBySlug(state.slug);
    if (!c || !state.blob) return;
    var file = new File([state.blob], fileName(c), { type: 'image/png' });
    var data = { files: [file], title: TITLE + ' #shorts', text: shareText(c) + '\n' + shareUrl(c, 'share') };
    navigator.share(data).then(function () {
      track('oshi_card_share', { cast_slug: c.slug, method: 'web_share', card_size: SIZES[state.size].label });
    }).catch(function (e) {
      if (e && e.name === 'AbortError') return;   // 自分で閉じた時は何もしない
      setStatus('この端末では共有できませんでした。画像を保存して、お使いのアプリから投稿してください。');
    });
  }
  function doSave() {
    var c = castBySlug(state.slug);
    if (!c || !state.blob) return;
    var a = document.createElement('a');
    a.href = state.url; a.download = fileName(c);
    document.body.appendChild(a); a.click(); a.parentNode.removeChild(a);
    setStatus('画像を保存しました。見つからない時は「ダウンロード」の中をご覧ください。');
    track('oshi_card_share', { cast_slug: c.slug, method: 'download', card_size: SIZES[state.size].label });
  }
  function doCopy() {
    var c = castBySlug(state.slug);
    if (!c) return;
    var url = shareUrl(c, 'copy');
    var done = function () { setStatus('リンクをコピーしました。'); track('oshi_card_share', { cast_slug: c.slug, method: 'copy', card_size: SIZES[state.size].label }); };
    var fallback = function () {
      var t = document.createElement('textarea'); t.value = url; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); done(); } catch (e) { setStatus(url); }
      t.parentNode.removeChild(t);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, fallback); else fallback();
  }
  var prevOverflow = '';
  function openSheet(slug, opener) {
    var c = castBySlug(slug);
    if (!c) return;
    if (!sheet) sheet = buildSheet();
    state.slug = slug; state.opener = opener || null;
    sheet.querySelector('.sb-oshi-who').textContent = c.roleJp + '　' + c.nameJp;
    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    if (typeof sheet.showModal === 'function') { if (!sheet.open) sheet.showModal(); } else { sheet.setAttribute('open', ''); }
    setSize('post');
    var first = sheet.querySelector('.sb-oshi-size[aria-checked="true"]');
    if (first) first.focus();
  }
  function closeSheet() {
    if (!sheet) return;
    if (typeof sheet.close === 'function' && sheet.open) sheet.close(); else { sheet.removeAttribute('open'); afterClose(); }
  }
  function afterClose() {
    document.documentElement.style.overflow = prevOverflow;
    state.seq++;
    if (state.opener && state.opener.focus) state.opener.focus();
  }

  // ---------- 起動 ----------
  function start() {
    initHearts();
    initAwakening();
    initCounts();
    // 推しがいる時だけ見せる一言（[data-oshi-hint]）
    if (castEls().length) all('[data-oshi-hint]').forEach(function (e) { e.hidden = false; });
    if (MOCK) window.__sbOshiTest = { db: db, castOf: castOf, castBySlug: castBySlug, drawCard: drawCard, makeCard: makeCard, openSheet: openSheet, fontsFor: fontsFor, loadImg: loadImg };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
