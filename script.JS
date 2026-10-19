(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Stars
  var sky = $('#sky');
  for (var i = 0; i < 70; i++) {
    var s = document.createElement('i');
    var size = Math.random() * 2 + 1;
    s.className = 'star';
    s.style.cssText = 'left:' + Math.random() * 100 + '%;top:' + Math.random() * 100 + '%;width:' + size + 'px;height:' + size +
      'px;--t:' + (2 + Math.random() * 4) + 's;--dl:-' + Math.random() * 5 + 's';
    sky.appendChild(s);
  }

  // Screen flow
  var screens = document.querySelectorAll('.screen');
  var ready = false, readyTimer;
  function show(id) {
    clearTimeout(readyTimer);
    ready = false;
    screens.forEach(function (el) { el.classList.toggle('active', el.id === id); });
    document.body.setAttribute('data-screen', id);
    if (id === 's3') readyTimer = setTimeout(function () { ready = true; }, reduce ? 0 : 3400);
    if (id === 's-yes') { burst(); setTimeout(burst, 1400); }
  }
  document.body.setAttribute('data-screen', 's1');
  document.querySelectorAll('[data-next]').forEach(function (b) {
    b.addEventListener('click', function () { show(b.getAttribute('data-next')); });
  });
  document.querySelectorAll('[data-back]').forEach(function (b) {
    b.addEventListener('click', function () { dodgers.forEach(resetDodger); show('s3'); });
  });

  // Dodging buttons
  var whisper = $('#whisper'), whisperTimer, lastMsg = '';
  var lines = ['Are you sure? 🥺', 'Wrong button! 😂', 'Hehe, try again.', 'Nice try! 👀', "That doesn't look like YES."];
  function say(t) {
    whisper.textContent = t;
    whisper.classList.add('show');
    clearTimeout(whisperTimer);
    whisperTimer = setTimeout(function () { whisper.classList.remove('show'); }, 2400);
  }
  function pick() {
    var m;
    do { m = lines[Math.floor(Math.random() * lines.length)]; } while (m === lastMsg);
    lastMsg = m;
    return m;
  }

  var dodgers = [
    { key: 'no', el: $('#no'), slot: $('#noSlot'), limit: 5, screen: 's-no' },
    { key: 'maybe', el: $('#maybe'), slot: $('#maybeSlot'), limit: 6, screen: 's-maybe' }
  ];
  dodgers.forEach(resetDodger);

  function resetDodger(b) {
    b.count = 0; b.moved = false; b.free = false; b.last = 0;
    b.el.style.cssText = '';
    b.slot.style.width = ''; b.slot.style.height = '';
  }
  function vw() { return document.documentElement.clientWidth; }
  function vh() { return window.innerHeight; }
  function hit(a, r, pad) {
    return a.left < r.right + pad && a.right > r.left - pad && a.top < r.bottom + pad && a.bottom > r.top - pad;
  }
  function dodge(b) {
    var el = b.el, r = el.getBoundingClientRect();
    if (!b.moved) {
      b.slot.style.width = r.width + 'px';
      b.slot.style.height = r.height + 'px';
      el.style.position = 'fixed';
      el.style.margin = '0';
      el.style.left = r.left + 'px';
      el.style.top = r.top + 'px';
      void el.offsetWidth;
      b.moved = true;
    }
    var w = r.width, h = r.height, m = 12, W = vw(), H = vh();
    var other = dodgers.filter(function (d) { return d !== b; })[0];
    var avoid = [$('#yes').getBoundingClientRect(), other.el.getBoundingClientRect()];
    var text = $('#s3 .copy').getBoundingClientRect();
    var best = null;
    for (var n = 0; n < 80 && !best; n++) {
      var x = m + Math.random() * Math.max(0, W - w - 2 * m);
      var y = m + Math.random() * Math.max(0, H - h - 2 * m);
      var box = { left: x, top: y, right: x + w, bottom: y + h };
      if (Math.abs(x - r.left) + Math.abs(y - r.top) < (n < 50 ? 90 : 0)) continue;
      if (hit(box, avoid[0], 18) || hit(box, avoid[1], 10)) continue;
      if (n < 60 && hit(box, text, 6)) continue;
      best = { x: x, y: y };
    }
    if (!best) best = { x: m, y: H - h - m };
    el.style.left = best.x + 'px';
    el.style.top = best.y + 'px';
  }
  function attempt(b) {
    if (b.free) { show(b.screen); return; }
    b.last = Date.now();
    dodge(b);
    b.count++;
    if (b.key === 'maybe' && b.count === 3) say('Even the maybe button is confused. 😭');
    else if (b.count >= b.limit) { b.free = true; say("Okay, okay. I'll hold still now. 😌"); }
    else say(pick());
  }
  dodgers.forEach(function (b) {
    b.el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' && ready && !b.free) { e.preventDefault(); attempt(b); }
    });
    b.el.addEventListener('click', function () {
      if (!ready || Date.now() - b.last < 500) return;
      attempt(b);
    });
  });
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || !ready) return;
    dodgers.forEach(function (b) {
      if (b.free || Date.now() - b.last < 380) return;
      var r = b.el.getBoundingClientRect();
      var dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      var dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      if (Math.sqrt(dx * dx + dy * dy) < 70) attempt(b);
    });
  });
  window.addEventListener('resize', function () {
    dodgers.forEach(function (b) {
      if (!b.moved) return;
      var r = b.el.getBoundingClientRect();
      b.el.style.left = Math.min(Math.max(12, r.left), vw() - r.width - 12) + 'px';
      b.el.style.top = Math.min(Math.max(12, r.top), vh() - r.height - 12) + 'px';
    });
  });

  $('#yes').addEventListener('click', function () { show('s-yes'); });

  // Confetti
  var cv = $('#confetti'), ctx = cv.getContext('2d');
  var colors = ['#F2A7B5', '#B8A5E8', '#F5F1EB', '#F2A7B5', '#B8A5E8'];
  function burst() {
    if (reduce) return;
    var dpr = window.devicePixelRatio || 1, W = vw(), H = vh();
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var parts = [];
    for (var i = 0; i < 110; i++) {
      parts.push({ x: W / 2, y: H * 0.5, vx: (Math.random() - 0.5) * 15, vy: -(Math.random() * 13 + 4), s: Math.random() * 6 + 4,
        r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: colors[i % colors.length], t: i % 3 });
    }
    var f = 0;
    (function tick() {
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.vy += 0.28; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (p.t === 0) ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        else if (p.t === 1) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 6.3); ctx.fill(); }
        else { ctx.font = p.s * 2 + 'px serif'; ctx.fillText('✦', -p.s, p.s / 2); }
        ctx.restore();
      });
      if (++f < 230) requestAnimationFrame(tick); else ctx.clearRect(0, 0, W, H);
    })();
  }
})();