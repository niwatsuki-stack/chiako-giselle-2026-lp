/*!
 * sb-share.js — 『眠れる森の美女 #shorts』公演サイトの「画像をつくって共有する」道具
 * ほかのファイルに頼らない（ライブラリなし）。window.SBShare に、次の小さな道具を置く。
 *
 *  フォントと画像
 *   SBShare.fonts(specs, {timeout})   … canvas に描く前にフォントを待つ。specs = [{ font: '300 80px "Noto Serif JP"', text: '描く文字' }]
 *                                        日本語のフォントは文字ごとに分かれて届くので、text には実際に描く文字を渡す。
 *                                        間に合わなければ timeout（既定 6000ms）で先へ進む（端末の字で描く）。戻り値 true=全部そろった
 *   SBShare.loadImage(src)            … 同じサイトの画像だけを読む（よそのサイトの画像を描くと canvas が書き出せなくなるため断る）
 *
 *  canvas → 画像
 *   SBShare.canvas(w, h)              … 描く台（canvas 要素）
 *   SBShare.toBlob(canvas, type, q)   … PNG（既定）の Blob にする
 *   SBShare.file(blob, name)          … 共有に渡す File にする
 *
 *  共有
 *   SBShare.canShareFiles(files?)     … この端末で「画像ファイルの共有」ができるか（navigator.canShare({files})）
 *   SBShare.share({files, title, text, url}) … 共有の画面を開く。押した操作の中で（待たずに）呼ぶこと。
 *                                        戻り値 { ok, reason: 'cancelled' | 'unsupported' | 'blocked' | 'error' }
 *   SBShare.download(blob, name)      … 端末に保存（共有できない端末の代わり）
 *   SBShare.xUrl({text, url, hashtags}) … X（旧Twitter）の投稿画面のURL
 *   SBShare.lineUrl(url)              … LINE で送る画面のURL
 *   SBShare.copy(text)                … 文字をコピー（戻り値 true/false）
 *   SBShare.track(name, params)       … GA4 のイベント。名前・メールなど個人の情報は絶対に入れない
 *   SBShare.bindActions(root, opts)   … 共有ボタンの組（data-sbs="native|download|x|line|copy"）をまとめて動かす（下に説明）
 *                                        ボタンの見た目は自由（文字のボタンでも、アイコンだけの丸いボタンでもよい）
 *
 *  描く道具（このサイトの飾りを canvas に）
 *   SBShare.text.wrap / measure / drawRuns / spaced … 文節（| の印）で折る・数字だけ斜体で描く・字間をあける
 *   SBShare.draw.night / stars / briar / seal / bud / ellipse / arch … 夜の地・星・いばら・バラの封蝋・つぼみの区切り・楕円・アーチ
 */
(function () {
  'use strict';

  var SITE = 'https://balletshorts.confy.co.jp';

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- フォント ---------- */
  function stylesheetsLoaded(timeout) {
    var links = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]'));
    var waits = links.filter(function (l) { return !l.sheet; }).map(function (l) {
      return new Promise(function (r) { l.addEventListener('load', r, { once: true }); l.addEventListener('error', r, { once: true }); });
    });
    return Promise.race([Promise.all(waits), sleep(timeout || 3000)]);
  }

  function fonts(specs, opts) {
    opts = opts || {};
    if (!document.fonts || !document.fonts.load) return Promise.resolve(false);
    var work = stylesheetsLoaded(3000).then(function () {
      return Promise.all(specs.map(function (s) {
        return document.fonts.load(s.font, s.text || 'あA1').catch(function () { return []; });
      }));
    }).then(function () {
      return specs.every(function (s) {
        try { return document.fonts.check(s.font, s.text || 'あA1'); } catch (e) { return false; }
      });
    });
    return Promise.race([work, sleep(opts.timeout || 6000).then(function () { return false; })]);
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var u;
      try { u = new URL(src, location.href); } catch (e) { reject(e); return; }
      if (u.origin !== location.origin && u.protocol !== 'data:' && u.protocol !== 'blob:') {
        reject(new Error('同じサイトの画像だけを読みます: ' + src));
        return;
      }
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('画像を読めませんでした: ' + src)); };
      img.src = u.href;
    });
  }

  /* ---------- canvas → 画像 ---------- */
  function canvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function toBlob(cv, type, quality) {
    type = type || 'image/png';
    return new Promise(function (resolve, reject) {
      if (cv.toBlob) {
        cv.toBlob(function (b) { b ? resolve(b) : reject(new Error('画像にできませんでした')); }, type, quality);
      } else {
        try {
          var data = cv.toDataURL(type, quality).split(',');
          var bin = atob(data[1]), arr = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          resolve(new Blob([arr], { type: type }));
        } catch (e) { reject(e); }
      }
    });
  }

  function file(blob, name) {
    try { return new File([blob], name, { type: blob.type || 'image/png', lastModified: Date.now() }); }
    catch (e) { blob.name = name; return blob; }
  }

  /* ---------- 共有 ---------- */
  var probe;
  function canShareFiles(files) {
    if (!navigator.share || !navigator.canShare) return false;
    try {
      if (!files) {
        probe = probe || [file(new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }), 'probe.png')];
        files = probe;
      }
      return !!navigator.canShare({ files: files });
    } catch (e) { return false; }
  }

  function share(data) {
    var payload = {};
    if (data.title) payload.title = data.title;
    if (data.text) payload.text = data.text;
    if (data.url) payload.url = data.url;
    if (data.files && data.files.length) payload.files = data.files;
    if (!navigator.share) return Promise.resolve({ ok: false, reason: 'unsupported' });
    if (payload.files && !canShareFiles(payload.files)) return Promise.resolve({ ok: false, reason: 'unsupported' });
    var p;
    try { p = navigator.share(payload); } catch (e) { return Promise.resolve({ ok: false, reason: 'error', error: e }); }
    return Promise.resolve(p).then(function () { return { ok: true }; }, function (e) {
      var n = e && e.name;
      if (n === 'AbortError') return { ok: false, reason: 'cancelled' };
      if (n === 'NotAllowedError') return { ok: false, reason: 'blocked', error: e };
      return { ok: false, reason: 'error', error: e };
    });
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 60000);
  }

  function xUrl(o) {
    var q = [];
    if (o.text) q.push('text=' + encodeURIComponent(o.text));
    if (o.url) q.push('url=' + encodeURIComponent(o.url));
    if (o.hashtags && o.hashtags.length) q.push('hashtags=' + encodeURIComponent(o.hashtags.join(',')));
    return 'https://twitter.com/intent/tweet?' + q.join('&');
  }

  function lineUrl(url) {
    return 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(url);
  }

  function copy(text) {
    function legacy() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.top = '-1000px'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select(); ta.setSelectionRange(0, text.length);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacy(); });
    }
    return Promise.resolve(legacy());
  }

  // GA4。値は「どの結果か・どの方法か」のような決まった言葉だけ。名前などは渡さない
  function track(name, params) {
    try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) { /* 計測が止まっても画面は止めない */ }
  }

  /*
   * 共有ボタンの組をまとめて動かす。
   *   root の中の [data-sbs="native"]（画像を共有）[data-sbs="download"]（画像を保存）
   *   <a data-sbs="x">（Xで投稿）<a data-sbs="line">（LINEで送る）[data-sbs="copy"]（リンクをコピー）
   *   opts.get()      … いまの { blob, filename, title, text, url, xText, hashtags } を返す（blob はまだ無くてもよい）
   *   opts.prepare()  … blob をつくる Promise（無い時に呼ぶ）
   *   opts.onDone(method) … 共有・保存・コピーが済んだ時（GA4 など）。method = native | download | x | line | copy
   *   opts.status     … 結果を知らせる文の置き場（aria-live のある要素）
   *   opts.ready(method) … そのボタンをいま押せるか（false なら押しても何もしない。名前が空の時の画像など）
   * 画像の共有ができる端末では root に class "sbs-can-native"、できない端末では "sbs-no-native" が付く（見た目の出し分けは CSS で）。
   * 戻り値 { refresh() } … 中身が変わったら呼ぶ（X・LINE のリンク先を作り直す）
   */
  function bindActions(root, opts) {
    var native = canShareFiles();
    root.classList.add(native ? 'sbs-can-native' : 'sbs-no-native');
    function say(msg) { if (opts.status) { opts.status.textContent = ''; setTimeout(function () { opts.status.textContent = msg; }, 30); } }
    function ok(m) { return !opts.ready || opts.ready(m); }
    function q(sel) { return Array.prototype.slice.call(root.querySelectorAll('[data-sbs="' + sel + '"]')); }

    function refresh() {
      var d = opts.get();
      q('x').forEach(function (a) { a.href = xUrl({ text: d.xText || d.text, url: d.url, hashtags: d.hashtags }); });
      q('line').forEach(function (a) { a.href = lineUrl(d.url); });
    }

    function withBlob() {
      var d = opts.get();
      if (d.blob) return Promise.resolve(d);
      return Promise.resolve(opts.prepare ? opts.prepare() : null).then(function () { return opts.get(); });
    }

    q('native').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!ok('native')) return;
        var d = opts.get();
        var go = function (dd) {
          if (!dd.blob) { say('画像を用意できませんでした。もう一度お試しください。'); return; }
          var f = file(dd.blob, dd.filename);
          share({ files: [f], title: dd.title, text: dd.text }).then(function (r) {
            if (r.ok) { opts.onDone && opts.onDone('native'); return; }
            if (r.reason === 'cancelled') return;
            if (r.reason === 'blocked') { say('画像の用意ができました。もう一度「画像を共有」を押してください。'); return; }
            // 共有できなかった時は保存に切り替える
            download(dd.blob, dd.filename);
            say('共有の画面を開けなかったので、画像を保存しました。');
            opts.onDone && opts.onDone('download');
          });
        };
        if (d.blob) go(d); // 押した操作の中ですぐ共有を開く（iPhone は待つと開けない）
        else withBlob().then(go);
      });
    });

    q('download').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!ok('download')) return;
        withBlob().then(function (d) {
          if (!d.blob) { say('画像を用意できませんでした。もう一度お試しください。'); return; }
          download(d.blob, d.filename);
          say('画像を保存しました。保存されない時は、画像を長押しして保存してください。');
          opts.onDone && opts.onDone('download');
        });
      });
    });

    q('x').concat(q('line')).forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (!ok(a.getAttribute('data-sbs'))) { e.preventDefault(); return; }
        refresh();
        opts.onDone && opts.onDone(a.getAttribute('data-sbs'));
      });
    });

    q('copy').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!ok('copy')) return;
        copy(opts.get().url).then(function (done) {
          say(done ? 'リンクをコピーしました。' : 'コピーできませんでした。お手数ですが、アドレス欄から写してください。');
          if (done && opts.onDone) opts.onDone('copy');
        });
      });
    });

    refresh();
    return { refresh: refresh, native: native };
  }

  /* ---------- 文字 ---------- */
  // 「|」は文節の切れ目の印（ページでは <wbr> にしている所）。ここでは折ってよい所として使い、描く時は消す
  var NO_START = '、。，．・：；？！）」』】〕〉》ーぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ々…‥〜';
  function plain(s) { return String(s).replace(/\|/g, ''); }

  function measure(ctx, s) { return ctx.measureText(plain(s)).width; }

  // 文節の印と句読点・空白でだけ折る。どうしても入らない時だけ文字の間で折る。最後の行が1〜2文字にならないよう前の行から下ろす
  function wrap(ctx, s, maxWidth) {
    var tokens = [];
    String(s).split('|').forEach(function (part) {
      var buf = '';
      for (var i = 0; i < part.length; i++) {
        buf += part[i];
        if ('、。，． 　'.indexOf(part[i]) >= 0 && NO_START.indexOf(part[i + 1] || '') < 0) { tokens.push(buf); buf = ''; }
      }
      if (buf) tokens.push(buf);
    });
    // 1語で幅を超えるものは文字で分ける（行頭に来てはいけない字は前へつける）
    var toks = [];
    tokens.forEach(function (t) {
      while (ctx.measureText(t).width > maxWidth && t.length > 1) {
        var n = t.length;
        while (n > 1 && ctx.measureText(t.slice(0, n)).width > maxWidth) n--;
        while (n > 1 && NO_START.indexOf(t[n]) >= 0) n--;
        toks.push(t.slice(0, n)); t = t.slice(n);
      }
      toks.push(t);
    });
    var lines = [[]];
    toks.forEach(function (t) {
      var cur = lines[lines.length - 1];
      if (!cur.length || ctx.measureText(cur.join('') + t).width <= maxWidth) cur.push(t);
      else lines.push([t]);
    });
    var L = lines.length;
    if (L > 1) {
      var last = lines[L - 1], prev = lines[L - 2];
      while (last.join('').trim().length <= 2 && prev.length > 1 && ctx.measureText(prev[prev.length - 1] + last.join('')).width <= maxWidth) {
        last.unshift(prev.pop());
      }
    }
    return lines.map(function (l) { return l.join(''); });
  }

  // 数字（と . : / -）だけ別の書体で描く（このサイトでは数字は Noto Serif JP の斜体）
  // opts: { font: '400 34px "Noto Serif JP"', numFont: 'italic 400 34px "Noto Serif JP"', align: 'center'|'left'|'right', color }
  function runs(s) {
    var out = [], re = /([0-9０-９]+(?:[.:：\/][0-9０-９]+)*)/g, last = 0, m;
    s = plain(s);
    while ((m = re.exec(s))) {
      if (m.index > last) out.push({ t: s.slice(last, m.index), n: false });
      out.push({ t: m[0], n: true });
      last = m.index + m[0].length;
    }
    if (last < s.length) out.push({ t: s.slice(last), n: false });
    return out;
  }
  function drawRuns(ctx, s, x, y, opts) {
    var rs = runs(s), total = 0;
    rs.forEach(function (r) { ctx.font = r.n ? (opts.numFont || opts.font) : opts.font; r.w = ctx.measureText(r.t).width; total += r.w; });
    var sx = opts.align === 'left' ? x : opts.align === 'right' ? x - total : x - total / 2;
    var saveAlign = ctx.textAlign;
    ctx.textAlign = 'left';
    if (opts.color) ctx.fillStyle = opts.color;
    rs.forEach(function (r) { ctx.font = r.n ? (opts.numFont || opts.font) : opts.font; ctx.fillText(r.t, sx, y); sx += r.w; });
    ctx.textAlign = saveAlign;
    return total;
  }
  function runsWidth(ctx, s, opts) {
    var total = 0;
    runs(s).forEach(function (r) { ctx.font = r.n ? (opts.numFont || opts.font) : opts.font; total += ctx.measureText(r.t).width; });
    return total;
  }

  // 字間をあけて描く（Cinzel の小見出しなど）
  function spaced(ctx, s, x, y, spacing, align) {
    var chars = Array.from(s), w = 0, ws = [];
    chars.forEach(function (c, i) { var cw = ctx.measureText(c).width; ws.push(cw); w += cw + (i < chars.length - 1 ? spacing : 0); });
    var sx = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    var saveAlign = ctx.textAlign;
    ctx.textAlign = 'left';
    chars.forEach(function (c, i) { ctx.fillText(c, sx, y); sx += ws[i] + spacing; });
    ctx.textAlign = saveAlign;
    return w;
  }

  /* ---------- 飾り ---------- */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s += 0x6d2b79f5;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 夜の地（トップの夜空と同じ色の流れ）。下にバラとリラの光
  function night(ctx, w, h, opts) {
    opts = opts || {};
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1B1934'); g.addColorStop(0.32, '#211E44'); g.addColorStop(0.6, '#2A2756'); g.addColorStop(0.84, '#352F60'); g.addColorStop(1, '#41376A');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    var cy = h * 1.12, r = Math.max(w, h) * 0.75;
    var rg = ctx.createRadialGradient(w / 2, cy, 0, w / 2, cy, r);
    rg.addColorStop(0, 'rgba(212,154,176,0.30)'); rg.addColorStop(0.42, 'rgba(169,145,207,0.17)'); rg.addColorStop(0.72, 'rgba(169,145,207,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    if (opts.glow) {
      var gg = ctx.createRadialGradient(opts.glow.x, opts.glow.y, 0, opts.glow.x, opts.glow.y, opts.glow.r);
      gg.addColorStop(0, opts.glow.color || 'rgba(169,145,207,0.22)'); gg.addColorStop(1, 'rgba(169,145,207,0)');
      ctx.fillStyle = gg; ctx.fillRect(0, 0, w, h);
    }
  }

  // 小さな星。avoid の四角の中は薄く（文字の後ろで目立たないように）
  function stars(ctx, w, h, opts) {
    opts = opts || {};
    var rand = rng(opts.seed || 1), n = opts.count || 60, scale = opts.scale || 1;
    ctx.save();
    for (var i = 0; i < n; i++) {
      var x = rand() * w, y = rand() * h, r = (0.6 + rand() * 1.0) * scale, a = 0.3 + rand() * 0.5;
      var av = opts.avoid;
      if (av && x > av.x && x < av.x + av.w && y > av.y && y < av.y + av.h) a *= 0.15;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // いばらの蔓（index.html の #sb-briar-corner と同じ形）
  var BRIAR = {"viewBox":"0 0 300 210","groups":[["vine",1.15,"M-6,26C30,10 60,36 98,24C130,14 150,38 186,30C218,23 238,8 266,16C282,21 284,36 272,38 M22,-6C8,30 34,52 20,88C10,116 30,136 18,166C12,182 20,196 30,198 M40,20C58,48 52,66 70,80 M144.6,27.4Q142.4,32 145.2,36.4 M251.5,13.7Q255.6,11.4 255.3,6.7 M17.9,115.2Q21.8,118.6 26.7,117 M68.9,79.2Q67.2,82.2 70.2,84 M95.7,24.7Q95.7,29 99.7,30.4"],["thorn",0,"M23.5,20.7Q25,19.1 23.6,15.5Q26.7,19.7 26.9,20.9Z M72.2,27.2Q73.6,28.9 71.9,32.4Q75.3,28.4 75.6,27.3Z M169.1,31.7Q170.5,30 168.9,26.5Q172.2,30.5 172.5,31.7Z M229.6,16.8Q230.6,15 228.2,12.4Q232.4,15 232.9,15.9Z M18.3,26.2Q16.9,27.8 13.2,26.7Q17.6,29.4 18.8,29.5Z M21.7,139.5Q20.2,141.1 16.5,139.6Q20.8,142.7 21.9,142.9Z"],["leaf",0.9,"M110.5,18.9C116.2,18.4 118.8,11.9 117,6.5C111.6,8.1 107.7,14 110.5,18.9Z M144.7,36.3C143,32.4 137.6,32.1 134.2,34.6C136.7,38 141.8,39.4 144.7,36.3Z M210.6,25.7C210,30.7 215.1,33.9 219.9,33.2C219.5,28.4 215.2,24.1 210.6,25.7Z M26.8,60.1C27.3,65.3 33.4,67.8 38.3,66.1C36.8,61.1 31.4,57.5 26.8,60.1Z M26.5,117.5C22.7,118 21.2,122.6 22.5,126.1C26.1,124.8 28.5,120.7 26.5,117.5Z M13.5,181.6C9.3,180.1 5.3,184 4.9,188.4C9.3,189 14,186.1 13.5,181.6Z M57.2,53.2C58.4,57.7 63.8,58.6 67.7,56.2C65.7,52.1 60.6,50 57.2,53.2Z M99.3,30.6C95,27.6 89.1,30.6 87.1,35.4C91.9,37.6 98.2,35.8 99.3,30.6Z"],["rib",0.7,"M109,21.8L115.7,9 M145.2,36.4L136.3,34.9 M208.1,23.7L218.1,31.7 M24,58.6L36,64.9 M26.7,117L23.3,124.4 M16.1,179.6L6.6,187 M54.1,52.3L65.6,55.6 M99.7,30.4L89.5,34.5"],["rose",1,"M152,41.2C155.7,42.6 154.3,49.3 150.3,49C150.1,53 143.3,53.7 142.3,49.9C138.5,50.9 135.7,44.7 139.1,42.6C136.9,39.2 142,34.7 145,37.2C147.5,34.1 153.4,37.5 152,41.2Z M39.5,118.8C41.8,121.5 37.9,126.1 34.9,124.3C33,127.3 27.4,125.1 28.2,121.6C24.8,120.8 25.2,114.7 28.7,114.5C28.4,110.9 34.3,109.4 35.7,112.7C38.9,111.3 42.2,116.5 39.5,118.8Z M111.2,32.3C116.1,32.4 117.3,40.7 112.6,42.1C114,46.8 106.5,50.5 103.7,46.4C99.7,49.3 93.8,43.2 96.8,39.3C92.9,36.4 96.8,29 101.5,30.6C103,26 111.3,27.4 111.2,32.3Z M255.3,6.7C259.8,5.6 260.3,2.1 259.4,-1C256.4,-0.1 253.7,2.3 255.3,6.7Z M70.2,84C67.8,87.6 69.7,90.3 72.3,91.8C73.8,89.2 74.1,85.9 70.2,84Z"],["spiral",0.85,"M146.5,44.3L146.5,44.7 146.2,45 145.8,45.3 145.2,45.3 144.7,45.1 144.2,44.6 143.9,44 143.9,43.2 144.3,42.5 144.9,41.9 145.8,41.6 146.8,41.7 147.7,42.1 148.4,43 148.7,44.1 148.6,45.3 147.9,46.4 146.9,47.2 145.6,47.5 144.2,47.3 142.9,46.5 142,45.2 141.7,43.7 142,42.1 142.9,40.7 144.4,39.7 146.1,39.4 148,39.8 149.5,40.9 150.6,42.5 150.9,44.5 150.4,46.6 149.1,48.3 147.2,49.4 M33.7,119.1L33.4,119.3 33,119.3 32.6,119.2 32.2,118.8 32,118.3 32,117.7 32.3,117.2 32.8,116.7 33.5,116.5 34.3,116.6 35,116.9 35.5,117.6 35.8,118.5 35.6,119.5 35.1,120.4 34.2,121 33.1,121.2 32,121 31,120.4 30.3,119.3 30,118 30.3,116.7 31.1,115.5 32.4,114.7 33.9,114.5 35.4,114.9 36.7,115.9 37.5,117.3 37.7,119 37.3,120.7 36.1,122.1 34.5,123 32.6,123.2 30.7,122.6 M106.2,37.9L106.3,38.4 106.3,38.9 106,39.5 105.5,39.9 104.8,40.1 104,39.9 103.3,39.4 102.8,38.7 102.6,37.7 102.8,36.6 103.5,35.7 104.6,35.1 105.8,34.9 107.1,35.3 108.2,36.2 108.9,37.5 109,39.1 108.5,40.6 107.4,41.9 105.8,42.6 104,42.7 102.2,42 100.8,40.7 100,38.8 100,36.7 100.8,34.7 102.4,33.2 104.5,32.3 106.9,32.4 109.1,33.3 110.8,35.2 111.7,37.6 111.6,40.2 110.4,42.7 M255.3,6.7Q260.3,6.2 259.2,2.7M255.3,6.7Q252.9,2.2 256.4,1.3 M70.2,84Q67.1,87.5 70.1,89.1M70.2,84Q74.7,85.5 72.9,88.4"]]};
  var briarPaths = null;
  function briar(ctx, x, y, width, opts) {
    opts = opts || {};
    if (!window.Path2D) return;
    var vb = BRIAR.viewBox.split(' ').map(Number), s = width / vb[2];
    if (!briarPaths) briarPaths = BRIAR.groups.map(function (g) { return { k: g[0], w: g[1], p: new Path2D(g[2]) }; });
    var line = opts.color || 'rgba(214,193,142,0.6)', rose = opts.rose || 'rgba(230,175,196,0.8)', roseFill = opts.roseFill || 'rgba(230,175,196,0.14)';
    var px = opts.px || Math.max(1, width / 220); // 線の太さ（画面の点で）
    ctx.save();
    ctx.translate(x, y);
    if (opts.rotate) ctx.rotate(opts.rotate);
    ctx.scale(s * (opts.flipX ? -1 : 1), s * (opts.flipY ? -1 : 1));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    briarPaths.forEach(function (g) {
      ctx.lineWidth = (g.w || 1) * px / s;
      if (g.k === 'vine' || g.k === 'rib') { ctx.strokeStyle = line; ctx.stroke(g.p); }
      else if (g.k === 'thorn') { ctx.fillStyle = line; ctx.fill(g.p); }
      else if (g.k === 'leaf') { ctx.save(); ctx.globalAlpha *= 0.16; ctx.fillStyle = line; ctx.fill(g.p); ctx.restore(); ctx.strokeStyle = line; ctx.stroke(g.p); }
      else if (g.k === 'rose') { ctx.fillStyle = roseFill; ctx.fill(g.p); ctx.strokeStyle = rose; ctx.stroke(g.p); }
      else if (g.k === 'spiral') { ctx.strokeStyle = rose; ctx.stroke(g.p); }
    });
    ctx.restore();
  }

  // バラの封蝋（index.html の .sb-seal と同じ絵）。cx, cy が中心、d が直径
  var SEAL_ROSE = ['M44.5,33.4C48.9,32.6 51.2,39.9 47.2,41.8C49.3,45.8 43.1,50.3 40,47.1C36.9,50.3 30.7,45.8 32.8,41.8C28.8,39.9 31.1,32.6 35.5,33.4C36.2,29 43.8,29 44.5,33.4Z',
    'M40.8,39L41.1,39.3 41.2,39.8 41.1,40.4 40.8,40.9 40.2,41.2 39.5,41.3 38.7,41.1 38.1,40.5 37.7,39.7 37.6,38.8 37.9,37.8 38.7,37 39.8,36.5 41,36.5 42.2,37 43.1,38 43.6,39.3 43.6,40.7 42.9,42.1 41.7,43.2 40.2,43.7 38.5,43.6 36.9,42.8 35.7,41.4 35.1,39.6 35.3,37.7 36.3,35.9 37.9,34.6 40,34 42.1,34.3 44.1,35.4 45.5,37.3 46.1,39.6 45.8,42',
    'M40.7,49.2C40,53.5 44.4,56.8 48.7,56.7C48.6,52.4 45,48.2 40.7,49.2Z',
    'M39.3,49.2C35,48.2 31.4,52.4 31.3,56.7C35.6,56.8 40,53.5 39.3,49.2Z'];
  var SEAL_BLOB = 'M74.2,40C74.1,45.3 72,50.7 69.7,55.6C67.4,60.5 64.5,66.4 60.2,69.3C55.9,72.2 49.4,72.4 44,73C38.6,73.5 32.5,74.5 27.5,72.8C22.6,71.2 17.5,67 14.2,62.8C10.9,58.7 9.2,53.1 7.8,47.9C6.5,42.7 4.8,36.6 6,31.6C7.2,26.6 11.6,22.1 15.3,18.1C18.9,14.1 22.9,9.4 27.7,7.6C32.5,5.7 38.8,6.2 44,7.1C49.2,7.9 54.5,9.8 58.9,12.6C63.4,15.4 68.1,19.3 70.7,23.9C73.3,28.5 74.4,34.7 74.2,40Z';
  function seal(ctx, cx, cy, d) {
    if (!window.Path2D) return;
    var s = d / 80;
    ctx.save();
    ctx.translate(cx - d / 2, cy - d / 2);
    ctx.scale(s, s);
    ctx.save();
    ctx.shadowColor = 'rgba(14,10,36,0.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 8;
    var g = ctx.createRadialGradient(28.8, 24, 0, 28.8, 24, 60);
    g.addColorStop(0, '#C25A82'); g.addColorStop(0.5, '#9C3D63'); g.addColorStop(1, '#6A2246');
    ctx.fillStyle = g; ctx.fill(new Path2D(SEAL_BLOB));
    ctx.restore();
    function ring(cx2, cy2, r, color, a, w) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    ring(40, 40, 25.5, '#5A1B39', 0.55, 1.6);
    ring(40, 40.9, 25.5, '#F2C4D6', 0.38, 0.9);
    ctx.save(); ctx.globalAlpha = 0.06; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(40, 40, 22.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.save(); ctx.translate(0.5, 0.9); ctx.globalAlpha = 0.45; ctx.strokeStyle = '#5A1B39'; ctx.lineWidth = 1.5;
    SEAL_ROSE.forEach(function (p) { ctx.stroke(new Path2D(p)); });
    ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.92; ctx.strokeStyle = '#F7D6E2'; ctx.lineWidth = 1.25;
    SEAL_ROSE.concat(['M40,48.5L47.1,55.2', 'M40,48.5L32.9,55.2']).forEach(function (p) { ctx.stroke(new Path2D(p)); });
    ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.22; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(new Path2D('M17 26c4-8 12-13 21-14')); ctx.restore();
    ctx.restore();
  }

  // バラのつぼみの区切り（細い線のあいだに、つぼみ）。cx, cy が中心、width が全体の幅
  var BUD = ['M12.2 1.8c2.9 2.3 3.7 5.9.6 9.9-.3.4-.6.7-.8.9-3-2.6-3.6-6.4.2-10.8z', 'M12 12.9c-2.5-.2-4.1-2-4.4-4.6-.1-.6-.4-1-.9-1.3 1.2-.1 2 .6 2.3 1.6.5 1.9 1.5 3.2 3 4.3z', 'M12 12.9c2.5-.2 4.1-2 4.4-4.6.1-.6.4-1 .9-1.3-1.2-.1-2 .6-2.3 1.6-.5 1.9-1.5 3.2-3 4.3z', 'M11.45 12.4h1.1v9.4h-1.1z', 'M12.5 17.2c1.4-1.8 3.7-2.4 5.8-1.6-1.5 1.6-3.7 2.2-5.8 1.6zM11.5 19.3c-1.4-1.4-3.4-1.8-5.1-1 1.4 1.2 3.4 1.6 5.1 1z'];
  function bud(ctx, cx, cy, width, color, opts) {
    opts = opts || {};
    var h = opts.size || width * 0.116, lw = opts.lineWidth || Math.max(1, width / 170);
    ctx.save();
    function seg(x0, x1, fadeLeft) {
      var g = ctx.createLinearGradient(x0, 0, x1, 0);
      if (fadeLeft) { g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.77, color); g.addColorStop(1, color); }
      else { g.addColorStop(0, color); g.addColorStop(0.23, color); g.addColorStop(1, 'rgba(0,0,0,0)'); }
      ctx.fillStyle = g; ctx.fillRect(x0, cy - lw / 2, x1 - x0, lw);
    }
    seg(cx - width / 2, cx - width * 0.11, true);
    seg(cx + width * 0.11, cx + width / 2, false);
    if (window.Path2D) {
      var s = h / 24;
      ctx.translate(cx - h / 2, cy - h / 2); ctx.scale(s, s);
      ctx.fillStyle = color;
      BUD.forEach(function (p) { ctx.fill(new Path2D(p)); });
    }
    ctx.restore();
  }

  function ellipse(ctx, cx, cy, rx, ry) {
    ctx.beginPath();
    if (ctx.ellipse) ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    else { ctx.save(); ctx.translate(cx, cy); ctx.scale(rx, ry); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.restore(); }
  }

  // 城の窓のようなアーチ（上の辺が楕円の弧・下の角は小さく丸い）。ページの .sb-invite と同じ形
  function arch(ctx, x, y, w, h, topRy, r) {
    var rx = w / 2;
    r = r || 10;
    ctx.beginPath();
    ctx.moveTo(x, y + topRy);
    if (ctx.ellipse) {
      ctx.ellipse(x + rx, y + topRy, rx, topRy, 0, Math.PI, Math.PI * 2);
    } else {
      ctx.bezierCurveTo(x, y + topRy * 0.45, x + rx * 0.45, y, x + rx, y);
      ctx.bezierCurveTo(x + w - rx * 0.45, y, x + w, y + topRy * 0.45, x + w, y + topRy);
    }
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.closePath();
  }

  window.SBShare = {
    version: '1.0.0',
    site: SITE,
    fonts: fonts,
    loadImage: loadImage,
    canvas: canvas,
    toBlob: toBlob,
    file: file,
    canShareFiles: canShareFiles,
    share: share,
    download: download,
    xUrl: xUrl,
    lineUrl: lineUrl,
    copy: copy,
    track: track,
    bindActions: bindActions,
    text: { plain: plain, wrap: wrap, measure: measure, drawRuns: drawRuns, runsWidth: runsWidth, spaced: spaced },
    draw: { rng: rng, night: night, stars: stars, briar: briar, seal: seal, bud: bud, ellipse: ellipse, arch: arch }
  };
})();
