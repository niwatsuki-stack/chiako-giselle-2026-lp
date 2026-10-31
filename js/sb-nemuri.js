/* ===========================================================================
   『眠れる森の美女 #shorts』の、眠りと目覚めの小さな仕掛け
   ========================================================================== */
(function () {
  'use strict';
  if (window.__sbNemuriLoaded) return;
  window.__sbNemuriLoaded = true;

  var DAY = 24 * 60 * 60 * 1000;
  var SHOW_DAY = Date.UTC(2027, 7, 4);
  var ACTIONS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'scroll', 'touchstart'];
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var DEMO = /(?:^|[?&])nemuri=demo(?:&|$)/.test(location.search);
  var originalTitle = document.title;
  var countdownStarted = false;
  var welcomeTimer = null;

  function onActions(fn) {
    ACTIONS.forEach(function (name) {
      window.addEventListener(name, fn, name === 'keydown' ? false : { passive: true });
    });
  }

  function onFirstAction(fn) {
    function first(event) {
      if (event.isTrusted === false) return;
      ACTIONS.forEach(function (name) { window.removeEventListener(name, first, false); });
      fn();
    }
    onActions(first);
  }

  function daysUntilShow() {
    var now = new Date(Date.now() + 9 * 60 * 60 * 1000);
    var today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Math.round((SHOW_DAY - today) / DAY);
  }

  function countdownTitle() {
    var days = daysUntilShow();
    if (!countdownStarted || days < 0) return originalTitle;
    if (days === 0) return '今夜、目覚めます｜' + originalTitle;
    return '目覚めまで あと' + days + '日｜' + originalTitle;
  }

  function sleepingTitle() {
    var days = daysUntilShow();
    if (days < 0) return 'すやすや…｜眠れる森の美女 #shorts';
    if (days === 0) return 'すやすや…　今夜、目覚めます';
    return 'すやすや…　目覚めまで あと' + days + '日';
  }

  function iconLinks() {
    return {
      large: document.querySelector('link[rel~="icon"][sizes="32x32"]'),
      small: document.querySelector('link[rel~="icon"][sizes="16x16"]')
    };
  }

  var icons = iconLinks();
  var originalIcons = {
    large: icons.large ? icons.large.getAttribute('href') : null,
    small: icons.small ? icons.small.getAttribute('href') : null
  };

  function setIcons(kind) {
    if (icons.large) icons.large.setAttribute('href', '/images/favicon-' + kind + '-32.png');
    if (icons.small) icons.small.setAttribute('href', '/images/favicon-' + kind + '-16.png');
  }

  function restoreIcons() {
    if (icons.large && originalIcons.large !== null) icons.large.setAttribute('href', originalIcons.large);
    if (icons.small && originalIcons.small !== null) icons.small.setAttribute('href', originalIcons.small);
  }

  function startCountdown() {
    if (countdownStarted) return;
    countdownStarted = true;
    if (!document.hidden && !welcomeTimer) document.title = countdownTitle();
  }

  function changeVisibility() {
    clearTimeout(welcomeTimer);
    welcomeTimer = null;
    if (document.hidden) {
      document.title = sleepingTitle();
      setIcons('sleep');
      return;
    }
    document.title = 'おかえりなさい｜眠れる森の美女 #shorts';
    setIcons('wake');
    welcomeTimer = setTimeout(function () {
      welcomeTimer = null;
      if (document.hidden) return;
      document.title = countdownTitle();
      restoreIcons();
    }, 2600);
  }

  function initTitle() {
    if (DEMO) startCountdown();
    else onFirstAction(startCountdown);
    document.addEventListener('visibilitychange', changeVisibility);
    if (document.hidden) changeVisibility();
  }

  /* ---------- 100年の眠り ---------- */
  var idleTimer = null;
  var sleeping = false;
  var sleepCount = 0;
  var sleepLayer = null;
  var IDLE_WAIT = DEMO ? 5000 : 40000;

  function focusedOnControl() {
    var active = document.activeElement;
    if (!active || !active.tagName) return false;
    return /^(INPUT|TEXTAREA|SELECT|IFRAME)$/.test(active.tagName);
  }

  function spindleIsOpen() {
    return document.documentElement.classList.contains('nm-spindle-open');
  }

  function idleIsBlocked() {
    return document.hidden || focusedOnControl() || spindleIsOpen() || sleepCount >= 3;
  }

  function createSleepLayer() {
    var layer = document.createElement('div');
    layer.className = 'nm-sleep';
    // 幕が開く時に左右へ分かれた、いばらの垣根。眠ると両側からまた伸びてくる
    layer.innerHTML = '<div class="nm-sleep__shade" aria-hidden="true"></div>' +
      '<i class="nm-sleep__veil nm-sleep__veil--l" aria-hidden="true"></i>' +
      '<i class="nm-sleep__veil nm-sleep__veil--r" aria-hidden="true"></i>' +
      '<p class="nm-sleep__message" role="status" aria-live="polite">眠りの呪いが…　どこかに触れると、目が覚めます</p>';
    document.body.appendChild(layer);
    return layer;
  }

  function scheduleIdle() {
    clearTimeout(idleTimer);
    idleTimer = null;
    if (sleeping || REDUCED || sleepCount >= 3 || document.hidden) return;
    idleTimer = setTimeout(tryToSleep, IDLE_WAIT);
  }

  function tryToSleep() {
    clearTimeout(idleTimer);
    idleTimer = null;
    if (idleIsBlocked()) {
      if (!document.hidden && sleepCount < 3) idleTimer = setTimeout(tryToSleep, 1000);
      return;
    }
    sleeping = true;
    sleepCount += 1;
    sleepLayer = createSleepLayer();
    (window.requestAnimationFrame || function (fn) { setTimeout(fn, 16); })(function () {
      if (sleepLayer) sleepLayer.classList.add('is-asleep');
    });
  }

  function actionPoint(event) {
    var touch = event && event.touches && event.touches[0];
    if (touch) return { x: touch.clientX, y: touch.clientY };
    if (event && event.type !== 'keydown' && event.type !== 'scroll' && typeof event.clientX === 'number') {
      return { x: event.clientX, y: event.clientY };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  function goldBurst(x, y, amount) {
    if (REDUCED) return;
    var burst = document.createElement('span');
    burst.className = 'nm-gold-burst';
    burst.setAttribute('aria-hidden', 'true');
    burst.style.left = x + 'px';
    burst.style.top = y + 'px';
    for (var i = 0; i < amount; i += 1) {
      var spark = document.createElement('i');
      var angle = (Math.PI * 2 * i / amount) + (i % 2 ? 0.18 : -0.1);
      var distance = 28 + (i % 3) * 13;
      spark.style.setProperty('--nm-x', Math.cos(angle) * distance + 'px');
      spark.style.setProperty('--nm-y', Math.sin(angle) * distance - 12 + 'px');
      spark.style.setProperty('--nm-delay', (i % 3) * 35 + 'ms');
      burst.appendChild(spark);
    }
    document.body.appendChild(burst);
    setTimeout(function () { if (burst.parentNode) burst.parentNode.removeChild(burst); }, 1000);
  }

  function wakeFromSleep(event) {
    if (!sleeping || !sleepLayer) return;
    var point = actionPoint(event);
    var layer = sleepLayer;
    var message = layer.querySelector('.nm-sleep__message');
    sleeping = false;
    sleepLayer = null;
    if (message) message.textContent = 'おはようございます';
    layer.classList.add('is-waking');
    goldBurst(point.x, point.y, 8);
    setTimeout(function () {
      if (layer.parentNode) layer.parentNode.removeChild(layer);
      scheduleIdle();
    }, 800);
  }

  function idleAction(event) {
    if (sleeping) wakeFromSleep(event);
    else scheduleIdle();
  }

  function idleVisibility() {
    if (document.hidden) {
      clearTimeout(idleTimer);
      idleTimer = null;
    } else if (!sleeping) scheduleIdle();
  }

  function initIdle() {
    if (!document.body.hasAttribute('data-nemuri-idle') || REDUCED) return;
    onActions(idleAction);
    document.addEventListener('focusin', scheduleIdle);
    document.addEventListener('focusout', scheduleIdle);
    document.addEventListener('visibilitychange', idleVisibility);
    scheduleIdle();
  }

  /* ---------- 隠れた糸車 ---------- */
  var SPINDLE_KEY = 'sb-nemuri-spindle';
  var SHARE_TEXT = '『眠れる森の美女 #shorts』のサイトで、隠れた糸車を見つけました。';
  var SHARE_URL = 'https://balletshorts.confy.co.jp/';
  var SHARE_TAG = '眠れる森の美女shorts';
  var messages = [
    '糸車に、ふれてしまいましたね。でも、心配はいりません。呪いは、わたしが百年の眠りに変えておきました。目覚めの日は、2027年8月4日。練馬の舞台で、お待ちしています。',
    '見つけてしまいましたね、あの糸車を。眠りは、終わりではありません。幕が上がる前の、静かなひとときです。2027年8月4日、練馬文化センターで、目覚めの時を一緒に。',
    '指先が、ちくりとしましたか。大丈夫。あなたの眠りは、やさしい夢でいっぱいです。目を覚ましたら、舞台の幕が上がります。2027年8月4日 18:30開演。'
  ];
  var lastMessage = -1;
  var spindleOverlay = null;
  var spindleTimer = null;
  var oldBodyOverflow = '';
  var inerted = [];

  function spindleCount() {
    try {
      var count = parseInt(localStorage.getItem(SPINDLE_KEY) || '0', 10);
      return isFinite(count) && count > 0 ? count : 0;
    } catch (e) { return 0; }
  }

  function saveSpindleCount(count) {
    try { localStorage.setItem(SPINDLE_KEY, String(count)); } catch (e) { /* 保存できない端末でも開ける */ }
  }

  function chooseMessage() {
    var choice = Math.floor(Math.random() * messages.length);
    if (messages.length > 1 && choice === lastMessage) choice = (choice + 1 + Math.floor(Math.random() * (messages.length - 1))) % messages.length;
    lastMessage = choice;
    return messages[choice];
  }

  function xShareUrl() {
    if (window.SBShare && typeof window.SBShare.xUrl === 'function') {
      return window.SBShare.xUrl({ text: SHARE_TEXT, url: SHARE_URL, hashtags: [SHARE_TAG] });
    }
    return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(SHARE_TEXT) +
      '&url=' + encodeURIComponent(SHARE_URL) + '&hashtags=' + encodeURIComponent(SHARE_TAG);
  }

  function lineShareUrl() {
    if (window.SBShare && typeof window.SBShare.lineUrl === 'function') return window.SBShare.lineUrl(SHARE_URL);
    return 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(SHARE_URL);
  }

  function trackSpindle() {
    try {
      if (window.SBShare && typeof window.SBShare.track === 'function') window.SBShare.track('nemuri_spindle_found');
      else if (typeof window.gtag === 'function') window.gtag('event', 'nemuri_spindle_found');
    } catch (e) { /* 計測できなくても画面は止めない */ }
  }

  function setBackgroundInert(overlay) {
    inerted = [];
    Array.prototype.slice.call(document.body.children).forEach(function (child) {
      if (child === overlay || child.tagName === 'SCRIPT') return;
      if (!child.inert) {
        child.inert = true;
        inerted.push(child);
      }
    });
  }

  function restoreBackground() {
    inerted.forEach(function (child) { child.inert = false; });
    inerted = [];
  }

  function focusableIn(root) {
    return Array.prototype.slice.call(root.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));
  }

  function trapDialog(event) {
    if (!spindleOverlay) return;
    if (event.key === 'Escape' || event.keyCode === 27) {
      event.preventDefault();
      closeSpindle(false);
      return;
    }
    if (event.key !== 'Tab' && event.keyCode !== 9) return;
    var dialog = spindleOverlay.querySelector('.nm-spindle-dialog');
    if (!dialog || dialog.hidden) {
      event.preventDefault();
      return;
    }
    var items = focusableIn(dialog);
    if (!items.length) {
      event.preventDefault();
      return;
    }
    var first = items[0];
    var last = items[items.length - 1];
    if (!dialog.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function showSpindleDialog() {
    if (!spindleOverlay) return;
    var intro = spindleOverlay.querySelector('.nm-spindle-intro');
    var dialog = spindleOverlay.querySelector('.nm-spindle-dialog');
    if (intro) intro.hidden = true;
    if (dialog) {
      dialog.hidden = false;
      spindleOverlay.classList.add('is-dialog');
      var close = dialog.querySelector('[data-nm-close]');
      if (close) close.focus();
    }
  }

  function finishSpindleClose(goAbout) {
    var button = document.querySelector('.nm-spindle');
    if (spindleOverlay && spindleOverlay.parentNode) spindleOverlay.parentNode.removeChild(spindleOverlay);
    spindleOverlay = null;
    restoreBackground();
    document.body.style.overflow = oldBodyOverflow;
    document.documentElement.classList.remove('nm-spindle-open');
    document.removeEventListener('keydown', trapDialog);
    if (button) button.focus();
    if (goAbout) location.hash = 'about';
    scheduleIdle();
  }

  function closeSpindle(goAbout) {
    if (!spindleOverlay) return;
    clearTimeout(spindleTimer);
    spindleTimer = null;
    if (REDUCED) {
      finishSpindleClose(goAbout);
      return;
    }
    spindleOverlay.classList.add('is-closing');
    goldBurst(window.innerWidth / 2, window.innerHeight / 2, 7);
    spindleTimer = setTimeout(function () { finishSpindleClose(goAbout); }, 480);
  }

  function openSpindle() {
    if (spindleOverlay) return;
    var foundBefore = spindleCount();
    var overlay = document.createElement('div');
    overlay.className = 'nm-spindle-night';
    overlay.setAttribute('tabindex', '-1');
    overlay.innerHTML =
      '<div class="nm-spindle-intro" aria-hidden="true">' +
        '<svg viewBox="0 0 32 32" focusable="false"><circle cx="12" cy="13" r="8"></circle><path d="M12 13h8M12 13l4-6.9M12 13L8 6.1M12 13H4M12 13l-4 6.9M12 13l4 6.9M12 13v.01M9 20.4L6 29M15 20.4l3 8.6M22 4l5 4M24.5 6L21 24"></path></svg>' +
        '<p>……糸車に、ふれてしまいました</p>' +
      '</div>' +
      '<section class="nm-spindle-dialog" role="dialog" aria-modal="true" aria-labelledby="nm-spindle-title" hidden>' +
        '<span class="nm-spindle-dialog__corners" aria-hidden="true"></span>' +
        '<p class="nm-spindle-dialog__again"' + (foundBefore ? '' : ' hidden') + '>また、見つけましたね</p>' +
        '<h2 id="nm-spindle-title">リラの精より</h2>' +
        '<p class="nm-spindle-dialog__message"></p>' +
        '<div class="nm-spindle-dialog__actions">' +
          '<button type="button" class="th-btn th-btn--gold" data-nm-close>目を覚ます</button>' +
          '<button type="button" class="th-btn th-btn--velvet" data-nm-about>公演のことを見る</button>' +
        '</div>' +
        '<div class="nm-spindle-dialog__share"><p>見つけたことを伝える</p>' +
          '<div><a data-nm-x target="_blank" rel="noopener">X</a><a data-nm-line target="_blank" rel="noopener">LINE</a></div>' +
        '</div>' +
      '</section>';
    overlay.querySelector('.nm-spindle-dialog__message').textContent = chooseMessage();
    overlay.querySelector('[data-nm-x]').href = xShareUrl();
    overlay.querySelector('[data-nm-line]').href = lineShareUrl();
    overlay.querySelector('[data-nm-close]').addEventListener('click', function () { closeSpindle(false); });
    overlay.querySelector('[data-nm-about]').addEventListener('click', function () { closeSpindle(true); });
    overlay.addEventListener('click', function (event) { if (event.target === overlay) closeSpindle(false); });
    spindleOverlay = overlay;
    oldBodyOverflow = document.body.style.overflow;
    document.body.appendChild(overlay);
    setBackgroundInert(overlay);
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('nm-spindle-open');
    document.addEventListener('keydown', trapDialog);
    overlay.focus();
    saveSpindleCount(foundBefore + 1);
    trackSpindle();
    if (REDUCED) showSpindleDialog();
    else spindleTimer = setTimeout(showSpindleDialog, 1400);
  }

  function initSpindle() {
    var button = document.querySelector('.nm-spindle');
    if (!button) return;
    button.addEventListener('click', openSpindle);
  }

  initTitle();
  initIdle();
  initSpindle();
})();
