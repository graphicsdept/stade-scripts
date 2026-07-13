/* ============================================================
   STADE — Custom Scripts
   https://stadeny.webflow.io
   v1.0.2

   Hosted externally via jsDelivr + GitHub.
   To update: push changes to GitHub, create a new release tag,
   update the version number in the Webflow <script> src.

   Scripts in order:
   1.  Mobile Nav Menu
   2.  Locations Clock
   3.  Homepage Hero (page-specific — keep in HP Page Settings)
   4.  Work Grid Filter + View
   5.  Gallery Horizontal Scroll
   6.  Video + Generic Cursor
   7.  Gallery More Info Overlay
   8.  Team Bio Hover
   9.  Contact Overlay
   10. Copy to Clipboard
   11. Page Transitions (always last)
   ============================================================ */


/* ============================================================
   1. MOBILE NAV MENU
   Reveals nav items as a staggered dropdown below the Menu btn
   Only activates on viewports <= 767px
   ============================================================ */
(function () {

  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () {

    if (window.innerWidth > 767) return;

    var trigger      = document.querySelector('.mobile-nav');
    var navPagelinks = document.querySelector('.nav-pagelinks');
    if (!trigger || !navPagelinks) return;

    var triggerText = trigger.querySelector('.btn_text') || trigger;
    var menuItems   = Array.from(navPagelinks.querySelectorAll('a.btn_primary:not(.mobile-nav)'));
    if (!menuItems.length) return;

    var EASING   = 'cubic-bezier(0.25, 0, 0.15, 1)';
    var DURATION = 300;
    var STAGGER  = 60;
    var isOpen   = false;
    var timers   = [];

    function clearTimers() {
      timers.forEach(function (t) { clearTimeout(t); });
      timers = [];
    }

    var dropdown = document.createElement('div');
    dropdown.id = 'mobile-nav-dropdown';
    dropdown.style.cssText = [
      'position:fixed', 'display:flex', 'flex-direction:column',
      'align-items:flex-end', 'gap:6px', 'pointer-events:none',
      'z-index:9990', 'visibility:hidden'
    ].join(';');
    document.body.appendChild(dropdown);

    function positionDropdown() {
      var r = trigger.getBoundingClientRect();
      dropdown.style.top   = (r.bottom + 8) + 'px';
      dropdown.style.right = (window.innerWidth - r.right) + 'px';
    }

    menuItems.forEach(function (item) {
      item.style.transition    = 'opacity ' + DURATION + 'ms ' + EASING + ', transform ' + DURATION + 'ms ' + EASING;
      item.style.opacity       = '0';
      item.style.transform     = 'translateY(-6px)';
      item.style.pointerEvents = 'none';
      item.style.display       = 'block';
      dropdown.appendChild(item);
    });

    function openMenu() {
      clearTimers();
      isOpen = true;
      triggerText.textContent      = 'Close';
      dropdown.style.visibility    = 'visible';
      dropdown.style.pointerEvents = 'auto';
      positionDropdown();
      menuItems.forEach(function (item, i) {
        timers.push(setTimeout(function () {
          item.style.opacity       = '1';
          item.style.transform     = 'translateY(0)';
          item.style.pointerEvents = 'auto';
        }, i * STAGGER));
      });
    }

    function closeMenu() {
      clearTimers();
      isOpen = false;
      triggerText.textContent      = 'Menu';
      dropdown.style.pointerEvents = 'none';
      menuItems.slice().reverse().forEach(function (item, i) {
        timers.push(setTimeout(function () {
          item.style.opacity       = '0';
          item.style.transform     = 'translateY(-6px)';
          item.style.pointerEvents = 'none';
        }, i * Math.round(STAGGER * 0.5)));
      });
      timers.push(setTimeout(function () {
        dropdown.style.visibility = 'hidden';
      }, menuItems.length * Math.round(STAGGER * 0.5) + DURATION));
    }

    var touchStarted = false;

    trigger.addEventListener('touchstart', function () {
      touchStarted = true;
    }, { passive: true });

    trigger.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      touchStarted = false;
      isOpen ? closeMenu() : openMenu();
    });

    trigger.addEventListener('click', function (e) {
      if (touchStarted) return;
      e.preventDefault();
      e.stopPropagation();
      isOpen ? closeMenu() : openMenu();
    });

    function isInsideMenu(el) {
      return trigger.contains(el) || dropdown.contains(el);
    }

    document.addEventListener('touchend', function (e) {
      if (isOpen && !isInsideMenu(e.target)) closeMenu();
    }, { passive: true });

    document.addEventListener('click', function (e) {
      if (isOpen && !isInsideMenu(e.target)) closeMenu();
    });

    window.addEventListener('resize', function () { if (isOpen) positionDropdown(); });

  });

})();


/* ============================================================
   2. LOCATIONS CLOCK
   Updates [data-timezone] elements every second
   with blinking colon animation
   ============================================================ */
(function () {

  var UPDATE_INTERVAL = 1000;
  var BLINK_SPEED     = '1s';

  var style = document.createElement('style');
  style.innerHTML = [
    '.nav-location_colon {',
    '  animation: colon-blink ' + BLINK_SPEED + ' step-start infinite;',
    '  display: inline-block;',
    '}',
    '@keyframes colon-blink {',
    '  0%, 100% { opacity: 1; }',
    '  50%       { opacity: 0; }',
    '}'
  ].join('');
  document.head.appendChild(style);

  function updateLocations() {
    document.querySelectorAll('[data-timezone]').forEach(function (el) {
      var tz        = el.getAttribute('data-timezone');
      var city      = el.getAttribute('data-city') || '';
      var formatted = new Date().toLocaleTimeString('en-US', {
        timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: false
      });
      var parts = formatted.split(':');
      el.innerHTML = city + ' ' + parts[0] + '<span class="nav-location_colon">:</span>' + parts[1];
    });
  }

  updateLocations();
  setInterval(updateLocations, UPDATE_INTERVAL);

})();


/* ============================================================
   3. HOMEPAGE HERO
   NOTE: This script is also kept in the Homepage
   Page Settings footer so it only runs on the homepage.
   If moving entirely here, ensure the Webflow page-specific
   version is removed to avoid duplicate execution.
   ============================================================ */
/* ============================================================
   3b. ADAPTIVE NAV — Pixel-sample background behind nav,
   switch nav + detail text between white and #111111.
   Works on all pages: homepage hero (Section 3 calls directly),
   case studies, galleries (vertical scroll + horizontal gallery scroll).
   ============================================================ */
(function () {

  var THRESHOLD = 128; // perceived luminance 0–255 — above = light bg → dark text
  var DURATION  = 500; // ms — color transition speed
  var SAMPLE_PX = 32;  // canvas sample size (downscaled)

  var nav = document.querySelector('.nav');
  if (!nav) return;

  // Inject transition + override styles once.
  // data-nav-theme="on-dark"  = dark content behind nav → force white text
  // data-nav-theme="on-light" = light content behind nav → force dark (#111) text
  // No attribute = Webflow CSS stays in control
  var s = document.createElement('style');
  s.textContent = [
    '.nav, .nav *, .work-title_details { transition: color ' + DURATION + 'ms ease; }',
    '.icon_circle { transition: background-color ' + DURATION + 'ms ease; }',
    '.nav .btn_primary { transition: color ' + DURATION + 'ms ease, background-color ' + DURATION + 'ms ease, border-color ' + DURATION + 'ms ease; }',
    // Contact overlay: transitions for all properties we switch
    '.nav-contact { transition: background-color ' + DURATION + 'ms ease, border-color ' + DURATION + 'ms ease, color ' + DURATION + 'ms ease; }',
    '.nav-contact .form_text-field { transition: border-color ' + DURATION + 'ms ease, color ' + DURATION + 'ms ease; }',
    '.nav-contact .submit { transition: background-color ' + DURATION + 'ms ease, border-color ' + DURATION + 'ms ease, color ' + DURATION + 'ms ease; }',
    // on-dark: nav
    'body[data-nav-theme="on-dark"] .nav, body[data-nav-theme="on-dark"] .nav * { color: #ffffff !important; }',
    'body[data-nav-theme="on-dark"] .nav .btn_primary { background-color: rgba(17,17,17,0.3) !important; border-color: rgba(255,255,255,0.3) !important; }',
    'body[data-nav-theme="on-dark"] .icon_circle { background-color: #ffffff !important; }',
    'body[data-nav-theme="on-dark"] .work-title_details { color: #ffffff !important; }',
    // on-dark: contact overlay — exact Webflow dark values (--stade_blk-50, --stade_white-30)
    'body[data-nav-theme="on-dark"] .nav-contact { background-color: #11111180 !important; border-color: #ffffff4d !important; }',
    'body[data-nav-theme="on-dark"] .nav-contact, body[data-nav-theme="on-dark"] .nav-contact * { color: #ffffff !important; }',
    'body[data-nav-theme="on-dark"] .nav-contact .form_text-field { color: #ffffff !important; border-color: #ffffff4d !important; }',
    'body[data-nav-theme="on-dark"] .nav-contact .form_text-field:hover, body[data-nav-theme="on-dark"] .nav-contact .form_text-field:focus { color: #ffffff !important; border-color: #ffffff !important; }',
    'body[data-nav-theme="on-dark"] .nav-contact .form_text-field::placeholder { color: #ffffff4d !important; }',
    'body[data-nav-theme="on-dark"] .nav-contact .submit { background-color: #11111180 !important; border-color: #ffffff4d !important; }',
    // on-light: nav
    'body[data-nav-theme="on-light"] .nav, body[data-nav-theme="on-light"] .nav * { color: #111111 !important; }',
    'body[data-nav-theme="on-light"] .nav .btn_primary { background-color: rgba(255,255,255,0.3) !important; border-color: rgba(17,17,17,0.3) !important; }',
    'body[data-nav-theme="on-light"] .icon_circle { background-color: #111111 !important; }',
    'body[data-nav-theme="on-light"] .work-title_details { color: #111111 !important; }',
    // on-light: contact overlay — exact Webflow light variant values (--stade_white, --stade_blk-50, --stade_blk-30)
    'body[data-nav-theme="on-light"] .nav-contact { background-color: #ffffff !important; border-color: #11111180 !important; }',
    'body[data-nav-theme="on-light"] .nav-contact, body[data-nav-theme="on-light"] .nav-contact * { color: #111111 !important; }',
    'body[data-nav-theme="on-light"] .nav-contact .form_text-field { color: #111111 !important; border-color: #1111114d !important; }',
    'body[data-nav-theme="on-light"] .nav-contact .form_text-field:hover, body[data-nav-theme="on-light"] .nav-contact .form_text-field:focus { color: #111111 !important; border-color: #111111 !important; }',
    'body[data-nav-theme="on-light"] .nav-contact .form_text-field::placeholder { color: #1111114d !important; }',
    'body[data-nav-theme="on-light"] .nav-contact .submit { background-color: #ffffff !important; border-color: #1111114d !important; }'
  ].join('\n');
  document.head.appendChild(s);

  // Cache per image src (CORS fetch is expensive — do it once per src)
  var cache = {};

  // Draw source into a fresh canvas and return average perceived luminance (0–255),
  // or null on CORS block. A new canvas per call prevents a cross-origin video draw
  // from permanently tainting a shared canvas and blocking all subsequent reads.
  function computeLuminance(source) {
    try {
      var c = document.createElement('canvas');
      c.width = c.height = SAMPLE_PX;
      var x = c.getContext('2d');
      x.drawImage(source, 0, 0, SAMPLE_PX, SAMPLE_PX);
      var d = x.getImageData(0, 0, SAMPLE_PX, SAMPLE_PX).data;
      var lum = 0;
      for (var i = 0; i < d.length; i += 4) lum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      return lum / (d.length / 4);
    } catch (e) { return null; }
  }

  // Apply theme: isLight=true → dark text (on-light), isLight=false → white text (on-dark)
  function applyTheme(isLight) {
    document.body.setAttribute('data-nav-theme', isLight ? 'on-light' : 'on-dark');
  }

  // Fetch image with CORS headers, compute luminance, cache result.
  // The cache-buster (?_c=1) forces a fresh CORS request, bypassing the browser's
  // non-CORS cached copy (which would taint the canvas and block getImageData).
  function sampleSrc(src, callback) {
    if (cache[src] !== undefined) { callback(cache[src]); return; }
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = function () { var l = computeLuminance(img); cache[src] = l; callback(l); };
    img.onerror = function () { cache[src] = null; callback(null); };
    img.src = src + (src.indexOf('?') === -1 ? '?_c=1' : '&_c=1');
  }

  // Public API — called by Section 3 (homepage hero) to sample a specific element on activation
  function sampleAndApply(elOrSrc) {
    if (!elOrSrc) return;
    if (typeof elOrSrc === 'string') {
      sampleSrc(elOrSrc, function (l) { if (l !== null) applyTheme(l > THRESHOLD); });
    } else if (elOrSrc.tagName === 'VIDEO') {
      var l = computeLuminance(elOrSrc);
      if (l !== null) { applyTheme(l > THRESHOLD); return; }
      var fallback = findFallbackImgForVideo(elOrSrc);
      if (fallback) sampleSrc(fallback.src, function (l2) { if (l2 !== null) applyTheme(l2 > THRESHOLD); });
    } else if (elOrSrc.tagName === 'IMG' && elOrSrc.src) {
      sampleSrc(elOrSrc.src, function (l) { if (l !== null) applyTheme(l > THRESHOLD); });
    }
  }

  // Find the best fallback image for a cross-origin video that can't be canvas-sampled.
  // Priority: 1) explicit .video-poster class, 2) any nearby img with real dimensions.
  // Walks up to 5 ancestor levels — picks up gallery siblings even if off-screen.
  function findFallbackImgForVideo(videoEl) {
    var p = videoEl.parentElement, lvl;
    // Pass 1: look for an explicit .video-poster
    for (lvl = 0; lvl < 5 && p && p !== document.body; lvl++) {
      var poster = p.querySelector('.video-poster[src]:not([src=""])');
      if (poster) return poster;
      p = p.parentElement;
    }
    // Pass 2: any img with real dimensions (gallery siblings, etc.)
    p = videoEl.parentElement;
    for (lvl = 0; lvl < 5 && p && p !== document.body; lvl++) {
      var imgs = p.querySelectorAll('img[src]:not([src=""])');
      for (var j = 0; j < imgs.length; j++) {
        if (nav.contains(imgs[j])) continue;
        var ir = imgs[j].getBoundingClientRect();
        if (ir.width > 0 && ir.height > 0) return imgs[j];
      }
      p = p.parentElement;
    }
    return null;
  }

  // Parse rgba/rgb background-color string → luminance (0–255), or null if transparent
  function bgColorLuminance(el) {
    var bg = window.getComputedStyle(el).backgroundColor;
    var m  = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
    if (!m) return null;
    var alpha = (m[4] !== undefined) ? parseFloat(m[4]) : 1;
    if (alpha < 0.1) return null;
    return 0.299 * parseInt(m[1]) + 0.587 * parseInt(m[2]) + 0.114 * parseInt(m[3]);
  }

  // Extract a URL from a CSS background-image value
  function parseBgImgSrc(el) {
    var bg = window.getComputedStyle(el).backgroundImage;
    if (!bg || bg === 'none') return null;
    var m = bg.match(/url\(["']?([^"')]+)["']?\)/);
    return m ? m[1] : null;
  }

  // When no <img>/<video> is found under the nav, check sections for:
  // 1) CSS background-image (sample it via CORS), 2) CSS background-color.
  // Calls callback(lum) where lum is luminance 0–255 or null.
  function checkBgFallback(navR, callback) {
    var midX = navR.left + navR.width  * 0.5;
    var midY = navR.top  + navR.height * 0.5;
    var els  = document.querySelectorAll('section, [class*="section_"], div[class*="hero"], main');
    for (var i = els.length - 1; i >= 0; i--) {
      if (nav.contains(els[i])) continue;
      var r = els[i].getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.top > midY || r.bottom < midY || r.left > midX || r.right < midX) continue;
      // CSS background-image
      var bgSrc = parseBgImgSrc(els[i]);
      if (bgSrc) { sampleSrc(bgSrc, callback); return; }
      // CSS background-color
      var lum = bgColorLuminance(els[i]);
      if (lum !== null) { callback(lum); return; }
    }
    callback(null); // nothing found
  }

  // Core check: use elementFromPoint at 3 x-positions just below the nav.
  // pointer-events:none on the nav lets the browser look straight through it.
  // Walks up from each found element to find the first img/video/bg-image/bg-color,
  // samples all unique sources, averages luminance, applies theme.
  function checkNavBackground() {
    var navR  = nav.getBoundingClientRect();
    // Sample just below the nav bottom. If nav reports no height (Webflow fixed-nav quirk),
    // fall back to 32px from the top of the viewport.
    var sampleY = (navR.bottom > 0) ? navR.bottom + 1 : 32;
    if (sampleY > window.innerHeight * 0.25) sampleY = 32;
    var vw    = window.innerWidth;
    var xPts  = [vw * 0.2, vw * 0.5, vw * 0.8];

    // Briefly remove pointer-events from nav so elementFromPoint sees through it
    var prevPE = nav.style.pointerEvents;
    nav.style.pointerEvents = 'none';
    var hits = xPts.map(function (x) { return document.elementFromPoint(x, sampleY); });
    nav.style.pointerEvents = prevPE;

    // Walk up from each hit to find a meaningful source; de-dup by key
    var seenKeys = {}, candidates = [];
    hits.forEach(function (hit) {
      var p = hit;
      while (p && p !== document.documentElement) {
        var key;
        if (p.tagName === 'IMG' && (p.currentSrc || p.src)) {
          key = 'img:' + (p.currentSrc || p.src);
          if (!seenKeys[key]) { seenKeys[key] = true; candidates.push({ type: 'img', el: p }); }
          return;
        }
        if (p.tagName === 'VIDEO') {
          key = 'vid:' + (p.src || p.currentSrc || candidates.length);
          if (!seenKeys[key]) { seenKeys[key] = true; candidates.push({ type: 'video', el: p }); }
          return;
        }
        var bgSrc = parseBgImgSrc(p);
        if (bgSrc) {
          key = 'bg:' + bgSrc;
          if (!seenKeys[key]) { seenKeys[key] = true; candidates.push({ type: 'bgimg', src: bgSrc }); }
          return;
        }
        var bgLum = bgColorLuminance(p);
        if (bgLum !== null) {
          key = 'bgcol:' + Math.round(bgLum);
          if (!seenKeys[key]) { seenKeys[key] = true; candidates.push({ type: 'bgcol', lum: bgLum }); }
          return;
        }
        p = p.parentElement;
      }
    });

    if (candidates.length === 0) { applyTheme(true); return; }

    var lumSum = 0, lumN = 0, pending = candidates.length;
    function onLum(lum) {
      if (lum !== null) { lumSum += lum; lumN++; }
      if (--pending === 0) applyTheme(lumN === 0 || (lumSum / lumN) > THRESHOLD);
    }

    candidates.forEach(function (c) {
      if (c.type === 'bgcol') { onLum(c.lum); return; }
      if (c.type === 'bgimg') { sampleSrc(c.src, onLum); return; }
      if (c.type === 'img')   { sampleSrc(c.el.currentSrc || c.el.src, onLum); return; }
      if (c.type === 'video') {
        var lum = computeLuminance(c.el);
        if (lum !== null) { onLum(lum); return; }
        // CORS-blocked video — 1) explicit data-nav-theme hint on [data-video] wrapper
        var wrap = c.el.closest ? c.el.closest('[data-nav-theme]') : null;
        // don't read body's own attribute — only element-level hints
        if (wrap && wrap !== document.body) {
          onLum(wrap.getAttribute('data-nav-theme') === 'dark' ? 0 : 255); return;
        }
        // 2) poster or nearby gallery image
        var fb = findFallbackImgForVideo(c.el);
        if (fb) { sampleSrc(fb.currentSrc || fb.src, onLum); return; }
        // 3) background-color of the video's container ancestors
        var vp = c.el.parentElement;
        while (vp && vp !== document.body) {
          var vbg = bgColorLuminance(vp);
          if (vbg !== null) { onLum(vbg); return; }
          vp = vp.parentElement;
        }
        onLum(null);
      }
    });
  }

  // Expose for Section 3 (homepage hero) and Section 5 (horizontal gallery scroll)
  window.stadeNavTheme = { sampleAndApply: sampleAndApply, applyTheme: applyTheme, check: checkNavBackground };

  // Throttled vertical scroll listener
  var rafPending = false;
  window.addEventListener('scroll', function () {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () { rafPending = false; checkNavBackground(); });
  }, { passive: true });

  // Initial check — skip homepage (Section 3 handles it via sampleAndApply on first activation)
  if (!document.querySelector('.section_home-hero')) {
    setTimeout(checkNavBackground, 500);
    window.addEventListener('load', function () { setTimeout(checkNavBackground, 100); });
  }

})();

window.Webflow = window.Webflow || [];
window.Webflow.push(function () {

  var BG_SPEED         = 800;
  var INTRO_BG_DELAY   = 300;
  var INTRO_NAV_DELAY  = 900;
  var INTRO_WORK_DELAY = 1400;
  var INTRO_FADE       = 700;
  var SWIPE_THRESHOLD  = 35;
  var EASING           = 'cubic-bezier(0.25, 0, 0.15, 1)';

  var isMobile = window.matchMedia('(max-width: 767px)').matches;

  var items   = Array.from(document.querySelectorAll('.cms-home-hero_list_item'));
  var bgWrap  = document.querySelector('.home-hero_bg');
  var navWrap = document.querySelector('.home-hero_nav');
  var siteNav = document.querySelector('.nav');
  var section = document.querySelector('.section_home-hero');
  var isHome  = document.body.classList.contains('page-home');

  if (!items.length || !bgWrap) return;

  if (isHome) {
    if (siteNav) { siteNav.style.opacity = '0'; siteNav.style.transform = 'translateY(-24px)'; }
    if (navWrap) { navWrap.style.opacity = '0'; navWrap.style.transform = 'translateY(24px)'; }
    if (bgWrap)  { bgWrap.style.opacity  = '0'; }
  }

  Array.from(bgWrap.children).forEach(function (el) { el.remove(); });

  var BASE = [
    'position:absolute', 'inset:0', 'width:100%', 'height:100%',
    'object-fit:cover', 'opacity:0', 'z-index:1',
    'transition:opacity ' + BG_SPEED + 'ms ease'
  ].join(';');

  var bgImg1 = document.createElement('img');
  bgImg1.className = 'bg-slot bg-slot-img1'; bgImg1.style.cssText = BASE;
  bgWrap.appendChild(bgImg1);

  var bgImg2 = document.createElement('img');
  bgImg2.className = 'bg-slot bg-slot-img2'; bgImg2.style.cssText = BASE;
  bgWrap.appendChild(bgImg2);

  var bgVid = document.createElement('video');
  bgVid.className   = 'bg-slot bg-slot-vid'; bgVid.style.cssText = BASE;
  bgVid.autoplay    = bgVid.muted = bgVid.loop = bgVid.playsInline = true;
  bgWrap.appendChild(bgVid);

  var bgImgActive    = bgImg1;
  var bgImgInactive  = bgImg2;
  var fadeTimer      = null;
  var switchToken    = 0;
  var pendingCanPlay = null;
  var pendingRaf     = null;

  function getThumbMedia(item) {
    return {
      vid: item.querySelector('.work-thumb video, .video_embed video, [data-video] video'),
      img: item.querySelector('.work-thumb img, .img_home-hero-thumb')
    };
  }

  var preloadItem = null;
  function preloadThumbVideo(item) {
    var media = getThumbMedia(item);
    if (!media.vid || !media.vid.src || preloadItem === item) return;
    preloadItem = item;
    if (bgVid.src !== media.vid.src) { bgVid.src = media.vid.src; bgVid.load(); }
  }

  function switchBg(item) {
    var media = getThumbMedia(item);
    if (fadeTimer)      { clearTimeout(fadeTimer);          fadeTimer      = null; }
    if (pendingRaf)     { cancelAnimationFrame(pendingRaf); pendingRaf     = null; }
    if (pendingCanPlay) { bgVid.removeEventListener('canplay', pendingCanPlay); pendingCanPlay = null; }

    var token = ++switchToken;

    if (media.vid && media.vid.src) {
      if (bgVid.src === media.vid.src && !bgVid.paused && parseFloat(bgVid.style.opacity) === 1) return;
      if (bgVid.src !== media.vid.src) { bgVid.src = media.vid.src; bgVid.load(); }
      bgVid.style.zIndex = '2';

      function doVideoSwap() {
        bgVid.removeEventListener('canplay', doVideoSwap);
        pendingCanPlay = null;
        if (token !== switchToken) return;
        bgVid.play().catch(function () {});
        bgImg1.style.opacity = bgImg2.style.opacity = '0';
        bgImg1.style.zIndex  = bgImg2.style.zIndex  = '1';
        bgVid.style.opacity  = '1';
      }

      if (bgVid.readyState >= 3) {
        doVideoSwap();
      } else {
        bgVid.style.opacity = '0';
        pendingCanPlay = doVideoSwap;
        bgVid.addEventListener('canplay', doVideoSwap);
        fadeTimer = setTimeout(function () {
          if (pendingCanPlay) { bgVid.removeEventListener('canplay', pendingCanPlay); pendingCanPlay = null; }
          if (token !== switchToken) return;
          doVideoSwap(); fadeTimer = null;
        }, 800);
      }

    } else if (media.img && media.img.src) {
      if (bgImgActive.src === media.img.src && parseFloat(bgImgActive.style.opacity) === 1 && lockedItem === item) return;
      bgVid.style.opacity = '0'; bgVid.style.zIndex = '1';

      var incoming = bgImgInactive, outgoing = bgImgActive;
      incoming.src = media.img.src;
      incoming.style.zIndex = '2'; incoming.style.transition = 'none'; incoming.style.opacity = '0';
      incoming.getBoundingClientRect();
      bgImgActive = incoming; bgImgInactive = outgoing;

      var rafToken = token;
      pendingRaf = requestAnimationFrame(function () {
        pendingRaf = requestAnimationFrame(function () {
          pendingRaf = null;
          if (rafToken !== switchToken) return;
          incoming.style.transition = 'opacity ' + BG_SPEED + 'ms ease';
          incoming.style.opacity    = '1';
          outgoing.style.opacity    = '0'; outgoing.style.zIndex = '1';
        });
      });
    }
  }

  function playThumbVideos() {
    items.forEach(function (item) {
      var vid = item.querySelector('video');
      if (!vid) return;
      vid.muted = vid.loop = vid.playsInline = true;
      var p = vid.play();
      if (p) p.then(function () {
        if (vid.paused) setTimeout(function () { vid.play().catch(function () {}); }, 100);
      }).catch(function () {
        var retry = function () {
          vid.play().catch(function () {});
          document.removeEventListener('touchstart', retry);
          document.removeEventListener('click',      retry);
          document.removeEventListener('mousemove',  retry);
        };
        document.addEventListener('touchstart', retry, { passive: true });
        document.addEventListener('click',      retry);
        document.addEventListener('mousemove',  retry);
      });
    });
  }

  var lockedItem = items[0], currentIndex = 0;

  function setActive(item) {
    items.forEach(function (i) { i.classList.remove('is-active'); });
    item.classList.add('is-active');
    switchBg(item);
  }

  function lockItem(item) {
    lockedItem = item; currentIndex = items.indexOf(item); setActive(item);
    // Auto-detect nav theme by sampling the hero background media.
    // Always prefer the image — cross-origin videos block canvas reads silently.
    // Image and video share the same visual content for a given CMS item.
    if (window.stadeNavTheme) {
      var media = getThumbMedia(item);
      if (media.img && media.img.src) {
        window.stadeNavTheme.sampleAndApply(media.img);
      } else if (media.vid) {
        window.stadeNavTheme.sampleAndApply(media.vid);
      }
    }
  }

  function navigateTo(item) {
    var url = item.getAttribute('data-url');
    if (!url) return;
    window.stadeNavigate ? window.stadeNavigate(url) : (window.location.href = url);
  }

  if (!isMobile) {
    items.forEach(function (item) {
      var thumb = item.querySelector('.home-hero_work-thumb') || item.querySelector('.work-thumb') || item;
      thumb.addEventListener('mouseenter', function () {
        preloadThumbVideo(item);
        if (lockedItem === item) return;
        lockItem(item);
      });
      item.addEventListener('click', function () { navigateTo(item); });
      var ve = item.querySelector('[data-video]');
      if (ve) ve.style.pointerEvents = 'none';
    });

    if (navWrap) navWrap.addEventListener('mouseleave', function (e) {
      if (section && section.contains(e.relatedTarget)) return;
      setActive(lockedItem);
    });
    if (bgWrap) bgWrap.addEventListener('click', function () { navigateTo(lockedItem); });
  }

  if (isMobile) {
    var tStartX = 0, tStartY = 0, swipeDir = null, didSwipe = false;

    function handleSwipe(dx, dy) {
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dy) > Math.abs(dx)) return false;
      var newIdx = dx < 0 ? Math.min(currentIndex + 1, items.length - 1) : Math.max(currentIndex - 1, 0);
      if (newIdx !== currentIndex) lockItem(items[newIdx]);
      return true;
    }

    function addSwipeListeners(el, onTap) {
      el.addEventListener('touchstart', function (e) {
        tStartX = e.touches[0].clientX; tStartY = e.touches[0].clientY;
        swipeDir = null; didSwipe = false;
      }, { passive: true });
      el.addEventListener('touchmove', function (e) {
        var dx = e.touches[0].clientX - tStartX, dy = e.touches[0].clientY - tStartY;
        if (!swipeDir && (Math.abs(dx) > 6 || Math.abs(dy) > 6))
          swipeDir = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
        if (swipeDir === 'h') didSwipe = true;
      }, { passive: true });
      el.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - tStartX, dy = e.changedTouches[0].clientY - tStartY;
        if (!handleSwipe(dx, dy) && !didSwipe && onTap) onTap(e);
      }, { passive: true });
    }

    if (navWrap) addSwipeListeners(navWrap, null);

    items.forEach(function (item) {
      item.addEventListener('touchend', function (e) {
        if (didSwipe) return;
        var dx = Math.abs(e.changedTouches[0].clientX - tStartX);
        var dy = Math.abs(e.changedTouches[0].clientY - tStartY);
        if (dx > 10 || dy > 10) return;
        item.classList.contains('is-active') ? navigateTo(item) : (e.preventDefault(), lockItem(item));
      });
    });

    if (section) addSwipeListeners(section, function (e) {
      if (!navWrap || !navWrap.contains(e.target)) navigateTo(lockedItem);
    });

    if (bgWrap) bgWrap.addEventListener('touchend', function (e) {
      if (!didSwipe) {
        var dx = Math.abs(e.changedTouches[0].clientX - tStartX);
        var dy = Math.abs(e.changedTouches[0].clientY - tStartY);
        if (dx < 10 && dy < 10) navigateTo(lockedItem);
      }
    }, { passive: true });
  }

  function reveal(el, delay) {
    if (!el) return;
    setTimeout(function () {
      el.style.transition = 'opacity ' + INTRO_FADE + 'ms ease, transform ' + INTRO_FADE + 'ms ease';
      el.getBoundingClientRect();
      el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    }, delay);
  }

  function runIntro() {
    setTimeout(function () {
      bgWrap.style.transition = 'opacity ' + BG_SPEED + 'ms ease';
      bgWrap.getBoundingClientRect();
      bgWrap.style.opacity = '1';
    }, INTRO_BG_DELAY);
    reveal(siteNav, INTRO_NAV_DELAY);
    reveal(navWrap, INTRO_WORK_DELAY);
    setTimeout(playThumbVideos, 100);
    function playOnce() {
      playThumbVideos();
      document.removeEventListener('mousemove',  playOnce);
      document.removeEventListener('touchstart', playOnce);
      document.removeEventListener('click',      playOnce);
    }
    document.addEventListener('mousemove',  playOnce);
    document.addEventListener('touchstart', playOnce, { passive: true });
    document.addEventListener('click',      playOnce);
    setTimeout(playThumbVideos, INTRO_WORK_DELAY + INTRO_FADE + 300);
  }

  lockItem(items[0]);
  var firstImg = items[0].querySelector('img');
  if (firstImg && firstImg.complete && firstImg.naturalWidth > 0) { runIntro(); }
  else if (firstImg) { firstImg.addEventListener('load', runIntro); firstImg.addEventListener('error', runIntro); }
  else { runIntro(); }

});


/* ============================================================
   4. WORK GRID — FILTER + VIEW
   Handles category/type filtering with stagger animations
   and small/medium/large view switching
   ============================================================ */
(function () {

  var FILTER_OUT_DURATION = 200;
  var FILTER_IN_DURATION  = 500;
  var FILTER_IN_STAGGER   = 55;
  var FILTER_IN_OFFSET    = '4px';
  var FILTER_PAUSE        = 80;
  var SCROLL_OFFSET       = '8px';
  var SCROLL_DURATION     = 500;
  var SCROLL_STAGGER      = 40;
  var SCROLL_THRESHOLD    = 0.15;
  var VIEW_DURATION       = 400;
  var EASING              = 'cubic-bezier(0.25, 0, 0.15, 1)';

  function normalize(str) {
    return (str || '').toLowerCase().trim().replace(/\s+/g, '-');
  }
  function splitAndNormalize(str) {
    return (str || '').split(/[\n,]/).map(function (s) { return normalize(s); }).filter(Boolean);
  }

  var filterEls = document.querySelectorAll('.text-filter');
  var gridList  = document.querySelector('.cms-work-grid_list');
  var countEl   = document.querySelector('[data-work-count]');
  var countWrap = countEl ? countEl.closest('[data-work-count-wrap]') : null;

  if (!filterEls.length || !gridList) return;

  var mq767 = window.matchMedia('(max-width: 767px)');

  // Disable Webflow CSS hover overlay on touch devices (avoids tap-to-hover flicker)
  var noHoverStyle = document.createElement('style');
  noHoverStyle.textContent = '@media (hover: none) { .cms-work-grid_list_item:hover .work-title_wrapper { opacity: 0 !important; pointer-events: none !important; } }';
  document.head.appendChild(noHoverStyle);

  var activeFilters = { category: 'all', type: 'all' };
  var activeView    = 'small';

  // Apply view class immediately to prevent flash before Webflow.push fires.
  // Skip on mobile — Webflow CSS controls responsive column layout.
  if (!mq767.matches) gridList.classList.add('view-' + activeView);
  var activeTimers  = [];

  // Column counts scale with viewport width.
  // >1180px  → S:8  M:4  L:2  (full desktop)
  // 992-1180 → S:6  M:3  L:2  (small laptop / narrow desktop)
  // 768-991  → S:4  M:2  L:1  (tablet landscape / large tablet)
  function getViewColumns() {
    var w = window.innerWidth;
    if (w <= 991)  return { small: 4, medium: 2, large: 1 };
    if (w <= 1180) return { small: 6, medium: 3, large: 2 };
    return { small: 8, medium: 4, large: 2 };
  }

  function makeTransition(dur) {
    return 'opacity ' + dur + 'ms ' + EASING + ', transform ' + dur + 'ms ' + EASING;
  }

  function cancelAnimations() {
    activeTimers.forEach(function (t) { clearTimeout(t); });
    activeTimers = [];
  }

  function addTimer(fn, delay) {
    var t = setTimeout(fn, delay);
    activeTimers.push(t);
    return t;
  }

  function itemMatchesFilters(item) {
    var cats  = splitAndNormalize(item.getAttribute('data-category') || '');
    var types = splitAndNormalize(item.getAttribute('data-type') || '');
    if (activeFilters.category !== 'all' && !cats.some(function (c) { return c === activeFilters.category; })) return false;
    if (activeFilters.type !== 'all'     && !types.some(function (t) { return t === activeFilters.type; }))     return false;
    return true;
  }

  function updateCount(visible, total) {
    if (!countEl) return;
    var filtered = activeFilters.category !== 'all' || activeFilters.type !== 'all';
    countEl.textContent = filtered ? visible : total;
    if (countWrap) countWrap.style.opacity = '1';
  }

  function applyView(view, instant) {
    var cols  = getViewColumns()[view];
    var items = Array.from(gridList.querySelectorAll('.cms-work-grid_list_item'));
    gridList.classList.remove('view-small', 'view-medium', 'view-large');
    gridList.classList.add('view-' + view);
    activeView = view;
    if (instant) {
      gridList.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
      return;
    }
    items.forEach(function (item) {
      if (item.style.display !== 'none') { item.style.transition = makeTransition(VIEW_DURATION / 2); item.style.opacity = '0'; }
    });
    setTimeout(function () {
      gridList.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
      items.forEach(function (item, i) {
        if (item.style.display !== 'none') setTimeout(function () {
          item.style.transition = makeTransition(VIEW_DURATION / 2); item.style.opacity = '1';
        }, i * 20);
      });
    }, VIEW_DURATION / 2);
  }

  function animateFilter() {
    cancelAnimations();
    var items  = Array.from(gridList.querySelectorAll('.cms-work-grid_list_item'));
    var toShow = items.filter(function (i) { return itemMatchesFilters(i); });
    var toHide = items.filter(function (i) { return !itemMatchesFilters(i); });
    toHide.forEach(function (item) {
      item.style.transition = makeTransition(FILTER_OUT_DURATION);
      item.style.opacity    = '0'; item.style.transform = 'translateY(4px)'; item.style.pointerEvents = 'none';
    });
    addTimer(function () {
      toHide.forEach(function (item) { item.style.display = 'none'; });
      toShow.forEach(function (item) {
        item.style.transition = 'none'; item.style.display = '';
        item.style.opacity    = '0'; item.style.transform = 'translateY(' + FILTER_IN_OFFSET + ')';
        item.style.pointerEvents = 'auto';
      });
      toShow.forEach(function (item, i) {
        addTimer(function () {
          item.style.transition = makeTransition(FILTER_IN_DURATION);
          item.getBoundingClientRect();
          item.style.opacity = '1'; item.style.transform = 'translateY(0)';
        }, i * FILTER_IN_STAGGER);
      });
      updateCount(toShow.length, items.length);
    }, FILTER_OUT_DURATION + FILTER_PAUSE);
  }

  var revealedItems = new Set();
  var scrollObserver = new IntersectionObserver(function (entries) {
    entries.filter(function (e) { return e.isIntersecting && !revealedItems.has(e.target); })
      .forEach(function (entry, i) {
        revealedItems.add(entry.target); scrollObserver.unobserve(entry.target);
        addTimer(function () {
          entry.target.style.transition = makeTransition(SCROLL_DURATION);
          entry.target.getBoundingClientRect();
          entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)';
        }, i * SCROLL_STAGGER);
      });
  }, { threshold: SCROLL_THRESHOLD, rootMargin: '0px 0px -40px 0px' });

  function initItems() {
    var items = Array.from(gridList.querySelectorAll('.cms-work-grid_list_item'));
    var vh    = window.innerHeight;
    items.forEach(function (item) {
      var rect   = item.getBoundingClientRect();
      var inView = rect.top < vh && rect.bottom > 0;
      item.style.transition = 'none';
      if (inView) {
        item.style.opacity   = '1';
        item.style.transform = 'none';
        revealedItems.add(item);
      } else {
        item.style.opacity   = '0';
        item.style.transform = 'translateY(' + SCROLL_OFFSET + ')';
      }
    });
    gridList.getBoundingClientRect();
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      items.forEach(function (item) {
        if (!revealedItems.has(item)) scrollObserver.observe(item);
      });
      updateCount(items.length, items.length);
    }); });
  }

  function updateSelected(el, filterType) {
    Array.from(filterEls).filter(function (f) { return f.getAttribute('data-filter-type') === filterType; })
      .forEach(function (f) { f.classList.remove('selected'); });
    el.classList.add('selected');
  }

  filterEls.forEach(function (el) {
    el.addEventListener('click', function () {
      var filterType  = el.getAttribute('data-filter-type');
      var filterValue = normalize(el.getAttribute('data-filter-value') || '');
      if (!filterType || !filterValue) return;
      if (filterType === 'view') { if (mq767.matches) return; applyView(filterValue); updateSelected(el, 'view'); return; }
      activeFilters[filterType] = filterValue;
      updateSelected(el, filterType);
      animateFilter();
    });
  });

  function setMobileViewState(isMobile) {
    Array.from(filterEls).forEach(function (f) {
      if (f.getAttribute('data-filter-type') === 'view') {
        f.style.display = isMobile ? 'none' : '';
      }
    });
    if (isMobile) {
      gridList.classList.remove('view-small', 'view-medium', 'view-large');
      gridList.style.gridTemplateColumns = '';
    }
  }

  mq767.addListener(function (e) { setMobileViewState(e.matches); });

  // Re-apply current view on resize so column counts stay correct when
  // crossing the 991px and 1180px breakpoints.
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!mq767.matches) applyView(activeView, true);
    }, 150);
  });

  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () {
    if (mq767.matches) {
      setMobileViewState(true);
    } else {
      applyView(activeView, true);
      var defaultViewEl = Array.from(filterEls).find(function (f) {
        return f.getAttribute('data-filter-type') === 'view' && normalize(f.getAttribute('data-filter-value') || '') === activeView;
      });
      if (defaultViewEl) updateSelected(defaultViewEl, 'view');
    }
    initItems();
  });

})();


/* ============================================================
   5. GALLERY HORIZONTAL SCROLL
   Drag + inertia, wheel/trackpad, custom cursor,
   entrance animation, scroll reset on navigate
   ============================================================ */
(function () {

  var list = document.querySelector('.cms-work_gallery-list');
  if (!list) return;

  var FRICTION        = 0.94;
  var MIN_VELOCITY    = 0.08;
  var DRAG_SPEED      = 1.0;
  var VELOCITY_SMOOTH = 4;
  var WHEEL_SPEED     = 1.2;
  var WHEEL_EASE      = 0.12;
  var ENTRANCE_DURATION = 600;
  var ENTRANCE_STAGGER  = 80;
  var ENTRANCE_DELAY    = 200;
  var EASING = 'cubic-bezier(0.25, 0, 0.15, 1)';

  window.addEventListener('pagehide', function () { list.scrollLeft = 0; });
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel')) return;
    list.scrollLeft = 0;
  });

  function runEntrance() {
    var items = Array.from(list.querySelectorAll('.cms-work_gallery-list_item'));
    items.forEach(function (item) { item.style.transition = 'none'; item.style.opacity = '0'; });
    list.getBoundingClientRect();
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      items.forEach(function (item, i) {
        setTimeout(function () {
          item.style.transition = 'opacity ' + ENTRANCE_DURATION + 'ms ' + EASING;
          item.style.opacity    = '1';
        }, ENTRANCE_DELAY + i * ENTRANCE_STAGGER);
      });
    }); });
  }

  var cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  document.body.appendChild(cursor);

  function setLabel(text) {
    cursor.innerHTML = text
      .replace(/←/g, '<span style="font-variant-emoji:text">&#x2190;</span>')
      .replace(/→/g, '<span style="font-variant-emoji:text">&#x2192;</span>');
  }
  function showCursor() { cursor.classList.add('is-visible'); list.style.cursor = 'none'; }
  function hideCursor()  { cursor.classList.remove('is-visible'); list.style.cursor = 'auto'; }
  function moveCursor(e) { cursor.style.transform = 'translate(calc(-50% + ' + e.clientX + 'px), calc(-50% + ' + e.clientY + 'px))'; }

  // Position-based: works regardless of pointer-events on child elements.
  function isOverVideo(e) {
    var x = e.clientX, y = e.clientY;
    var vids = list.querySelectorAll('[data-video]');
    for (var i = 0; i < vids.length; i++) {
      var r = vids[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
    }
    return false;
  }

  function getScrollState() {
    return {
      atStart: list.scrollLeft <= 2,
      atEnd:   list.scrollLeft >= list.scrollWidth - list.clientWidth - 2
    };
  }

  function updateCursorLabel(dragging) {
    if (dragging) { setLabel('Drag'); return; }
    var s = getScrollState();
    if (s.atStart && s.atEnd)   setLabel('Scroll');
    else if (s.atStart)         setLabel('Scroll \u00a0→');
    else if (s.atEnd)           setLabel('←\u00a0 Scroll');
    else                        setLabel('←\u00a0 Scroll \u00a0→');
  }

  var mouseX = -1, mouseY = -1;

  // Returns the [data-video] wrap under the cursor, or null.
  // Position-based so it works regardless of pointer-events on children
  // and regardless of whether gallery scroll has moved elements.
  function getVideoUnderCursor() {
    if (mouseX < 0) return null;
    var vids = list.querySelectorAll('[data-video]');
    for (var i = 0; i < vids.length; i++) {
      var r = vids[i].getBoundingClientRect();
      if (mouseX >= r.left && mouseX <= r.right && mouseY >= r.top && mouseY <= r.bottom) return vids[i];
    }
    return null;
  }

  // Single source of truth for cursor state.
  // Called on every mousemove and scroll — no flags, no state machine.
  function syncCursor() {
    var vw = getVideoUnderCursor();
    if (vw) {
      var vid = vw.querySelector('video');
      setLabel(vid && !vid.paused ? 'Pause' : 'Play');
      list.style.cursor = 'auto'; // video wrap already has cursor:none
    } else {
      updateCursorLabel(false);
      list.style.cursor = 'none';
    }
    cursor.classList.add('is-visible');
  }

  list.addEventListener('scroll',    function ()  {
    if (!isDragging) {
      if (mouseX >= 0) syncCursor(); else updateCursorLabel(false);
      // Keep nav theme in sync as horizontal images scroll under it
      if (window.stadeNavTheme) window.stadeNavTheme.check();
    }
  });
  list.addEventListener('mouseenter', function (e) { mouseX = e.clientX; mouseY = e.clientY; syncCursor(); });
  list.addEventListener('mouseleave', function ()  { mouseX = -1; mouseY = -1; hideCursor(); });
  list.addEventListener('mousemove',  function (e) { mouseX = e.clientX; mouseY = e.clientY; moveCursor(e); syncCursor(); });

  var wheelTarget = 0, wheelCurrent = 0, wheelRaf = null;

  function wheelLoop() {
    var diff = wheelTarget - wheelCurrent;
    wheelCurrent += diff * WHEEL_EASE;
    if (Math.abs(diff) < 0.5) { wheelCurrent = wheelTarget; list.scrollLeft = wheelCurrent; wheelRaf = null; updateCursorLabel(false); return; }
    list.scrollLeft = wheelCurrent;
    wheelRaf = requestAnimationFrame(wheelLoop);
  }

  list.addEventListener('wheel', function (e) {
    if (getVideoUnderCursor()) { wheelTarget = wheelCurrent = list.scrollLeft; return; }
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;
    e.preventDefault();
    if (!wheelRaf) wheelCurrent = list.scrollLeft;
    wheelTarget += e.deltaX * WHEEL_SPEED;
    wheelTarget = Math.max(0, Math.min(wheelTarget, list.scrollWidth - list.clientWidth));
    if (!wheelRaf) wheelRaf = requestAnimationFrame(wheelLoop);
  }, { passive: false });

  var isDragging = false, startX = 0, scrollStart = 0, lastX = 0;
  var rafId = null, didDrag = false, velBuffer = [], velX = 0;

  function safeReset() { isDragging = false; velBuffer = []; list.style.userSelect = ''; list.style.cursor = 'none'; }
  function pushVelocity(v) { velBuffer.push(v); if (velBuffer.length > VELOCITY_SMOOTH) velBuffer.shift(); }
  function getSmoothedVelocity() {
    if (!velBuffer.length) return 0;
    return velBuffer.reduce(function (a, b) { return a + b; }, 0) / velBuffer.length;
  }

  function inertiaLoop() {
    velX *= FRICTION;
    if (Math.abs(velX) < MIN_VELOCITY) { velX = 0; updateCursorLabel(false); return; }
    list.scrollLeft -= velX;
    rafId = requestAnimationFrame(inertiaLoop);
  }

  function onDragStart(e) {
    if (isOverVideo(e)) { didDrag = false; return; }
    if (rafId)    { cancelAnimationFrame(rafId);    rafId    = null; }
    if (wheelRaf) { cancelAnimationFrame(wheelRaf); wheelRaf = null; }
    isDragging  = true;
    startX      = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    scrollStart = list.scrollLeft; lastX = startX;
    velBuffer   = []; velX = 0; didDrag = false;
    list.style.userSelect = 'none'; list.style.scrollSnapType = 'none';
    updateCursorLabel(true);
  }

  function onDragMove(e) {
    if (!isDragging) return;
    if (e.type === 'mousemove') e.preventDefault();
    var clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    if (Math.abs(clientX - startX) > 5) didDrag = true;
    pushVelocity(clientX - lastX);
    lastX = clientX;
    list.scrollLeft = scrollStart - (clientX - startX) * DRAG_SPEED;
    wheelTarget = wheelCurrent = list.scrollLeft;
  }

  function onDragEnd(e) {
    if (!isDragging) return;
    var clientX = e && e.changedTouches ? e.changedTouches[0].clientX : (e ? e.clientX : lastX);
    pushVelocity(clientX - lastX);
    safeReset();
    velX = getSmoothedVelocity();
    if (Math.abs(velX) > MIN_VELOCITY) { rafId = requestAnimationFrame(inertiaLoop); }
    else { updateCursorLabel(false); }
  }

  list.addEventListener('mousedown', onDragStart);
  list.addEventListener('mousemove', function (e) { if (isDragging) onDragMove(e); });
  window.addEventListener('mouseup', onDragEnd);
  document.addEventListener('visibilitychange', function () { if (document.hidden && isDragging) safeReset(); });
  window.addEventListener('blur', function () { if (isDragging) safeReset(); });
  list.addEventListener('click', function (e) { if (didDrag) { e.preventDefault(); e.stopPropagation(); didDrag = false; } }, true);
  list.addEventListener('touchstart', onDragStart, { passive: true });
  list.addEventListener('touchmove',  onDragMove,  { passive: false });
  list.addEventListener('touchend',   onDragEnd);
  list.querySelectorAll('img').forEach(function (img) { img.addEventListener('dragstart', function (e) { e.preventDefault(); }); });

  updateCursorLabel(false);
  runEntrance();

  // Expose syncCursor so Section 6 can immediately refresh the label after play/pause
  window.stadeGallery = { syncCursor: syncCursor };

})();


/* ============================================================
   6. VIDEO PLAYER + GENERIC HOVER CURSOR
   Handles [data-video] elements (passive, autoplay, click, hover)
   Volume slider for audible videos
   Generic [data-cursor] hover labels
   Idle timer fades cursor after inactivity
   ============================================================ */
(function () {

  var FADE_DURATION  = 400;
  var EASING         = 'cubic-bezier(0.25, 0, 0.15, 1)';
  var SLIDER_PADDING = '20px';
  var SLIDER_HIT_PAD = '16px';
  var IDLE_DELAY     = 2000;

  var cursor = document.querySelector('.custom-cursor');
  if (!cursor) { cursor = document.createElement('div'); cursor.className = 'custom-cursor'; document.body.appendChild(cursor); }

  var cursorOwner = null, idleTimer = null;

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    cursor.classList.remove('is-idle');
    Array.from(document.querySelectorAll('.video-volume[data-hovered="true"]')).forEach(function (v) {
      v.style.opacity = '1'; v.style.pointerEvents = 'auto';
    });
    idleTimer = setTimeout(function () {
      if (cursor.classList.contains('is-visible')) cursor.classList.add('is-idle');
      Array.from(document.querySelectorAll('.video-volume')).forEach(function (v) {
        v.style.opacity = '0'; v.style.pointerEvents = 'none';
      });
    }, IDLE_DELAY);
  }

  document.addEventListener('mousemove', function (e) {
    cursor.style.transform = 'translate(calc(-50% + ' + e.clientX + 'px), calc(-50% + ' + e.clientY + 'px))';
    resetIdleTimer();
  });

  function showCursor(owner) { cursorOwner = owner; cursor.classList.add('is-visible'); cursor.classList.remove('is-idle'); }
  function hideCursor(owner) {
    if (cursorOwner === owner) { cursor.classList.remove('is-visible'); cursor.classList.remove('is-idle'); cursorOwner = null; }
  }
  function setCursorLabel(text) { cursor.textContent = text; }

  function buildVolumeSlider(wrap, video) {
    var slider = document.createElement('div');
    slider.className = 'video-volume'; slider.dataset.hovered = 'false';
    slider.style.cssText = ['position:absolute','bottom:'+SLIDER_PADDING,'right:'+SLIDER_PADDING,'z-index:10','display:flex','flex-direction:column','align-items:center','gap:8px','opacity:0','transition:opacity 300ms '+EASING,'pointer-events:none'].join(';');
    var lbl = document.createElement('span');
    lbl.textContent = 'Vol';
    lbl.style.cssText = 'font-size:0.65rem;letter-spacing:0.1em;text-transform:uppercase;color:#fff;font-family:inherit;line-height:1;text-shadow:0 1px 4px rgba(0,0,0,0.5)';
    var hitArea = document.createElement('div');
    hitArea.style.cssText = 'position:relative;padding:0 '+SLIDER_HIT_PAD+';cursor:ns-resize;height:70px;display:flex;align-items:stretch';
    var track = document.createElement('div');
    track.style.cssText = 'width:2px;height:100%;background:rgba(255,255,255,0.2);border-radius:1px;position:relative;flex-shrink:0';
    var fill = document.createElement('div');
    fill.style.cssText = 'position:absolute;bottom:0;left:0;width:100%;background:#fff;border-radius:1px;transition:height 60ms ease;height:100%';
    var handle = document.createElement('div');
    handle.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);width:6px;height:6px;background:#fff;border-radius:50%;bottom:calc(100% - 3px);transition:bottom 60ms ease;box-shadow:0 1px 4px rgba(0,0,0,0.4)';
    track.appendChild(fill); track.appendChild(handle);
    hitArea.appendChild(track); slider.appendChild(lbl); slider.appendChild(hitArea); wrap.appendChild(slider);
    var isDragging = false;
    function updateVolume(y) {
      var rect = track.getBoundingClientRect();
      var pct  = 1 - Math.max(0, Math.min(1, (y - rect.top) / rect.height));
      video.volume = pct; fill.style.height = (pct * 100) + '%'; handle.style.bottom = 'calc(' + (pct * 100) + '% - 3px)';
    }
    hitArea.addEventListener('mousedown', function (e) { e.stopPropagation(); isDragging = true; updateVolume(e.clientY); });
    document.addEventListener('mousemove', function (e) { if (isDragging) updateVolume(e.clientY); });
    document.addEventListener('mouseup',   function () { isDragging = false; });
    hitArea.addEventListener('click',      function (e) { e.stopPropagation(); updateVolume(e.clientY); });
    hitArea.addEventListener('mouseenter', function () { setCursorLabel('Drag'); });
    hitArea.addEventListener('mouseleave', function () { setCursorLabel(!video.paused ? 'Pause' : 'Play'); });
    return slider;
  }

  var allPauseFns = [];

  Array.from(document.querySelectorAll('[data-video]')).forEach(function (wrap) {
    var video = wrap.querySelector('video');
    if (!video) return;
    var mode      = wrap.getAttribute('data-video') || 'click';
    var passive   = wrap.hasAttribute('data-passive');
    var autoplay  = wrap.hasAttribute('data-autoplay');
    // Gallery videos: Section 5 owns the cursor entirely (syncCursor reads video.paused
    // on every mousemove/scroll). Skip all cursor management here to avoid conflicts.
    var inGallery = !!wrap.closest('.cms-work_gallery-list');
    if (autoplay || passive || mode === 'hover') video.muted = true;
    var isPlaying = false, hasAudio = !video.muted;
    if (!passive) {
      wrap.style.cursor = 'none';
      if (!inGallery) wrap.setAttribute('data-cursor-exclude', '');
    }
    // Poster may be a sibling of wrap (e.g. .fullwidth-video_placeholder outside .video_embed)
    // so search the parent container too.
    var posterEl = wrap.querySelector('.video-poster') ||
                   (wrap.parentElement && wrap.parentElement.querySelector('.video-poster'));
    if (posterEl) posterEl.style.cssText += ';position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2;pointer-events:none;transition:opacity '+FADE_DURATION+'ms '+EASING;
    var volSlider = hasAudio ? buildVolumeSlider(wrap, video) : null;
    function play() {
      allPauseFns.forEach(function (fn) { if (fn !== pause) fn(); });
      video.play().then(function () {
        isPlaying = true; wrap.classList.add('is-playing');
        if (!passive && !inGallery) setCursorLabel('Pause');
        if (inGallery && window.stadeGallery) window.stadeGallery.syncCursor();
        if (posterEl) posterEl.style.opacity = '0';
      }).catch(function () {});
    }
    function pause() {
      video.pause(); isPlaying = false; wrap.classList.remove('is-playing');
      if (!passive && !inGallery) setCursorLabel('Play');
      if (inGallery && window.stadeGallery) window.stadeGallery.syncCursor();
      if (posterEl) posterEl.style.opacity = '1';
    }
    allPauseFns.push(pause);
    if (!passive) {
      if (!inGallery) {
        // Non-gallery: Section 6 manages the cursor label and visibility.
        wrap.addEventListener('mouseenter', function () {
          setCursorLabel(isPlaying ? 'Pause' : 'Play'); showCursor(wrap);
          if (volSlider) { volSlider.style.opacity = '1'; volSlider.style.pointerEvents = 'auto'; volSlider.dataset.hovered = 'true'; }
        });
        wrap.addEventListener('mouseleave', function () {
          hideCursor(wrap);
          if (volSlider) { volSlider.style.opacity = '0'; volSlider.style.pointerEvents = 'none'; volSlider.dataset.hovered = 'false'; }
        });
      }
      if (mode === 'hover') {
        wrap.addEventListener('mouseenter', function () { play(); });
        wrap.addEventListener('mouseleave', function () { pause(); });
      } else {
        wrap.addEventListener('click', function () { isPlaying ? pause() : play(); });
      }
      var playIcon = document.createElement('div');
      playIcon.className = 'video-play-icon'; wrap.appendChild(playIcon);
    }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { if (autoplay) setTimeout(function () { play(); }, 100); }
        else { if (isPlaying) pause(); }
      });
    }, { threshold: 0.1 }).observe(wrap);
  });

  Array.from(document.querySelectorAll('[data-cursor]')).forEach(function (el) {
    var label  = el.getAttribute('data-cursor') || '';
    var link   = el.getAttribute('data-cursor-link') || '';
    var isHero = el.hasAttribute('data-cursor-hero');
    var lazy   = el.hasAttribute('data-cursor-lazy');
    el.style.cursor = 'none';
    var hasEnteredOnce = false;
    el.addEventListener('mouseenter', function () {
      cursorOwner = el; setCursorLabel(label);
      if (lazy && !hasEnteredOnce) { cursor.classList.remove('is-visible'); } else { showCursor(el); }
    });
    el.addEventListener('mousemove', function () {
      if (lazy && !hasEnteredOnce) {
        // Don't activate if a child element (e.g. a video) already owns the cursor —
        // mousemove bubbles, so this fires even while over nested interactive elements.
        if (cursorOwner && cursorOwner !== el && el.contains(cursorOwner)) return;
        hasEnteredOnce = true; showCursor(el);
      }
    });
    el.addEventListener('mouseleave', function () { hideCursor(el); });
    el.addEventListener('click', function () {
      if (isHero) {
        var active = document.querySelector('.cms-home-hero_list_item.is-active');
        if (active) { var url = active.getAttribute('data-url'); if (url) window.stadeNavigate ? window.stadeNavigate(url) : (window.location.href = url); }
        return;
      }
      if (link) window.stadeNavigate ? window.stadeNavigate(link) : (window.location.href = link);
    });
    Array.from(el.querySelectorAll('[data-cursor-exclude]')).forEach(function (excl) {
      excl.addEventListener('mouseenter', function () { hideCursor(el); });
      excl.addEventListener('mouseleave', function () { setCursorLabel(label); showCursor(el); });
    });
  });

})();


/* ============================================================
   7. GALLERY MORE INFO OVERLAY
   Toggles .overlay_more-info on .link_more-info click
   with staggered grid column reveal
   ============================================================ */
(function () {

  var overlay = document.querySelector('.overlay_more-info');
  var trigger = document.querySelector('.link_more-info');
  if (!overlay || !trigger) return;

  var OVERLAY_DURATION = 300;
  var CONTENT_STAGGER  = 60;
  var CONTENT_DURATION = 400;
  var CONTENT_DELAY    = 100;
  var EASING = 'cubic-bezier(0.25, 0, 0.15, 1)';

  var isOpen     = false;
  var contentEls = Array.from(overlay.querySelectorAll('.grid_column'));

  function openOverlay() {
    isOpen = true; trigger.textContent = 'Less Info −';
    contentEls.forEach(function (el) { el.style.transition = 'none'; el.style.opacity = '0'; });
    overlay.style.transition = 'opacity ' + OVERLAY_DURATION + 'ms ' + EASING;
    overlay.style.opacity    = '0'; overlay.style.display = 'block';
    overlay.getBoundingClientRect();
    overlay.style.opacity = '1';
    setTimeout(function () {
      contentEls.forEach(function (el, i) {
        setTimeout(function () {
          el.style.transition = 'opacity ' + CONTENT_DURATION + 'ms ' + EASING; el.style.opacity = '1';
        }, i * CONTENT_STAGGER);
      });
    }, CONTENT_DELAY);
  }

  function closeOverlay() {
    isOpen = false; trigger.textContent = 'More Info +';
    overlay.style.transition = 'opacity ' + OVERLAY_DURATION + 'ms ' + EASING; overlay.style.opacity = '0';
    setTimeout(function () { overlay.style.display = 'none'; }, OVERLAY_DURATION);
  }

  trigger.addEventListener('click', function () { isOpen ? closeOverlay() : openOverlay(); });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay(); });

})();


/* ============================================================
   8. TEAM BIO HOVER
   Above 767px: bios hidden by default, revealed on name hover.
   767px and below: JS does nothing — CSS controls layout entirely.
   Portrait revert: swap trigger to the .team-member_wrapper element.
   ============================================================ */
(function () {

  var EASING   = 'cubic-bezier(0.25, 0, 0.15, 1)';
  var DURATION = 300;
  var mq       = window.matchMedia('(max-width: 767px)');
  var inited   = false;
  var allBios  = [];

  function applyDesktop() {
    // Kill transition first so the opacity:0 is instantaneous — no visible flash
    // when crossing back up from mobile. Restore transition on the next paint
    // so hover fades work normally from that point on.
    allBios.forEach(function (bio) {
      bio.style.transition    = 'none';
      bio.style.opacity       = '0';
      bio.style.pointerEvents = 'none';
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        allBios.forEach(function (bio) {
          bio.style.transition = 'opacity ' + DURATION + 'ms ' + EASING;
        });
      });
    });
  }

  function applyMobile() {
    allBios.forEach(function (bio) {
      bio.style.opacity       = '1';
      bio.style.pointerEvents = 'auto';
      bio.style.transition    = '';
    });
  }

  function init() {
    if (inited) return;

    var bios = Array.from(document.querySelectorAll('.team_bio-info'));
    if (!bios.length) return;
    inited  = true;
    allBios = bios;

    bios.forEach(function (bio) {
      // Walk up to the per-person wrapper to scope the name query correctly.
      // Portrait revert: replace walk-up with member = closest('.team-member_wrapper').
      var wrapper = bio.parentElement;
      while (wrapper && !wrapper.classList.contains('roster-list_item_wrapper')) {
        wrapper = wrapper.parentElement;
      }
      if (!wrapper) return;

      var nameEl  = wrapper.querySelector('.roster-list_name');
      // Portrait trigger (re-enable when thumbnails are ready — swap to: var trigger = wrapper):
      var trigger = nameEl || wrapper;
      trigger.style.cursor     = 'default';
      trigger.style.userSelect = 'none';

      // Listeners always attached; mq.matches checked live so resize is handled automatically.
      trigger.addEventListener('mouseenter', function () {
        if (mq.matches) return;
        bios.forEach(function (b) { b.style.opacity = '0'; b.style.pointerEvents = 'none'; });
        bio.style.opacity = '1'; bio.style.pointerEvents = 'auto';
        wrapper.classList.add('is-active');
      });
      wrapper.addEventListener('mouseleave', function () {
        if (mq.matches) return;
        bio.style.opacity = '0'; bio.style.pointerEvents = 'none';
        wrapper.classList.remove('is-active');
      });
    });

    // Apply correct initial state and respond to breakpoint crossings on resize.
    mq.matches ? applyMobile() : applyDesktop();
    var mqHandler = function (e) { e.matches ? applyMobile() : applyDesktop(); };
    if (mq.addEventListener) { mq.addEventListener('change', mqHandler); }
    else if (mq.addListener) { mq.addListener(mqHandler); } // Safari < 14
  }

  var attempts = 0;
  function tryInit() {
    if (document.querySelectorAll('.team_bio-info').length) { init(); }
    else if (attempts++ < 20) { setTimeout(tryInit, 150); }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', tryInit); }
  else { tryInit(); }
  window.Webflow = window.Webflow || []; window.Webflow.push(tryInit);

})();


/* ============================================================
   9. CONTACT OVERLAY
   Opens/closes nav-contact overlay with staggered form reveal
   Add data-contact-trigger to Contact nav button
   Add data-contact-overlay to the nav-contact div
   Mobile: fixed bottom-right panel with dim backdrop.
   Desktop: nav-integrated overlay.
   ============================================================ */
(function () {

  var EASING   = 'cubic-bezier(0.25, 0, 0.15, 1)';
  var DURATION = 400;
  var STAGGER  = 60;

  var trigger = document.querySelector('[data-contact-trigger]');
  var overlay = document.querySelector('[data-contact-overlay]');
  if (!trigger || !overlay) return;

  var mq767              = window.matchMedia('(max-width: 767px)');
  var isOpen             = false;
  var timers             = [];
  var backdrop           = null;
  var overlayOrigParent  = null;
  var overlayOrigSibling = null;

  var formContent = overlay.querySelector('.form_contact-content');
  var staggerEls  = formContent ? Array.from(formContent.children) : [];

  function clearTimers() { timers.forEach(function (t) { clearTimeout(t); }); timers = []; }

  /* ── Backdrop (mobile only) ── */
  function showBackdrop() {
    if (backdrop) return;
    backdrop = document.createElement('div');
    backdrop.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:999',
      'background:rgba(0,0,0,0.5)',
      'opacity:0',
      'transition:opacity ' + DURATION + 'ms ' + EASING
    ].join(';');
    backdrop.addEventListener('click', closeContact);
    backdrop.addEventListener('touchend', function (e) { e.preventDefault(); closeContact(); });
    document.body.appendChild(backdrop);
    backdrop.getBoundingClientRect();
    backdrop.style.opacity = '1';
  }

  function hideBackdrop() {
    if (!backdrop) return;
    var b = backdrop; backdrop = null;
    b.style.opacity = '0';
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, DURATION);
  }

  /* ── Dim/restore non-trigger nav items (mobile only) ── */
  function setNavDim(dim) {
    var dropdown = document.getElementById('mobile-nav-dropdown');
    if (!dropdown) return;
    Array.from(dropdown.querySelectorAll('a, button')).forEach(function (item) {
      if (item === trigger || item.contains(trigger) || trigger.contains(item)) return;
      item.style.transition = 'opacity ' + DURATION + 'ms ' + EASING;
      item.style.opacity    = dim ? '0.2' : '';
    });
  }

  function openContact() {
    isOpen = true; clearTimers();
    var triggerText = trigger.querySelector('.btn_text') || trigger;
    triggerText.textContent = 'Close';

    if (mq767.matches) {
      // Dim sibling nav items so trigger is the only clear action
      setNavDim(true);
      // Lift overlay out of nav into body — escapes any nav stacking context
      // so it always sits above the backdrop regardless of nav z-index
      overlayOrigParent  = overlay.parentNode;
      overlayOrigSibling = overlay.nextSibling;
      document.body.appendChild(overlay);
      // Bottom-right corner, 0.5rem from edges — consistent with mobile margins
      overlay.style.position = 'fixed';
      overlay.style.bottom   = '0.5rem';
      overlay.style.right    = '0.5rem';
      overlay.style.left     = 'auto';
      overlay.style.top      = 'auto';
      overlay.style.zIndex   = '1000';
      showBackdrop();
    } else {
      var mobileDropdown = document.getElementById('mobile-nav-dropdown');
      if (mobileDropdown) mobileDropdown.style.visibility = 'hidden';
    }

    // Preset children to start state BEFORE reflow so layout is stable on first paint
    staggerEls.forEach(function (el) {
      el.style.transition = 'none'; el.style.opacity = '0'; el.style.transform = 'translateY(8px)';
    });

    overlay.style.display       = 'flex';
    overlay.style.pointerEvents = 'auto';
    overlay.getBoundingClientRect();
    overlay.style.transition = 'opacity ' + DURATION + 'ms ' + EASING;
    overlay.style.opacity    = '1';
    staggerEls.forEach(function (el, i) {
      timers.push(setTimeout(function () {
        el.style.transition = 'opacity ' + DURATION + 'ms ' + EASING + ', transform ' + DURATION + 'ms ' + EASING;
        el.style.opacity = '1'; el.style.transform = 'translateY(0)';
      }, DURATION * 0.5 + i * STAGGER));
    });
  }

  function closeContact() {
    isOpen = false; clearTimers();
    var triggerText = trigger.querySelector('.btn_text') || trigger;
    triggerText.textContent = 'Contact';

    if (mq767.matches) {
      setNavDim(false);
      hideBackdrop();
      overlay.style.position = '';
      overlay.style.bottom   = '';
      overlay.style.right    = '';
      overlay.style.left     = '';
      overlay.style.top      = '';
      overlay.style.zIndex   = '';
    } else {
      var mobileDropdown = document.getElementById('mobile-nav-dropdown');
      if (mobileDropdown) mobileDropdown.style.visibility = '';
    }

    overlay.style.transition    = 'opacity ' + DURATION + 'ms ' + EASING;
    overlay.style.opacity       = '0';
    overlay.style.pointerEvents = 'none';

    timers.push(setTimeout(function () {
      overlay.style.display = 'none';
      // Return overlay to its original nav position
      if (overlayOrigParent) {
        overlayOrigParent.insertBefore(overlay, overlayOrigSibling);
        overlayOrigParent  = null;
        overlayOrigSibling = null;
      }
    }, DURATION));

    var cursor = document.querySelector('.custom-cursor');
    if (cursor) { cursor.classList.remove('is-visible'); cursor.textContent = ''; }
  }

  overlay.style.opacity = '0'; overlay.style.display = 'none'; overlay.style.pointerEvents = 'none';

  trigger.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); isOpen ? closeContact() : openContact(); });

  trigger.addEventListener('touchend', function (e) {
    e.preventDefault(); e.stopPropagation();
    isOpen ? closeContact() : openContact();
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) closeContact(); });

  // Desktop only — nav links pass through, everything else outside overlay closes + blocks.
  var navLinks = Array.from(document.querySelectorAll('.nav-logo, .nav-pagelinks'));
  function inNavLinks(el) { return navLinks.some(function (n) { return n.contains(el); }); }

  document.addEventListener('click', function (e) {
    if (!isOpen || mq767.matches) return;
    if (overlay.contains(e.target) || trigger.contains(e.target)) return;
    if (!inNavLinks(e.target)) { e.preventDefault(); e.stopPropagation(); }
    closeContact();
  }, true);

  var cursor = document.querySelector('.custom-cursor');
  if (cursor) {
    document.addEventListener('mousemove', function (e) {
      if (!isOpen || mq767.matches) return;
      var showClose = !overlay.contains(e.target) && !inNavLinks(e.target);
      cursor.textContent = showClose ? 'Close' : '';
      if (showClose) { cursor.classList.add('is-visible'); cursor.classList.remove('is-idle'); }
      else           { cursor.classList.remove('is-visible'); }
    });
  }

  window.stadeContact = { open: openContact, close: closeContact };

})();


/* ============================================================
   10. COPY TO CLIPBOARD
   Add data-copy to any element to enable copy-on-click
   Cursor shows 'Copy' on hover, 'Copied' for 2s after click
   Optional: data-copy-text="exact string" to override copy content
   ============================================================ */
(function () {

  var RESET_DELAY = 2000;

  var cursor  = document.querySelector('.custom-cursor');
  if (!cursor) return;

  var copyEls = Array.from(document.querySelectorAll('[data-copy]'));
  if (!copyEls.length) return;

  copyEls.forEach(function (el) {
    el.style.cursor = 'none';

    el.addEventListener('mouseenter', function () {
      cursor.textContent = 'Copy';
      cursor.classList.add('is-visible');
      cursor.classList.remove('is-idle');
    });

    el.addEventListener('mouseleave', function () {
      cursor.classList.remove('is-visible');
    });

    el.addEventListener('click', function (e) {
      e.stopPropagation();
      var text = el.getAttribute('data-copy-text') || el.textContent.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(confirmCopy).catch(function () { fallbackCopy(text); confirmCopy(); });
      } else { fallbackCopy(text); confirmCopy(); }
    });

    function confirmCopy() {
      cursor.textContent = 'Copied';
      setTimeout(function () { if (cursor.classList.contains('is-visible')) cursor.textContent = 'Copy'; }, RESET_DELAY);
    }

    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }
  });

})();


/* ============================================================
   11. FOOTER BG ZONES
   Divides footer width into 5 zones; crossfades to the CMS
   thumb image associated with each zone on mousemove.
   Mouse leave fades out completely, revealing the default bg.
   Requires: [data-footer-bg] on section, [data-footer-bg-wrap]
   on an absolute inner div, .cms-footer-item on each hidden
   CMS list item containing a bound <img>.
   Desktop only.
   ============================================================ */
(function () {

  var ZONES      = 5;
  var FADE_SPEED = 600;
  var EASING     = 'cubic-bezier(0.25, 0, 0.15, 1)';

  if (window.matchMedia('(max-width: 767px)').matches) return;

  var section = document.querySelector('[data-footer-bg]');
  if (!section) return;

  var bgWrap = section.querySelector('[data-footer-bg-wrap]');
  if (!bgWrap) return;

  var items = Array.from(section.querySelectorAll('.cms-footer-item'));
  if (!items.length) return;

  var BASE = [
    'position:absolute', 'inset:0', 'width:100%', 'height:100%',
    'object-fit:cover', 'opacity:0', 'z-index:1',
    'transition:opacity ' + FADE_SPEED + 'ms ' + EASING
  ].join(';');

  var slot1 = document.createElement('img'); slot1.style.cssText = BASE;
  var slot2 = document.createElement('img'); slot2.style.cssText = BASE;
  bgWrap.appendChild(slot1);
  bgWrap.appendChild(slot2);

  var activeSlot   = slot1;
  var inactiveSlot = slot2;
  var currentZone  = -1;
  var pendingRaf   = null;
  var switchToken  = 0;

  function crossfadeTo(src) {
    if (!src) return;
    if (activeSlot.src === src && parseFloat(activeSlot.style.opacity) === 1) return;

    var token    = ++switchToken;
    var incoming = inactiveSlot;
    var outgoing  = activeSlot;

    incoming.src              = src;
    incoming.style.zIndex     = '2';
    incoming.style.transition = 'none';
    incoming.style.opacity    = '0';
    incoming.getBoundingClientRect();

    activeSlot   = incoming;
    inactiveSlot = outgoing;

    if (pendingRaf) { cancelAnimationFrame(pendingRaf); pendingRaf = null; }
    pendingRaf = requestAnimationFrame(function () {
      pendingRaf = requestAnimationFrame(function () {
        pendingRaf = null;
        if (token !== switchToken) return;
        incoming.style.transition = 'opacity ' + FADE_SPEED + 'ms ' + EASING;
        incoming.style.opacity    = '1';
        outgoing.style.opacity    = '0';
        outgoing.style.zIndex     = '1';
      });
    });
  }

  function fadeOut() {
    var token = ++switchToken;
    if (pendingRaf) { cancelAnimationFrame(pendingRaf); pendingRaf = null; }
    pendingRaf = requestAnimationFrame(function () {
      pendingRaf = null;
      if (token !== switchToken) return;
      slot1.style.transition = 'opacity ' + FADE_SPEED + 'ms ' + EASING;
      slot2.style.transition = 'opacity ' + FADE_SPEED + 'ms ' + EASING;
      slot1.style.opacity = '0';
      slot2.style.opacity = '0';
    });
    currentZone = -1;
  }

  section.addEventListener('mousemove', function (e) {
    var rect = section.getBoundingClientRect();
    var zone = Math.min(Math.floor(((e.clientX - rect.left) / rect.width) * ZONES), ZONES - 1);
    if (zone === currentZone) return;
    currentZone = zone;
    var item = items[Math.min(zone, items.length - 1)];
    var img  = item.querySelector('img');
    if (img && img.src) crossfadeTo(img.src);
  });

  section.addEventListener('mouseleave', fadeOut);

})();


/* ============================================================
   12. STADE FM — SPOTIFY WIDGET
   Uses Spotify's official iFrame API for real-time track data
   and full playback control. The Spotify iframe is hidden;
   all UI is custom-built with brand styling.

   Layout: [Art | Playlist · Track · Artist / ⏮ ⏯ ⏭ ── ][Spotify logo]
   Art updates to current track's album art once playback starts.
   oEmbed seeds the initial playlist cover + name before API loads.
   ============================================================ */
(function () {

  var EASING      = 'cubic-bezier(0.25, 0, 0.15, 1)';
  var FADE_SPEED  = 400;
  var BORDER      = '1px solid #000';
  var OEMBED_BASE = 'https://open.spotify.com/oembed?url=';
  var IFRAME_API  = 'https://open.spotify.com/embed/iframe-api/v1';
  // Client credentials — read-only public playlist access, no user data
  var CLIENT_ID     = '3884805f7de7413090d56a3d8b4449e2';
  var CLIENT_SECRET = '69a0a43afe0f4af7968c87d3fb94ef4e';
  var SLIDE_DURATION = 400;
  var SLIDE_KEY      = 'stade-fm-hidden';
  var DEFAULT_MODE   = 'native';
  var TAB_WIDTH      = 20;
  var RADIUS         = '4px'; // match .custom-cursor border-radius — adjust to taste

  var widget = document.querySelector('.stade-fm-widget');
  if (!widget) return;
  if (widget.getAttribute('data-fm-init')) return;
  widget.setAttribute('data-fm-init', '1');

  var seedIframe = widget.querySelector('iframe');
  if (!seedIframe) return;

  // Derive URLs from the embed src
  var rawSrc   = seedIframe.getAttribute('src') || '';
  var embedBase = rawSrc.split('?')[0]; // https://open.spotify.com/embed/playlist/xxx
  var openUrl   = embedBase.replace('/embed/', '/');
  // Convert embed URL → Spotify URI: spotify:playlist:xxx
  var spotifyUri = 'spotify:' + embedBase
    .replace('https://open.spotify.com/embed/', '')
    .replace('/', ':');

  // ── Player mode: ?player=native shows stock embed; default is custom UI ──
  var modeMatch  = window.location.search.match(/[?&]player=([^&]*)/);
  var playerMode = modeMatch ? modeMatch[1] : DEFAULT_MODE;

  if (playerMode === 'native') {
    // theme=0 = dark (black/gray). Default Spotify embed is light green/white.
    var nativeSrc = rawSrc.split('?')[0] + '?utm_source=generator&theme=0';
    // Read the height Webflow set on the embed element before we touch anything.
    // Fall back to the widget's current rendered height, then 80px.
    var embedH = parseInt(seedIframe.getAttribute('height'), 10)
              || widget.offsetHeight
              || 80;

    // Explicit pixel height so the iframe doesn't revert to any default.
    // src is set later (shuffle picks a random track, falls back to playlist).
    seedIframe.style.cssText = 'border:none;display:block;width:100%;height:' + embedH + 'px;';

    // Dark shell: exactly embedH + 2px padding top/bottom. border-box so padding
    // is included in the declared height, leaving embedH for the iframe content.
    var nativeShell = document.createElement('div');
    nativeShell.style.cssText = [
      'display:block', 'width:100%',
      'height:' + (embedH + 4) + 'px',
      'background:#1E1E1E', 'overflow:hidden',
      'padding:2px', 'box-sizing:border-box',
      'border-radius:0 ' + RADIUS + ' ' + RADIUS + ' 0',
      'opacity:0', 'transform:translateY(12px)',
      'transition:opacity 600ms ' + EASING + ', transform 600ms ' + EASING
    ].join(';');
    nativeShell.appendChild(seedIframe);

    // Shuffle: fetch a random track from the playlist via client credentials.
    // Falls back to the full playlist embed if the API returns 403 or fails.
    var ntvFadeDone = false;
    // API timeout: if token/tracks fetch stalls, fall back to playlist embed.
    var ntvFallbackTimer = setTimeout(function () { ntvFadeIn(nativeSrc); }, 1500);

    function ntvReveal() {
      // Wait for the embed's internal layout to settle before revealing.
      // The 'load' event fires when the iframe HTML is parsed; the extra
      // 600 ms masks the icon/spacing reflow that Spotify's JS triggers.
      var ntvRevealDone = false;
      var ntvRevealTimer = setTimeout(function () {
        if (!ntvRevealDone) {
        ntvRevealDone = true;
        nativeShell.style.opacity = '1';
        nativeShell.style.transform = 'translateY(0)';
      }
      }, 4000);
      seedIframe.addEventListener('load', function () {
        if (ntvRevealDone) { return; }
        ntvRevealDone = true;
        clearTimeout(ntvRevealTimer);
        setTimeout(function () {
          nativeShell.style.opacity = '1';
          nativeShell.style.transform = 'translateY(0)';
        }, 600);
      });
    }

    function ntvFadeIn(src) {
      if (ntvFadeDone) { return; }
      ntvFadeDone = true;
      clearTimeout(ntvFallbackTimer);
      seedIframe.src = src;
      ntvReveal();
    }

    var ntvPlaylistId = rawSrc.split('/playlist/')[1];
    ntvPlaylistId = ntvPlaylistId ? ntvPlaylistId.split('?')[0].trim() : null;

    if (ntvPlaylistId) {
      var ntvTokenXhr = new XMLHttpRequest();
      ntvTokenXhr.open('POST', 'https://accounts.spotify.com/api/token');
      ntvTokenXhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      ntvTokenXhr.setRequestHeader('Authorization', 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET));
      ntvTokenXhr.onload = function () {
        if (ntvTokenXhr.status !== 200) { ntvFadeIn(nativeSrc); return; }
        var ntvTokData;
        try { ntvTokData = JSON.parse(ntvTokenXhr.responseText); } catch (e) { ntvFadeIn(nativeSrc); return; }
        var ntvToken = ntvTokData.access_token;
        if (!ntvToken) { ntvFadeIn(nativeSrc); return; }
        var ntvTracksXhr = new XMLHttpRequest();
        ntvTracksXhr.open('GET', 'https://api.spotify.com/v1/playlists/' + ntvPlaylistId + '/tracks?limit=100&fields=items(track(id))');
        ntvTracksXhr.setRequestHeader('Authorization', 'Bearer ' + ntvToken);
        ntvTracksXhr.onload = function () {
          if (ntvTracksXhr.status !== 200) { ntvFadeIn(nativeSrc); return; }
          var ntvData;
          try { ntvData = JSON.parse(ntvTracksXhr.responseText); } catch (e) { ntvFadeIn(nativeSrc); return; }
          var ntvItems = ntvData.items;
          if (!ntvItems || !ntvItems.length) { ntvFadeIn(nativeSrc); return; }
          var ntvIds = [];
          for (var ni = 0; ni < ntvItems.length; ni++) {
            if (ntvItems[ni] && ntvItems[ni].track && ntvItems[ni].track.id) {
              ntvIds.push(ntvItems[ni].track.id);
            }
          }
          if (!ntvIds.length) { ntvFadeIn(nativeSrc); return; }
          var ntvPick = ntvIds[Math.floor(Math.random() * ntvIds.length)];
          ntvFadeIn('https://open.spotify.com/embed/track/' + ntvPick + '?utm_source=generator&theme=0');
        };
        ntvTracksXhr.onerror = function () { ntvFadeIn(nativeSrc); };
        ntvTracksXhr.send();
      };
      ntvTokenXhr.onerror = function () { ntvFadeIn(nativeSrc); };
      ntvTokenXhr.send('grant_type=client_credentials');
    } else {
      ntvFadeIn(nativeSrc);
    }

    // Pin the widget to the same height so Webflow's sizing doesn't interfere.
    widget.style.height = (embedH + 4) + 'px';

    // No overflow:hidden on widget — lets the tab slide past the widget boundary
    // to the screen edge. The viewport clips the shell naturally once off-screen.

    // ── Slide panel (same mechanic as custom mode) ────────────

    // Read the cursor element's computed typography so the tab labels
    // feel like they belong to the same design system.
    var _ntvCursor = document.querySelector('.custom-cursor');
    var _ntvCS     = _ntvCursor ? window.getComputedStyle(_ntvCursor) : null;
    var ntvTabFontSize = _ntvCS ? _ntvCS.fontSize : '10px';
    var ntvTabLS       = (_ntvCS && _ntvCS.letterSpacing && _ntvCS.letterSpacing !== '0px')
                         ? _ntvCS.letterSpacing : '0.08em';

    var ntvLabelStyle = 'display:block;writing-mode:vertical-rl;text-orientation:mixed;' +
      'font-size:' + ntvTabFontSize + ';letter-spacing:' + ntvTabLS + ';' +
      'text-transform:uppercase;font-family:inherit;line-height:1;color:inherit;';
    var ntvLabelHide = '<span style="' + ntvLabelStyle + '">HIDE</span>';
    var ntvLabelShow = '<span style="' + ntvLabelStyle + '">STADE FM</span>';

    var ntvPanel = document.createElement('div');
    ntvPanel.style.cssText = [
      'display:flex', 'flex-direction:row', 'align-items:center', 'width:100%',
      'transition:transform ' + SLIDE_DURATION + 'ms ' + EASING
    ].join(';');

    var ntvTab = document.createElement('button');
    ntvTab.setAttribute('type', 'button');
    ntvTab.setAttribute('aria-label', 'Hide player');
    ntvTab.style.cssText = [
      'width:' + TAB_WIDTH + 'px', 'flex-shrink:0', 'align-self:center',
      'background:#1a1a1a', 'border:none',
      'border-radius:' + RADIUS + ' 0 0 ' + RADIUS,
      'cursor:pointer', 'display:flex', 'align-items:center', 'justify-content:center',
      'padding:6px 0', 'color:rgba(255,255,255,0.7)',
      'opacity:0', 'transition:opacity 200ms ease'
    ].join(';');
    ntvTab.innerHTML = ntvLabelHide;

    ntvPanel.appendChild(ntvTab);
    ntvPanel.appendChild(nativeShell);
    widget.innerHTML = '';
    widget.appendChild(ntvPanel);

    var ntvHidden = sessionStorage.getItem(SLIDE_KEY) === '1';

    function ntvUpdateTab(hidden) {
      ntvTab.innerHTML = hidden ? ntvLabelShow : ntvLabelHide;
      ntvTab.setAttribute('aria-label', hidden ? 'Show player' : 'Hide player');
      // Collapsed: tab is always visible — it's the only affordance to reopen.
      // Expanded: visibility is driven by hover state on the panel.
      if (hidden) { ntvTab.style.opacity = '1'; }
    }

    function ntvSetSlide(hidden, animate) {
      if (!animate) {
        ntvPanel.style.transition = 'none';
      } else {
        ntvPanel.style.transition = 'transform ' + SLIDE_DURATION + 'ms ' + EASING;
      }
      if (hidden) {
        var ntvRightGap = Math.max(0, Math.round(window.innerWidth - widget.getBoundingClientRect().right));
        ntvPanel.style.transform = 'translateX(calc(100% - ' + TAB_WIDTH + 'px + ' + ntvRightGap + 'px))';
      } else {
        ntvPanel.style.transform = 'translateX(0)';
      }
      ntvUpdateTab(hidden);
      if (!animate) {
        requestAnimationFrame(function () {
          ntvPanel.style.transition = 'transform ' + SLIDE_DURATION + 'ms ' + EASING;
        });
      }
    }

    requestAnimationFrame(function () { ntvSetSlide(ntvHidden, false); });

    ntvTab.addEventListener('click', function () {
      ntvHidden = !ntvHidden;
      sessionStorage.setItem(SLIDE_KEY, ntvHidden ? '1' : '0');
      ntvSetSlide(ntvHidden, true);
    });

    // Tab is hidden until the cursor enters the widget area.
    // When collapsed the tab stays visible — it is the only clickable target.
    var ntvTabHover = false;
    ntvPanel.addEventListener('mouseenter', function () {
      ntvTabHover = true;
      ntvTab.style.opacity = '1';
    });
    ntvPanel.addEventListener('mouseleave', function () {
      ntvTabHover = false;
      if (!ntvHidden) { ntvTab.style.opacity = '0'; }
    });

    return;
  }

  // Playback state
  var controller    = null;
  var duration      = 0;
  var posMs         = 0;
  var posTs         = 0;
  var rafId         = null;
  var trackList     = []; // [{name, artist, duration}] fetched from Web API
  var currentIndex  = 0;  // current track position within playlist

  // ── Helpers ──────────────────────────────────────────────────

  function fmtMs(ms) {
    var s = Math.floor((ms || 0) / 1000);
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  function lerp() {
    if (!duration) return;
    var now = Math.min(posMs + (Date.now() - posTs), duration);
    progressFill.style.width = (now / duration * 100) + '%';
    elCurrentTime.textContent = fmtMs(now);
  }

  function startTick() {
    if (rafId) return;
    (function tick() { lerp(); rafId = requestAnimationFrame(tick); })();
  }

  function stopTick() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  // ── Spotify Web API ───────────────────────────────────────────

  function fetchToken(cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://accounts.spotify.com/api/token');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET));
    xhr.onload = function () {
      if (xhr.status === 200) {
        try { cb(JSON.parse(xhr.responseText).access_token); } catch (e) {}
      }
    };
    xhr.send('grant_type=client_credentials');
  }

  function fetchPlaylistTracks(token, playlistId, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks?limit=100');
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var items = JSON.parse(xhr.responseText).items;
          cb(items.filter(function (i) { return i.track; }).map(function (i) {
            return {
              name:     i.track.name,
              artist:   i.track.artists[0] ? i.track.artists[0].name : '',
              duration: i.track.duration_ms
            };
          }));
        } catch (e) {}
      } else {
        console.log('[StadeFM] Tracks fetch failed:', xhr.status, xhr.responseText);
      }
    };
    xhr.send();
  }

  // Match current track by duration (±1.5 s tolerance — unique enough in practice)
  function trackFromDuration(ms) {
    for (var i = 0; i < trackList.length; i++) {
      if (Math.abs(trackList[i].duration - ms) < 1500) return trackList[i];
    }
    return null;
  }

  // ── Build UI ─────────────────────────────────────────────────

  var shell = document.createElement('div');
  shell.style.cssText = [
    'display:flex', 'align-items:stretch', 'flex:1', 'min-width:0',
    'background:#fff',
    'overflow:hidden', 'font-family:inherit', 'box-sizing:border-box',
    'border-radius:0 ' + RADIUS + ' ' + RADIUS + ' 0',
    'opacity:0',
    'transition:opacity ' + FADE_SPEED + 'ms ' + EASING
  ].join(';');

  // — Art column —
  var artWrap = document.createElement('div');
  artWrap.style.cssText = [
    'flex-shrink:0', 'width:88px', 'position:relative',
    'border-right:' + BORDER
  ].join(';');
  var artImg = document.createElement('img');
  artImg.style.cssText = [
    'display:block', 'width:100%', 'height:100%',
    'object-fit:cover', 'position:absolute', 'inset:0'
  ].join(';');
  artImg.alt = '';
  artWrap.appendChild(artImg);

  // — Right panel —
  var right = document.createElement('div');
  right.style.cssText = 'display:flex;flex-direction:column;flex:1;min-width:0;';

  // Info row
  var infoRow = document.createElement('div');
  infoRow.style.cssText = [
    'position:relative', 'flex:1', 'display:flex', 'flex-direction:column',
    'justify-content:center', 'gap:2px',
    'padding:8px 30px 8px 14px',
    'border-bottom:' + BORDER
  ].join(';');

  // Spotify logo — required by ToS, links to playlist
  var spotifyLink = document.createElement('a');
  spotifyLink.href = openUrl;
  spotifyLink.target = '_blank';
  spotifyLink.rel = 'noopener noreferrer';
  spotifyLink.setAttribute('aria-label', 'Open on Spotify');
  spotifyLink.style.cssText = [
    'position:absolute', 'top:8px', 'right:8px',
    'display:flex', 'align-items:center', 'justify-content:center',
    'width:14px', 'height:14px', 'flex-shrink:0'
  ].join(';');
  spotifyLink.innerHTML = '<svg width="16" height="16" viewBox="0 0 168 168" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M84 0C37.6 0 0 37.6 0 84s37.6 84 84 84 84-37.6 84-84S130.4 0 84 0zm38.5 121.2c-1.5 2.5-4.7 3.3-7.2 1.8-19.7-12-44.5-14.7-73.7-8-2.8.6-5.5-1.1-6.2-3.9-.6-2.8 1.1-5.5 3.9-6.2 32-7.3 59.5-4.2 81.6 9.2 2.5 1.5 3.3 4.7 1.6 7.1zm10.3-22.9c-1.9 3.1-6 4.1-9.1 2.2-22.6-13.9-57-17.9-83.7-9.8-3.5 1.1-7.1-.9-8.2-4.4-1-3.5.9-7.1 4.4-8.2 30.5-9.3 68.4-4.8 94.4 11.2 3.1 1.9 4.1 6 2.2 9zm.9-23.8C109 60.4 67.5 59 43.8 66.4c-4.2 1.3-8.6-1-9.9-5.2-1.3-4.2 1-8.6 5.2-9.9 27.5-8.4 73.3-6.7 102.1 10.3 3.8 2.2 5.1 7 2.8 10.9-2.2 3.7-7 5-10.8 2.9z" fill="#000"/></svg>';

  var elLabel = document.createElement('span');
  elLabel.style.cssText = [
    'display:block', 'font-size:8px', 'letter-spacing:0.1em',
    'text-transform:uppercase', 'color:#000', 'font-family:inherit'
  ].join(';');
  elLabel.textContent = 'STADE FM';

  var elTrackTitle = document.createElement('span');
  elTrackTitle.style.cssText = [
    'display:block', 'font-size:12px', 'font-weight:500', 'color:#000',
    'font-family:inherit', 'white-space:nowrap', 'overflow:hidden', 'text-overflow:ellipsis'
  ].join(';');
  elTrackTitle.textContent = '\u2014';

  var elArtistName = document.createElement('span');
  elArtistName.style.cssText = [
    'display:block', 'font-size:10px', 'color:#000', 'opacity:0.45',
    'font-family:inherit', 'white-space:nowrap', 'overflow:hidden', 'text-overflow:ellipsis'
  ].join(';');
  elArtistName.textContent = '';

  infoRow.appendChild(spotifyLink);
  infoRow.appendChild(elLabel);
  infoRow.appendChild(elTrackTitle);
  infoRow.appendChild(elArtistName);

  // Controls row
  var ctrlRow = document.createElement('div');
  ctrlRow.style.cssText = [
    'display:flex', 'align-items:center',
    'padding:0 12px', 'height:36px', 'gap:8px', 'flex-shrink:0'
  ].join(';');

  function makeBtn(ariaLabel, svgPath, size) {
    var sz = size || 15;
    var btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', ariaLabel);
    btn.style.cssText = [
      'background:none', 'border:none', 'padding:0', 'margin:0',
      'cursor:pointer', 'color:#000', 'display:flex',
      'align-items:center', 'justify-content:center', 'flex-shrink:0'
    ].join(';');
    btn.innerHTML = '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24" fill="currentColor">' + svgPath + '</svg>';
    return btn;
  }

  var prevBtn = makeBtn('Previous', '<path d="M6 6h2v12H6zM9.5 12L18 6v12z"/>', 13);
  var playBtn = makeBtn('Play', '<path d="M8 5v14l11-7z"/>', 16);
  var nextBtn = makeBtn('Next',    '<path d="M14.5 12L6 6v12zM16 6h2v12h-2z"/>', 13);

  var elCurrentTime = document.createElement('span');
  elCurrentTime.style.cssText = 'font-size:9px;color:#000;opacity:0.4;font-family:inherit;flex-shrink:0;letter-spacing:0.05em;';
  elCurrentTime.textContent = '0:00';

  var progressWrap = document.createElement('div');
  progressWrap.style.cssText = 'flex:1;height:1px;background:#000;opacity:0.15;position:relative;cursor:pointer;';
  var progressFill = document.createElement('div');
  progressFill.style.cssText = 'position:absolute;top:0;left:0;height:100%;background:#000;opacity:1;width:0%;';
  progressWrap.appendChild(progressFill);

  var elTotalTime = document.createElement('span');
  elTotalTime.style.cssText = 'font-size:9px;color:#000;opacity:0.4;font-family:inherit;flex-shrink:0;letter-spacing:0.05em;';
  elTotalTime.textContent = '0:00';

  ctrlRow.appendChild(prevBtn);
  ctrlRow.appendChild(playBtn);
  ctrlRow.appendChild(nextBtn);
  ctrlRow.appendChild(elCurrentTime);
  ctrlRow.appendChild(progressWrap);
  ctrlRow.appendChild(elTotalTime);

  right.appendChild(infoRow);
  right.appendChild(ctrlRow);
  shell.appendChild(artWrap);
  shell.appendChild(right);

  // apiMount: zero-size container on body for Spotify's iframe.
  // transform:scale(1) traps Spotify's fixed-position iframe inside it;
  // overflow:hidden clips it to nothing. Keeps it out of the widget entirely.
  var apiMount = document.createElement('div');
  apiMount.setAttribute('aria-hidden', 'true');
  // Fixed bottom-right, real dimensions, fully in viewport — passes Spotify's
  // visibility check. opacity:0 hides it from users without affecting geometry.
  // transform:scale(1) traps Spotify's fixed-position iframe inside the bounds.
  // overflow:hidden clips it so nothing bleeds out visually.
  apiMount.style.cssText = 'position:fixed;bottom:0;right:0;width:300px;height:80px;opacity:0;overflow:hidden;transform:scale(1);pointer-events:none;';
  document.body.appendChild(apiMount);

  // No overflow:hidden on widget — lets the tab slide past the widget boundary
  // to the screen edge. The viewport clips the shell naturally once off-screen.

  // ── Slide panel: [fmTab][shell] ───────────────────────────────
  // The whole panel slides left as one unit. fmTab hugs the right of the shell.
  // When hidden, the panel translates left by shell.offsetWidth — shell exits
  // off-screen left, tab arrives at the widget's left edge (screen left edge).

  var fmPanel = document.createElement('div');
  fmPanel.style.cssText = [
    'display:flex', 'flex-direction:row', 'align-items:stretch', 'width:100%',
    'transition:transform ' + SLIDE_DURATION + 'ms ' + EASING
  ].join(';');

  // Tab labels — typography pulled directly from .custom-cursor computed styles
  // so they feel like they belong to the same design system.
  var _fmCursor = document.querySelector('.custom-cursor');
  var _fmCS     = _fmCursor ? window.getComputedStyle(_fmCursor) : null;
  var fmTabFontSize = _fmCS ? _fmCS.fontSize : '10px';
  var fmTabLS       = (_fmCS && _fmCS.letterSpacing && _fmCS.letterSpacing !== '0px')
                      ? _fmCS.letterSpacing : '0.08em';
  var fmTabColor    = _fmCS ? _fmCS.color : '#000';

  var TAB_LABEL = 'display:block;writing-mode:vertical-rl;text-orientation:mixed;' +
    'font-size:' + fmTabFontSize + ';letter-spacing:' + fmTabLS + ';' +
    'text-transform:uppercase;font-family:inherit;line-height:1;color:inherit;';
  var labelHide = '<span style="' + TAB_LABEL + '">HIDE</span>';
  var labelShow = '<span style="' + TAB_LABEL + '">STADE FM</span>';

  var fmTab = document.createElement('button');
  fmTab.setAttribute('type', 'button');
  fmTab.setAttribute('aria-label', 'Hide player');
  fmTab.style.cssText = [
    'width:' + TAB_WIDTH + 'px', 'flex-shrink:0', 'align-self:center',
    'background:#fff', 'border:none',
    'border-radius:' + RADIUS + ' 0 0 ' + RADIUS,
    'cursor:pointer', 'display:flex', 'align-items:center', 'justify-content:center',
    'padding:6px 0', 'color:' + fmTabColor
  ].join(';');
  fmTab.innerHTML = labelHide; // player visible → shows "HIDE"

  fmPanel.appendChild(fmTab);
  fmPanel.appendChild(shell);

  widget.innerHTML = '';
  widget.appendChild(fmPanel);

  // ── Slide state ───────────────────────────────────────────────
  var fmHidden = sessionStorage.getItem(SLIDE_KEY) === '1';

  function updateTab(hidden) {
    fmTab.innerHTML = hidden ? labelShow : labelHide;
    fmTab.setAttribute('aria-label', hidden ? 'Show player' : 'Hide player');
  }

  function setSlide(hidden, animate) {
    if (!animate) {
      fmPanel.style.transition = 'none';
    } else {
      fmPanel.style.transition = 'transform ' + SLIDE_DURATION + 'ms ' + EASING;
    }
    if (hidden) {
      var fmRightGap = Math.max(0, Math.round(window.innerWidth - widget.getBoundingClientRect().right));
      fmPanel.style.transform = 'translateX(calc(100% - ' + TAB_WIDTH + 'px + ' + fmRightGap + 'px))';
    } else {
      fmPanel.style.transform = 'translateX(0)';
    }
    updateTab(hidden);
    if (!animate) {
      // Re-enable transition next frame so load restore has no animation
      requestAnimationFrame(function () {
        fmPanel.style.transition = 'transform ' + SLIDE_DURATION + 'ms ' + EASING;
      });
    }
  }

  // Restore saved state without animation
  requestAnimationFrame(function () { setSlide(fmHidden, false); });

  fmTab.addEventListener('click', function () {
    fmHidden = !fmHidden;
    sessionStorage.setItem(SLIDE_KEY, fmHidden ? '1' : '0');
    setSlide(fmHidden, true);
  });

  // ── Button events ─────────────────────────────────────────────

  function setPlayIcon(playing) {
    playBtn.innerHTML = playing
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  }

  playBtn.addEventListener('click', function () { if (controller) controller.togglePlay(); });

  prevBtn.addEventListener('click', function () {
    if (!controller || !trackList.length) return;
    currentIndex = (currentIndex - 1 + trackList.length) % trackList.length;
    controller.loadUri(spotifyUri, true, currentIndex);
  });

  nextBtn.addEventListener('click', function () {
    if (!controller || !trackList.length) return;
    currentIndex = (currentIndex + 1) % trackList.length;
    controller.loadUri(spotifyUri, true, currentIndex);
  });

  progressWrap.addEventListener('click', function (e) {
    if (!controller || !duration) return;
    var rect = progressWrap.getBoundingClientRect();
    var pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    controller.seek(Math.floor(pct * duration));
  });

  // ── Spotify iFrame API ────────────────────────────────────────

  // Hide any Spotify iframes injected directly into body
  var bodyObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeName === 'IFRAME' && node.src && node.src.indexOf('open.spotify.com') !== -1) {
          // position:fixed removes from flow (no page gap). Keep on-screen so
          // any visibility checks on these helpers also pass. opacity:0 hides them.
          node.style.setProperty('position', 'fixed', 'important');
          node.style.setProperty('bottom', '0', 'important');
          node.style.setProperty('right', '0', 'important');
          node.style.setProperty('opacity', '0', 'important');
          node.style.setProperty('pointer-events', 'none', 'important');
        }
      });
    });
  });
  bodyObserver.observe(document.body, { childList: true });

  window.onSpotifyIframeApiReady = function (IFrameAPI) {
    IFrameAPI.createController(apiMount, { uri: spotifyUri }, function (ctrl) {
      if (controller) return; // guard: IIFE may fire more than once on Webflow double-push
      controller = ctrl;

      ctrl.addListener('playback_update', function (e) {
        var d = (e && e.data !== undefined) ? e.data : e;
        if (!d) return;
        var playing = !d.isPaused;

        setPlayIcon(playing);
        if (playing) { startTick(); } else { stopTick(); lerp(); }

        if (d.duration) {
          duration = d.duration;
          posMs    = d.position;
          posTs    = Date.now();
          elTotalTime.textContent = fmtMs(duration);

          // Identify current track by duration and update display + index
          var track = trackFromDuration(d.duration);
          if (track) {
            elTrackTitle.textContent = track.name;
            elArtistName.textContent = track.artist;
            for (var i = 0; i < trackList.length; i++) {
              if (trackList[i] === track) { currentIndex = i; break; }
            }
          }
        }
      });

      // Async: fetch track list for title display once extended API access is granted.
      var playlistId = spotifyUri.replace('spotify:playlist:', '');
      fetchToken(function (token) {
        fetchPlaylistTracks(token, playlistId, function (tracks) {
          trackList = tracks;
        });
      });
    });
  };

  if (!document.querySelector('script[src="' + IFRAME_API + '"]')) {
    var script = document.createElement('script');
    script.src = IFRAME_API;
    script.async = true;
    document.head.appendChild(script);
  }

  // ── oEmbed: seed cover + playlist name before API loads ──────

  var xhr = new XMLHttpRequest();
  xhr.open('GET', OEMBED_BASE + encodeURIComponent(openUrl));
  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        var data = JSON.parse(xhr.responseText);
        if (data.thumbnail_url) artImg.src = data.thumbnail_url;
        if (data.title)         elLabel.textContent = data.title;
      } catch (e) {}
    }
    shell.style.opacity = '1';
  };
  xhr.onerror = function () { shell.style.opacity = '1'; };
  xhr.send();

})();


/* ============================================================
   13. CUSTOM AUDIO PLAYER
   Reads track data from hidden .audio-track[data-src, data-title,
   data-artist] divs inside .stade-audio-widget. Builds full
   player UI inline — visual language matches the video player.
   State classes: .is-playing / .is-muted on .audio-player.
   ============================================================ */
(function () {

  var EASING     = 'cubic-bezier(0.25, 0, 0.15, 1)';
  var FADE_SPEED = 300;
  var C_TRACK    = 'rgba(0,0,0,0.15)';

  var widget = document.querySelector('.stade-audio-widget');
  if (!widget) return;

  var trackEls = Array.from(widget.querySelectorAll('.audio-track[data-src]'));
  if (!trackEls.length) return;

  var tracks = trackEls.map(function (el) {
    return {
      src:    el.getAttribute('data-src'),
      title:  el.getAttribute('data-title')  || 'Unknown Track',
      artist: el.getAttribute('data-artist') || ''
    };
  });
  trackEls.forEach(function (el) { el.style.display = 'none'; });

  /* ── inject volume slider styles (can't do ::-webkit via inline) ── */
  var styleTag = document.createElement('style');
  styleTag.textContent = [
    '.audio-player_volume-slider{-webkit-appearance:none;appearance:none;width:52px;height:2px;background:' + C_TRACK + ';border-radius:1px;cursor:pointer;outline:none;border:none}',
    '.audio-player_volume-slider::-webkit-slider-thumb{-webkit-appearance:none;width:6px;height:6px;border-radius:50%;background:currentColor;cursor:pointer}',
    '.audio-player_volume-slider::-moz-range-thumb{width:6px;height:6px;border-radius:50%;background:currentColor;border:none;cursor:pointer}',
    '.audio-player_progress{cursor:pointer}',
    '.audio-player_btn{cursor:pointer}'
  ].join('');
  document.head.appendChild(styleTag);

  /* ── helpers ── */
  function make(tag, cls, css) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (css) el.style.cssText = css;
    return el;
  }
  function formatTime(s) {
    if (!s || isNaN(s)) return '0:00';
    var m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }
  var BTN_BASE = 'background:none;border:none;padding:0;color:inherit;font:inherit;cursor:pointer;transition:opacity 200ms ease';

  /* ── audio element ── */
  var audio = document.createElement('audio'); audio.preload = 'metadata';

  /* ── state ── */
  var currentIndex = 0, isPlaying = false;

  /* ── build UI ── */
  var player   = make('div',  'audio-player',
    'display:flex;flex-direction:column;gap:14px;font-size:0.75rem;' +
    'opacity:0;transition:opacity ' + FADE_SPEED + 'ms ' + EASING);

  var infoWrap = make('div', 'audio-player_info',   'display:flex;flex-direction:column;gap:6px');
  var titleEl  = make('div', 'audio-player_title');
  var artistEl = make('div', 'audio-player_artist', 'opacity:0.4');

  var bar      = make('div', 'audio-player_bar',
    'display:flex;align-items:center;gap:16px');

  var controls = make('div', 'audio-player_controls', 'display:flex;align-items:center;gap:14px;flex-shrink:0');
  var prevBtn  = make('button', 'audio-player_btn is-prev', BTN_BASE + ';opacity:0.45'); prevBtn.type = 'button'; prevBtn.textContent = '←';
  var playBtn  = make('button', 'audio-player_btn is-play', BTN_BASE + ';display:inline-block;width:1em;text-align:center'); playBtn.type = 'button'; playBtn.textContent = '▶';
  var nextBtn  = make('button', 'audio-player_btn is-next', BTN_BASE + ';opacity:0.45'); nextBtn.type = 'button'; nextBtn.textContent = '→';

  var progressWrap = make('div',  'audio-player_progress-wrap', 'flex:1;display:flex;align-items:center');
  var progressBar  = make('div',  'audio-player_progress',
    'flex:1;height:2px;background:' + C_TRACK + ';border-radius:1px;position:relative');
  var progressFill = make('div',  'audio-player_progress-fill',
    'position:absolute;left:0;top:0;bottom:0;width:0%;background:currentColor;border-radius:1px');

  var timeWrap = make('div',  'audio-player_time',
    'display:flex;gap:5px;flex-shrink:0;opacity:0.4;font-variant-numeric:tabular-nums');
  var timeNow  = make('span', 'audio-player_time-current'); timeNow.textContent = '0:00';
  var timeSep  = make('span', 'audio-player_time-sep');     timeSep.textContent = '/';
  var timeTot  = make('span', 'audio-player_time-total');   timeTot.textContent = '0:00';

  var volWrap  = make('div', 'audio-player_volume', 'display:flex;align-items:center;flex-shrink:0');
  var volSlider = document.createElement('input');
  volSlider.type = 'range'; volSlider.className = 'audio-player_volume-slider';
  volSlider.min = '0'; volSlider.max = '1'; volSlider.step = '0.01'; volSlider.value = '1';

  /* ── assemble ── */
  infoWrap.appendChild(titleEl);  infoWrap.appendChild(artistEl);
  controls.appendChild(prevBtn);  controls.appendChild(playBtn); controls.appendChild(nextBtn);
  progressBar.appendChild(progressFill);
  progressWrap.appendChild(progressBar);
  timeWrap.appendChild(timeNow); timeWrap.appendChild(timeSep); timeWrap.appendChild(timeTot);
  volWrap.appendChild(volSlider);
  bar.appendChild(controls); bar.appendChild(progressWrap); bar.appendChild(timeWrap); bar.appendChild(volWrap);
  player.appendChild(infoWrap); player.appendChild(bar);
  widget.appendChild(player);

  /* ── state update ── */
  function updatePlayState() {
    playBtn.textContent = isPlaying ? '■' : '▶';
    player.classList.toggle('is-playing', isPlaying);
  }

  /* ── load track ── */
  function loadTrack(index, autoplay) {
    currentIndex = index;
    var t = tracks[index];
    titleEl.textContent  = t.title;
    artistEl.textContent = t.artist;
    audio.src = t.src;
    progressFill.style.width = '0%';
    timeNow.textContent = '0:00'; timeTot.textContent = '0:00';
    isPlaying = false; updatePlayState();
    if (autoplay) { audio.play().catch(function () {}); isPlaying = true; updatePlayState(); }
  }

  /* ── controls ── */
  function togglePlay() {
    if (isPlaying) { audio.pause(); isPlaying = false; }
    else           { audio.play().catch(function () {}); isPlaying = true; }
    updatePlayState();
  }
  function prevTrack() { loadTrack((currentIndex - 1 + tracks.length) % tracks.length, isPlaying); }
  function nextTrack() { loadTrack((currentIndex + 1) % tracks.length, isPlaying); }

  /* ── seek ── */
  function seekFromEvent(e) {
    var rect  = progressBar.getBoundingClientRect();
    var ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audio.duration) audio.currentTime = ratio * audio.duration;
  }
  var dragging = false;
  progressBar.addEventListener('mousedown', function (e) { dragging = true; seekFromEvent(e); });
  document.addEventListener('mousemove',   function (e) { if (dragging) seekFromEvent(e); });
  document.addEventListener('mouseup',     function ()  { dragging = false; });
  progressBar.addEventListener('touchstart', function (e) { seekFromEvent(e.touches[0]); }, { passive: true });
  progressBar.addEventListener('touchmove',  function (e) { seekFromEvent(e.touches[0]); }, { passive: true });

  /* ── volume ── */
  volSlider.addEventListener('input', function () {
    audio.volume = parseFloat(volSlider.value);
    player.classList.toggle('is-muted', audio.volume === 0);
  });

  /* ── audio events ── */
  audio.addEventListener('timeupdate', function () {
    if (!audio.duration) return;
    progressFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
    timeNow.textContent = formatTime(audio.currentTime);
  });
  audio.addEventListener('loadedmetadata', function () { timeTot.textContent = formatTime(audio.duration); });
  audio.addEventListener('ended', nextTrack);

  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', prevTrack);
  nextBtn.addEventListener('click', nextTrack);

  /* ── init ── */
  loadTrack(0, false);
  requestAnimationFrame(function () { requestAnimationFrame(function () { player.style.opacity = '1'; }); });

})();


/* ============================================================
   14. PAGE TRANSITIONS — always last
   Creates overlay, fades out on load, fades in on navigate
   Intercepts all internal link clicks
   Exposes window.stadeNavigate(url) for programmatic navigation
   ============================================================ */
(function () {

  var FADE_OUT_SPEED = 600;
  var FADE_IN_SPEED  = 220;
  var NAVIGATE_AT    = 0.6;
  var CONTENT_DELAY  = 40;
  var EASING         = 'cubic-bezier(0.25, 0, 0.15, 1)';
  var BG_COLOR       = '#f4f4f4';

  var overlay = document.getElementById('page-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'page-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:' + BG_COLOR + ';z-index:9999;pointer-events:auto;opacity:1;transition:none';
    document.body.appendChild(overlay);
  }

  var isHome  = document.body.classList.contains('page-home');
  var wrapper = document.querySelector('.page-wrapper, .main-wrapper, main');

  if (!isHome && wrapper) { wrapper.style.opacity = '0'; wrapper.style.transition = 'none'; }

  function revealPage() {
    overlay.style.transition = 'opacity ' + FADE_OUT_SPEED + 'ms ' + EASING;
    overlay.style.opacity    = '0';
    setTimeout(function () { overlay.style.pointerEvents = 'none'; }, FADE_OUT_SPEED);
    if (!isHome && wrapper) {
      setTimeout(function () {
        wrapper.style.transition = 'opacity ' + FADE_OUT_SPEED + 'ms ' + EASING;
        wrapper.style.opacity    = '1';
      }, CONTENT_DELAY);
    }
  }

  requestAnimationFrame(function () { requestAnimationFrame(revealPage); });
  setTimeout(function () { if (parseFloat(overlay.style.opacity) > 0) revealPage(); }, 1500);

  window.stadeNavigate = function (url) {
    if (!url) return;
    overlay.style.pointerEvents = 'auto';
    overlay.style.transition    = 'opacity ' + FADE_IN_SPEED + 'ms ' + EASING;
    overlay.style.opacity       = '1';
    setTimeout(function () { window.location.href = url; }, Math.round(FADE_IN_SPEED * NAVIGATE_AT));
  };

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a'); if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href === '#') return;
    if (href.startsWith('mailto') || href.startsWith('tel')) return;
    if (href.startsWith('http') && !href.includes(window.location.hostname)) return;
    if (link.getAttribute('target') === '_blank') return;
    if (link.hasAttribute('download')) return;
    e.preventDefault();
    window.stadeNavigate(href);
  });

  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      overlay.style.transition = 'none'; overlay.style.opacity = '1'; overlay.style.pointerEvents = 'auto';
      requestAnimationFrame(function () { requestAnimationFrame(revealPage); });
    }
  });

})();
