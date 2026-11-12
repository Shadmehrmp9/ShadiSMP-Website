(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const safeText = (node, value) => { if (node) node.textContent = value == null ? '' : String(value); };
  const loadScript = (src) => new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="' + src + '"]');
    if (existing) {
      if (existing.dataset.loaded === 'true') return resolve();
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', () => reject(new Error('script_load_failed')), { once: true });
      return;
    }
    const node = document.createElement('script');
    node.src = src;
    node.async = true;
    node.onload = () => { node.dataset.loaded = 'true'; resolve(); };
    node.onerror = () => reject(new Error('script_load_failed'));
    document.head.appendChild(node);
  });

  const addressEl = byId('serverAddress');
  const versionEl = byId('serverVersion');
  const copyButton = byId('copyIp');
  const copyLabel = byId('copyLabel');
  const menuToggle = byId('menuToggle');
  const mainNav = byId('mainNav');

  async function loadServerConfig() {
    try {
      const response = await fetch('./server.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('config_unavailable');
      const config = await response.json();
      const address = typeof config.address === 'string' ? config.address.trim() : '';
      safeText(addressEl, address || 'آدرس سرور به‌زودی اعلام می‌شود');
      if (copyButton) copyButton.disabled = !address;
      if (config.version) safeText(versionEl, 'نسخه: ' + config.version);
    } catch (_) {
      safeText(addressEl, 'آدرس سرور فعلاً در دسترس نیست');
      if (copyButton) copyButton.disabled = true;
    }
  }

  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      const address = addressEl ? addressEl.textContent.trim() : '';
      if (!address || copyButton.disabled) return;
      try {
        await navigator.clipboard.writeText(address);
        safeText(copyLabel, 'آدرس کپی شد');
        const icon = copyButton.querySelector('.copy-icon');
        if (icon) icon.textContent = '✓';
        window.setTimeout(() => {
          safeText(copyLabel, 'کپی آدرس سرور');
          if (icon) icon.textContent = '▣';
        }, 1800);
      } catch (_) {
        safeText(copyLabel, 'کپی خودکار انجام نشد');
      }
    });
  }

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const open = mainNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    mainNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  // Use repository-local artwork so remote image hosts cannot break the hero.
  document.querySelectorAll('.hero-image img, .world-photo img').forEach((img) => {
    img.src = './assets/shadi-world.svg';
    img.alt = '';
    img.addEventListener('error', () => {
      img.style.display = 'none';
      if (img.parentElement) img.parentElement.classList.add('image-fallback');
    }, { once: true });
  });

  // Same-page section history controls.
  const historyDock = document.createElement('nav');
  historyDock.className = 'shadi-history-dock';
  historyDock.setAttribute('aria-label', 'ناوبری صفحه');
  historyDock.innerHTML =
    '<button type="button" id="shadiHistoryBack" aria-label="رفتن به بخش قبلی" title="بخش قبلی"><b aria-hidden="true">↶</b><span>قبلی</span></button>' +
    '<button type="button" id="shadiHistoryForward" aria-label="رفتن به بخش بعدی" title="بخش بعدی"><b aria-hidden="true">↷</b><span>بعدی</span></button>' +
    '<button type="button" id="shadiScrollTop" aria-label="رفتن به ابتدای صفحه" title="رفتن به بالا"><b aria-hidden="true">↑</b><span>بالا</span></button>';
  document.body.appendChild(historyDock);

  const backButton = byId('shadiHistoryBack');
  const forwardButton = byId('shadiHistoryForward');
  const scrollTopButton = byId('shadiScrollTop');
  function decodeSectionHash(hash) {
    try { return decodeURIComponent(String(hash || '').replace(/^#/, '')); }
    catch (_) { return ''; }
  }
  const initialHash = location.hash && byId(decodeSectionHash(location.hash)) ? location.hash : '#home';
  let sectionHistory = [initialHash];
  let sectionHistoryIndex = 0;

  function updateHistoryButtons() {
    backButton.disabled = sectionHistoryIndex <= 0;
    forwardButton.disabled = sectionHistoryIndex >= sectionHistory.length - 1;
  }
  function scrollToSection(hash, behavior) {
    const target = byId(decodeSectionHash(hash));
    if (!target) return;
    target.scrollIntoView({
      behavior: behavior || (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'),
      block: 'start'
    });
  }
  function navigateToSection(hash) {
    if (!hash || hash === '#') return;
    if (!byId(decodeSectionHash(hash))) return;
    if (sectionHistory[sectionHistoryIndex] !== hash) {
      sectionHistory = sectionHistory.slice(0, sectionHistoryIndex + 1);
      sectionHistory.push(hash);
      sectionHistoryIndex = sectionHistory.length - 1;
      window.history.pushState(
        { ...(window.history.state && typeof window.history.state === 'object' ? window.history.state : {}), shadiSiteNavigation: true, shadiSectionIndex: sectionHistoryIndex },
        '', hash
      );
    }
    updateHistoryButtons();
    scrollToSection(hash);
  }

  window.history.replaceState(
    { ...(window.history.state && typeof window.history.state === 'object' ? window.history.state : {}), shadiSiteNavigation: true, shadiSectionIndex: 0 },
    '', window.location.href
  );

  document.addEventListener('click', (event) => {
    const anchor = event.target && event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!anchor || event.defaultPrevented || anchor.id === 'footerFeedback' || anchor.id === 'feedbackNav') return;
    const hash = anchor.getAttribute('href');
    if (!hash || hash === '#' || !byId(decodeSectionHash(hash))) return;
    event.preventDefault();
    navigateToSection(hash);
    if (mainNav && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }
  }, true);

  backButton.addEventListener('click', () => { if (sectionHistoryIndex > 0) window.history.back(); });
  forwardButton.addEventListener('click', () => { if (sectionHistoryIndex < sectionHistory.length - 1) window.history.forward(); });
  window.addEventListener('popstate', (event) => {
    const stateIndex = event.state && Number.isInteger(event.state.shadiSectionIndex) ? event.state.shadiSectionIndex : null;
    if (stateIndex !== null && stateIndex >= 0 && stateIndex < sectionHistory.length) sectionHistoryIndex = stateIndex;
    updateHistoryButtons();
    scrollToSection(location.hash || '#home', 'smooth');
  });
  scrollTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  const updateScrollTopButton = () => scrollTopButton.classList.toggle('is-visible', window.scrollY > 350);
  window.addEventListener('scroll', updateScrollTopButton, { passive: true });
  updateScrollTopButton();
  updateHistoryButtons();

  // Feedback is the only interactive feature and works without a user account.
  const feedbackSection = '<section class="section container shadi-feedback-section" id="feedback">' +
    '<div class="glass-panel shadi-feedback-card">' +
      '<div><span class="section-label">WE VALUE YOUR FEEDBACK</span><h2>نظرت دربارهٔ SHADI SMP چیه؟</h2>' +
      '<p>پیشنهادها، گزارش خطاها و ایده‌هایت را برای بهتر شدن سایت و سرور ارسال کن.</p></div>' +
      '<button class="button button-primary shadi-feedback-action" type="button" id="feedbackOpen">ارسال Feedback <span>←</span></button>' +
    '</div></section>';
  const feedbackModal = '<div class="shadi-modal" id="feedbackModal" role="dialog" aria-modal="true" aria-labelledby="feedbackTitle">' +
    '<div class="shadi-modal-card"><div class="shadi-modal-head"><div><h2 id="feedbackTitle">ارسال بازخورد</h2>' +
    '<p>بدون ساخت حساب کاربری، پیشنهاد یا گزارش خطایت را ارسال کن.</p></div>' +
    '<button class="shadi-close" type="button" data-close="feedbackModal" aria-label="بستن">×</button></div>' +
    '<form id="feedbackForm" class="shadi-feedback-form">' +
    '<label>موضوع<select name="category" required><option value="پیشنهاد">پیشنهاد</option><option value="گزارش خطا">گزارش خطا</option><option value="نظر درباره سایت">نظر درباره سایت</option><option value="مشکل سرور">مشکل سرور</option></select></label>' +
    '<label>پیام<textarea name="message" required minlength="8" maxlength="1200" placeholder="جزئیات را اینجا بنویس…"></textarea></label>' +
    '<button class="shadi-submit" type="submit">ارسال Feedback</button></form>' +
    '<p class="shadi-status" id="feedbackStatus" aria-live="polite">در حال بررسی اتصال Feedback…</p></div></div>';

  const main = document.querySelector('main');
  if (main && !byId('feedback')) {
    const finalCta = main.querySelector('.final-cta');
    if (finalCta) finalCta.insertAdjacentHTML('afterend', feedbackSection);
    else main.insertAdjacentHTML('beforeend', feedbackSection);
  }
  if (!byId('feedbackModal')) document.body.insertAdjacentHTML('beforeend', feedbackModal);

  function openFeedback() {
    const modal = byId('feedbackModal');
    if (!modal) return;
    modal.classList.add('is-open');
    document.body.classList.add('shadi-modal-open');
  }
  function closeFeedback() {
    const modal = byId('feedbackModal');
    if (modal) modal.classList.remove('is-open');
    document.body.classList.remove('shadi-modal-open');
  }

  document.querySelectorAll('[data-close="feedbackModal"]').forEach((button) => button.addEventListener('click', closeFeedback));
  const feedbackModalNode = byId('feedbackModal');
  if (feedbackModalNode) feedbackModalNode.addEventListener('click', (event) => {
    if (event.target === feedbackModalNode) closeFeedback();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && feedbackModalNode && feedbackModalNode.classList.contains('is-open')) closeFeedback();
  });

  function addFeedbackNavLink() {
    if (!mainNav || byId('feedbackNav')) return;
    const link = document.createElement('a');
    link.id = 'feedbackNav';
    link.href = '#';
    link.textContent = 'Feedback';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      mainNav.classList.remove('open');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      openFeedback();
    });
    mainNav.appendChild(link);
  }
  addFeedbackNavLink();

  const footer = document.querySelector('.footer-inner');
  if (footer && !byId('footerFeedback')) {
    const link = document.createElement('a');
    link.id = 'footerFeedback';
    link.href = '#';
    link.textContent = 'Feedback';
    link.addEventListener('click', (event) => { event.preventDefault(); openFeedback(); });
    footer.appendChild(link);
  }
  const feedbackOpen = byId('feedbackOpen');
  if (feedbackOpen) feedbackOpen.addEventListener('click', openFeedback);

  let supabaseClient = null;
  const feedbackStatus = byId('feedbackStatus');
  function showFeedbackStatus(message, kind) {
    safeText(feedbackStatus, message);
    if (!feedbackStatus) return;
    feedbackStatus.classList.remove('error', 'success');
    if (kind) feedbackStatus.classList.add(kind);
  }

  async function loadPublicSettings() {
    if (!supabaseClient) return;
    const result = await supabaseClient.from('site_settings').select('key,value').in('key', ['server.address','server.version','site.announcement']);
    if (result.error || !Array.isArray(result.data)) return;
    const values = {};
    result.data.forEach((item) => { values[item.key] = item.value; });
    const address = typeof values['server.address'] === 'string' ? values['server.address'] : '';
    const version = typeof values['server.version'] === 'string' ? values['server.version'] : '';
    if (addressEl) safeText(addressEl, address || 'آدرس سرور به‌زودی اعلام می‌شود');
    if (copyButton) copyButton.disabled = !address;
    if (version && versionEl) safeText(versionEl, 'نسخه: ' + version);
    const announcement = typeof values['site.announcement'] === 'string' ? values['site.announcement'].trim() : '';
    if (announcement) {
      let bar = byId('shadiAnnouncement');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'shadiAnnouncement';
        bar.className = 'shadi-announcement';
        const headerWrap = document.querySelector('.header-wrap');
        if (headerWrap) headerWrap.insertAdjacentElement('afterend', bar);
      }
      safeText(bar, announcement);
    }
  }

  async function initFeedback() {
    try {
      await loadScript('./auth-config.js');
      const config = window.SHADI_SUPABASE_CONFIG || {};
      if (!config.url || !config.anonKey) {
        showFeedbackStatus('ارسال Feedback هنوز به Supabase وصل نشده است؛ پس از قرار دادن Project URL و anon/public key فعال می‌شود.', 'error');
        return;
      }
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      if (!window.supabase || !window.supabase.createClient) throw new Error('supabase_sdk_unavailable');
      supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });
      await loadPublicSettings();
      showFeedbackStatus('فرم آماده است؛ برای ارسال پیام نیازی به حساب کاربری نیست.', 'success');
    } catch (_) {
      showFeedbackStatus('اتصال Feedback برقرار نشد؛ تنظیمات عمومی Supabase و دسترسی شبکه را بررسی کن.', 'error');
    }
  }

  const feedbackForm = byId('feedbackForm');
  if (feedbackForm) feedbackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
      showFeedbackStatus('ارسال Feedback فعلاً فعال نیست؛ تنظیمات Supabase هنوز کامل نشده است.', 'error');
      return;
    }
    const submit = feedbackForm.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    const form = new FormData(feedbackForm);
    try {
      const result = await supabaseClient.from('site_feedback').insert({
        category: String(form.get('category')),
        message: String(form.get('message')).trim()
      });
      if (result.error) throw result.error;
      feedbackForm.reset();
      showFeedbackStatus('Feedback با موفقیت ارسال شد. ممنون از کمکت!', 'success');
    } catch (_) {
      showFeedbackStatus('پیام ارسال نشد؛ تنظیمات جدول site_feedback و دسترسی ارسال ناشناس را بررسی کن.', 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  loadServerConfig();
  initFeedback();
})();