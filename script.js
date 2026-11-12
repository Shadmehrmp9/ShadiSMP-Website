(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const safeText = (node, value) => { if (node) node.textContent = value == null ? '' : String(value); };
  const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('script_load_failed'));
    document.head.appendChild(script);
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
    } catch (error) {
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
      } catch (error) {
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

  // Replace fragile hot-linked image URLs with the local artwork shipped in this repository.
  document.querySelectorAll('.hero-image img, .world-photo img').forEach((img) => {
    img.src = './assets/shadi-world.svg';
    img.alt = '';
    img.addEventListener('error', () => {
      img.style.display = 'none';
      if (img.parentElement) img.parentElement.classList.add('image-fallback');
    }, { once: true });
  });

  // Feature and responsive stylesheets are loaded in index.html in cascade order.

  // In-page browser navigation: keep back/forward inside this one-page site.
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
        '',
        hash
      );
    }
    updateHistoryButtons();
    scrollToSection(hash);
  }

  window.history.replaceState(
    { ...(window.history.state && typeof window.history.state === 'object' ? window.history.state : {}), shadiSiteNavigation: true, shadiSectionIndex: 0 },
    '',
    window.location.href
  );

  document.addEventListener('click', (event) => {
    const anchor = event.target && event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!anchor || event.defaultPrevented || anchor.id === 'footerFeedback') return;
    const hash = anchor.getAttribute('href');
    if (!hash || hash === '#' || !byId(decodeSectionHash(hash))) return;
    event.preventDefault();
    navigateToSection(hash);
    if (mainNav && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }
  }, true);

  backButton.addEventListener('click', () => {
    if (sectionHistoryIndex > 0) window.history.back();
  });
  forwardButton.addEventListener('click', () => {
    if (sectionHistoryIndex < sectionHistory.length - 1) window.history.forward();
  });
  window.addEventListener('popstate', (event) => {
    const stateIndex = event.state && Number.isInteger(event.state.shadiSectionIndex) ? event.state.shadiSectionIndex : null;
    if (stateIndex !== null && stateIndex >= 0 && stateIndex < sectionHistory.length) sectionHistoryIndex = stateIndex;
    const hash = location.hash || '#home';
    updateHistoryButtons();
    scrollToSection(hash, 'smooth');
  });

  scrollTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  const updateScrollTopButton = () => scrollTopButton.classList.toggle('is-visible', window.scrollY > 350);
  window.addEventListener('scroll', updateScrollTopButton, { passive: true });
  updateScrollTopButton();
  updateHistoryButtons();

  const nav = mainNav;
  const header = document.querySelector('.header');
  function addNavLink(id, label, onClick) {
    if (!nav || byId(id)) return;
    const link = document.createElement('a');
    link.id = id;
    link.href = '#';
    link.textContent = label;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (nav) nav.classList.remove('open');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      onClick();
    });
    nav.appendChild(link);
  }

  // Add new actions without requiring a rewrite of the existing page markup.
  if (header && !byId('adminNav')) {
    const adminButton = document.createElement('button');
    adminButton.type = 'button';
    adminButton.id = 'adminNav';
    adminButton.className = 'header-button admin-header-button';
    adminButton.textContent = 'مدیریت';
    header.appendChild(adminButton);
  }

  const modalMarkup =
    '<section class="section container shadi-feedback-section" id="feedback">' +
      '<div class="glass-panel shadi-feedback-card">' +
        '<div><span class="section-label">WE VALUE YOUR FEEDBACK</span><h2>نظرت دربارهٔ SHADI SMP چیه؟</h2>' +
        '<p>پیشنهادها، گزارش خطاها و ایده‌هایت را برای بهتر شدن سایت و سرور ارسال کن.</p></div>' +
        '<button class="button button-primary shadi-feedback-action" type="button" id="feedbackOpen">ارسال Feedback <span>←</span></button>' +
      '</div>' +
    '</section>' +
    '<div class="shadi-modal" id="accountModal" role="dialog" aria-modal="true" aria-labelledby="accountTitle">' +
      '<div class="shadi-modal-card"><div class="shadi-modal-head"><div><h2 id="accountTitle">حساب کاربری</h2><p>برای ساخت حساب، نام کاربری، ایمیل و رمز عبور وارد کن.</p></div><button class="shadi-close" type="button" data-close="accountModal" aria-label="بستن">×</button></div>' +
      '<div class="shadi-tabs"><button type="button" class="active" data-auth-tab="login">ورود</button><button type="button" data-auth-tab="register">ساخت حساب</button></div>' +
      '<form id="loginForm" class="shadi-form"><label>ایمیل حساب<input type="email" name="email" autocomplete="username" required maxlength="254"></label><label>رمز عبور<input type="password" name="password" autocomplete="current-password" required minlength="8"></label><button class="shadi-submit" type="submit">ورود به حساب</button></form>' +
      '<form id="registerForm" class="shadi-form shadi-hidden"><label>نام کاربری<input type="text" name="username" autocomplete="username" required minlength="3" maxlength="16" pattern="[A-Za-z0-9_]+" title="فقط حروف انگلیسی، عدد و زیرخط؛ ۳ تا ۱۶ کاراکتر"></label><label>ایمیل برای تأیید و بازیابی حساب<input type="email" name="email" autocomplete="email" required maxlength="254"></label><label>رمز عبور (حداقل ۱۰ کاراکتر)<input type="password" name="password" autocomplete="new-password" required minlength="10"></label><button class="shadi-submit" type="submit">ساخت حساب جدید</button></form>' +
      '<p class="shadi-status" id="accountStatus" aria-live="polite">در حال بررسی اتصال سیستم حساب کاربری…</p>' +
      '<button type="button" class="shadi-logout shadi-hidden" id="logoutButton">خروج از حساب</button>' +
      '<p class="shadi-hint">رمز عبور در فایل‌های عمومی سایت ذخیره نمی‌شود. برای ورود امن، سرویس احراز هویت باید فعال باشد.</p></div></div>' +
    '<div class="shadi-modal" id="feedbackModal" role="dialog" aria-modal="true" aria-labelledby="feedbackTitle">' +
      '<div class="shadi-modal-card"><div class="shadi-modal-head"><div><h2 id="feedbackTitle">ارسال بازخورد</h2><p>پیامت فقط برای بررسی تیم مدیریت ثبت می‌شود.</p></div><button class="shadi-close" type="button" data-close="feedbackModal" aria-label="بستن">×</button></div>' +
      '<form id="feedbackForm" class="shadi-form"><label>موضوع<select name="category" required><option value="پیشنهاد">پیشنهاد</option><option value="گزارش خطا">گزارش خطا</option><option value="نظر درباره سایت">نظر درباره سایت</option><option value="مشکل سرور">مشکل سرور</option></select></label><label>پیام<textarea name="message" required minlength="8" maxlength="1200" placeholder="جزئیات را اینجا بنویس…"></textarea></label><button class="shadi-submit" type="submit">ارسال بازخورد</button></form><p class="shadi-status" id="feedbackStatus" aria-live="polite">برای ارسال بازخورد باید وارد حساب کاربری شده باشی.</p></div></div>' +
    '<div class="shadi-modal" id="adminModal" role="dialog" aria-modal="true" aria-labelledby="adminTitle">' +
      '<div class="shadi-modal-card wide"><div class="shadi-modal-head"><div><h2 id="adminTitle">پنل مدیریت SHADI SMP</h2><p>این بخش فقط برای حساب‌هایی باز می‌شود که مدیر اصلی در پایگاه‌داده مجاز کرده باشد.</p></div><button class="shadi-close" type="button" data-close="adminModal" aria-label="بستن">×</button></div>' +
      '<p class="shadi-status" id="adminStatus" aria-live="polite">در حال بررسی دسترسی مدیر…</p>' +
      '<div id="adminContent" class="shadi-hidden"><div class="shadi-admin-stats"><div class="shadi-stat">حساب‌های ثبت‌شده <b id="adminUserCount">—</b></div><div class="shadi-stat">آخرین بازخوردها <b id="adminFeedbackCount">—</b></div></div>' +
      '<form id="adminSettingsForm" class="shadi-form"><div class="shadi-admin-grid"><label>آدرس سرور<input id="adminServerAddress" type="text" maxlength="120" placeholder="IP:PORT"></label><label>نسخه سرور<input id="adminServerVersion" type="text" maxlength="40" value="Paper 26.2"></label><label class="full">اطلاعیهٔ اصلی سایت<input id="adminAnnouncement" type="text" maxlength="220" placeholder="متن اطلاعیه (اختیاری)"></label></div><button class="shadi-submit" type="submit">ذخیره تنظیمات سایت</button></form>' +
      '<h3 style="font-size:15px;margin:24px 0 8px">بازخوردهای بازیکنان</h3><div id="adminFeedbackList" class="shadi-feedback-list"></div></div></div></div>';

  const main = document.querySelector('main');
  if (main && !byId('feedback')) {
    const finalCta = main.querySelector('.final-cta');
    if (finalCta) finalCta.insertAdjacentHTML('afterend', modalMarkup.split('<div class="shadi-modal" id="accountModal"')[0]);
    else main.insertAdjacentHTML('beforeend', modalMarkup.split('<div class="shadi-modal" id="accountModal"')[0]);
  }
  if (!byId('accountModal')) document.body.insertAdjacentHTML('beforeend', modalMarkup.slice(modalMarkup.indexOf('<div class="shadi-modal" id="accountModal"')));
  const footer = document.querySelector('.footer-inner');
  if (footer && !byId('footerFeedback')) {
    const link = document.createElement('a');
    link.id = 'footerFeedback';
    link.href = '#feedback';
    link.textContent = 'Feedback';
    link.addEventListener('click', (event) => { event.preventDefault(); openModal('feedbackModal'); });
    footer.appendChild(link);
  }

  function openModal(id) {
    const modal = byId(id);
    if (!modal) return;
    modal.classList.add('is-open');
    document.body.classList.add('shadi-modal-open');
  }
  function closeModal(id) {
    const modal = byId(id);
    if (modal) modal.classList.remove('is-open');
    if (!document.querySelector('.shadi-modal.is-open')) document.body.classList.remove('shadi-modal-open');
  }
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.getAttribute('data-close'))));
  document.querySelectorAll('.shadi-modal').forEach((modal) => modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal(modal.id);
  }));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') document.querySelectorAll('.shadi-modal.is-open').forEach((modal) => closeModal(modal.id));
  });

  addNavLink('accountNav', 'حساب کاربری', () => openModal('accountModal'));
  addNavLink('feedbackNav', 'Feedback', () => openModal('feedbackModal'));
  const adminNav = byId('adminNav');
  const feedbackOpen = byId('feedbackOpen');
  if (feedbackOpen) feedbackOpen.addEventListener('click', () => openModal('feedbackModal'));

  document.querySelectorAll('[data-auth-tab]').forEach((button) => button.addEventListener('click', () => {
    const register = button.getAttribute('data-auth-tab') === 'register';
    document.querySelectorAll('[data-auth-tab]').forEach((tab) => tab.classList.toggle('active', tab === button));
    if (byId('loginForm')) byId('loginForm').classList.toggle('shadi-hidden', register);
    if (byId('registerForm')) byId('registerForm').classList.toggle('shadi-hidden', !register);
  }));

  let supabaseClient = null;
  let currentUser = null;
  let currentIsAdmin = false;
  const accountStatus = byId('accountStatus');
  const feedbackStatus = byId('feedbackStatus');
  const adminStatus = byId('adminStatus');

  function showStatus(node, message, kind) {
    if (!node) return;
    node.textContent = message;
    node.classList.remove('error', 'success');
    if (kind) node.classList.add(kind);
  }
  function updateAccountLabel() {
    const link = byId('accountNav');
    if (link) safeText(link, currentUser ? 'حساب: ' + (currentUser.user_metadata?.username || currentUser.email || 'کاربر') : 'حساب کاربری');
    const logout = byId('logoutButton');
    if (logout) logout.classList.toggle('shadi-hidden', !currentUser);
  }
  async function checkAdmin() {
    currentIsAdmin = false;
    if (!supabaseClient || !currentUser) return false;
    const result = await supabaseClient.from('site_admins').select('user_id').eq('user_id', currentUser.id).maybeSingle();
    currentIsAdmin = !result.error && !!result.data;
    return currentIsAdmin;
  }
  async function setCurrentUser(user) {
    currentUser = user || null;
    await checkAdmin();
    updateAccountLabel();
    // Clear private admin data immediately after logout or an account switch.
    if (!currentIsAdmin) {
      const adminContent = byId('adminContent');
      const feedbackList = byId('adminFeedbackList');
      if (adminContent) adminContent.classList.add('shadi-hidden');
      if (feedbackList) feedbackList.replaceChildren();
      safeText(byId('adminUserCount'), '—');
      safeText(byId('adminFeedbackCount'), '—');
    }
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

  async function loadAdminData() {
    const settings = await supabaseClient.from('site_settings').select('key,value').in('key', ['server.address','server.version','site.announcement']);
    if (!settings.error && Array.isArray(settings.data)) {
      const values = {};
      settings.data.forEach((item) => { values[item.key] = item.value; });
      if (byId('adminServerAddress')) byId('adminServerAddress').value = typeof values['server.address'] === 'string' ? values['server.address'] : '';
      if (byId('adminServerVersion')) byId('adminServerVersion').value = typeof values['server.version'] === 'string' ? values['server.version'] : 'Paper 26.2';
      if (byId('adminAnnouncement')) byId('adminAnnouncement').value = typeof values['site.announcement'] === 'string' ? values['site.announcement'] : '';
    }
    const users = await supabaseClient.from('profiles').select('id', { count: 'exact', head: true });
    if (byId('adminUserCount')) safeText(byId('adminUserCount'), users.count == null ? '—' : users.count);
    const feedback = await supabaseClient.from('site_feedback').select('id,user_id,category,message,created_at').order('created_at', { ascending: false }).limit(30);
    const list = byId('adminFeedbackList');
    if (list) {
      list.replaceChildren();
      if (feedback.error) {
        const p = document.createElement('p');
        p.className = 'shadi-hint';
        p.textContent = 'دریافت بازخوردها انجام نشد؛ تنظیمات دسترسی پایگاه‌داده را بررسی کن.';
        list.appendChild(p);
      } else if (!feedback.data || feedback.data.length === 0) {
        const p = document.createElement('p');
        p.className = 'shadi-hint';
        p.textContent = 'هنوز بازخوردی ثبت نشده است.';
        list.appendChild(p);
      } else {
        feedback.data.forEach((item) => {
          const card = document.createElement('article');
          card.className = 'shadi-feedback-item';
          const title = document.createElement('strong');
          title.textContent = item.category || 'Feedback';
          const body = document.createElement('p');
          body.textContent = item.message || '';
          const date = document.createElement('small');
          date.textContent = new Date(item.created_at).toLocaleString('fa-IR');
          card.append(title, body, date);
          list.appendChild(card);
        });
      }
      if (byId('adminFeedbackCount')) safeText(byId('adminFeedbackCount'), feedback.data ? feedback.data.length : '—');
    }
  }

  async function openAdminPanel() {
    openModal('adminModal');
    const adminContent = byId('adminContent');
    if (adminContent) adminContent.classList.add('shadi-hidden');
    if (!supabaseClient) {
      showStatus(adminStatus, 'پنل آماده است، اما هنوز سرویس احراز هویت و پایگاه‌داده به سایت وصل نشده است. راهنما را در SUPABASE_SETUP.md ببین.', 'error');
      return;
    }
    if (!currentUser) {
      showStatus(adminStatus, 'برای ورود به مدیریت، ابتدا با حساب کاربری خودت وارد شو.', 'error');
      openModal('accountModal');
      return;
    }
    const allowed = await checkAdmin();
    if (!allowed) {
      showStatus(adminStatus, 'دسترسی رد شد: این حساب در فهرست مدیران مجاز نیست.', 'error');
      return;
    }
    showStatus(adminStatus, 'دسترسی مدیر تأیید شد.', 'success');
    if (adminContent) adminContent.classList.remove('shadi-hidden');
    await loadAdminData();
  }

  if (adminNav) adminNav.addEventListener('click', openAdminPanel);

  const loginForm = byId('loginForm');
  if (loginForm) loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
      showStatus(accountStatus, 'ورود واقعی هنوز فعال نشده است؛ ابتدا پروژهٔ Supabase را طبق راهنمای مخزن وصل کن.', 'error');
      return;
    }
    const form = new FormData(loginForm);
    const result = await supabaseClient.auth.signInWithPassword({ email: String(form.get('email')).trim(), password: String(form.get('password')) });
    if (result.error) {
      showStatus(accountStatus, 'ورود انجام نشد؛ ایمیل و رمز عبور را بررسی کن.', 'error');
      return;
    }
    await setCurrentUser(result.data.user);
    showStatus(accountStatus, 'با موفقیت وارد حساب شدی.', 'success');
  });

  const registerForm = byId('registerForm');
  if (registerForm) registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
      showStatus(accountStatus, 'ثبت‌نام واقعی هنوز فعال نشده است؛ ابتدا پروژهٔ Supabase را طبق راهنمای مخزن وصل کن.', 'error');
      return;
    }
    const form = new FormData(registerForm);
    const username = String(form.get('username')).trim();
    const email = String(form.get('email')).trim();
    const password = String(form.get('password'));
    if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
      showStatus(accountStatus, 'نام کاربری باید ۳ تا ۱۶ حرف انگلیسی، عدد یا زیرخط باشد.', 'error');
      return;
    }
    const result = await supabaseClient.auth.signUp({ email, password, options: { data: { username } } });
    if (result.error) {
      showStatus(accountStatus, 'ساخت حساب انجام نشد؛ شاید نام کاربری یا ایمیل قبلاً استفاده شده باشد.', 'error');
      return;
    }
    if (result.data.session) await setCurrentUser(result.data.user);
    showStatus(accountStatus, result.data.session ? 'حساب ساخته شد و وارد شدی.' : 'حساب ساخته شد؛ ایمیل تأیید را بررسی کن و بعد وارد شو.', 'success');
  });

  const logoutButton = byId('logoutButton');
  if (logoutButton) logoutButton.addEventListener('click', async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    await setCurrentUser(null);
    showStatus(accountStatus, 'از حساب خارج شدی.', 'success');
  });

  const feedbackForm = byId('feedbackForm');
  if (feedbackForm) feedbackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
      showStatus(feedbackStatus, 'ارسال آنلاین بازخورد بعد از اتصال پایگاه‌داده فعال می‌شود.', 'error');
      return;
    }
    if (!currentUser) {
      showStatus(feedbackStatus, 'برای ارسال بازخورد ابتدا وارد حساب کاربری شو.', 'error');
      openModal('accountModal');
      return;
    }
    const form = new FormData(feedbackForm);
    const result = await supabaseClient.from('site_feedback').insert({
      user_id: currentUser.id,
      category: String(form.get('category')),
      message: String(form.get('message')).trim()
    });
    if (result.error) {
      showStatus(feedbackStatus, 'ثبت بازخورد انجام نشد؛ دوباره تلاش کن.', 'error');
      return;
    }
    feedbackForm.reset();
    showStatus(feedbackStatus, 'بازخوردت با موفقیت برای مدیریت ارسال شد. ممنون!', 'success');
  });

  const adminSettingsForm = byId('adminSettingsForm');
  if (adminSettingsForm) adminSettingsForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!supabaseClient || !currentIsAdmin) return;
    const entries = [
      { key: 'server.address', value: byId('adminServerAddress').value.trim() },
      { key: 'server.version', value: byId('adminServerVersion').value.trim() },
      { key: 'site.announcement', value: byId('adminAnnouncement').value.trim() }
    ];
    const result = await supabaseClient.from('site_settings').upsert(entries, { onConflict: 'key' });
    if (result.error) {
      showStatus(adminStatus, 'ذخیره تنظیمات انجام نشد؛ سطح دسترسی جدول را بررسی کن.', 'error');
      return;
    }
    await loadPublicSettings();
    showStatus(adminStatus, 'تنظیمات سایت با موفقیت ذخیره شد.', 'success');
  });

  async function initAuth() {
    try {
      await loadScript('./auth-config.js');
      const config = window.SHADI_SUPABASE_CONFIG || {};
      if (!config.url || !config.anonKey) {
        showStatus(accountStatus, 'ظاهر حساب کاربری آماده است؛ برای فعال شدن ورود و ثبت‌نام واقعی باید آدرس پروژه و کلید عمومی Supabase در auth-config.js قرار بگیرد.', 'error');
        showStatus(adminStatus, 'پنل مدیریت تا زمان اتصال پایگاه‌داده غیرفعال است.', 'error');
        showStatus(feedbackStatus, 'ارسال آنلاین Feedback پس از اتصال پایگاه‌داده فعال می‌شود.', 'error');
        return;
      }
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      if (!window.supabase || !window.supabase.createClient) throw new Error('supabase_sdk_unavailable');
      supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      const session = await supabaseClient.auth.getSession();
      await setCurrentUser(session.data.session ? session.data.session.user : null);
      await loadPublicSettings();
      supabaseClient.auth.onAuthStateChange((_event, sessionData) => {
        setCurrentUser(sessionData ? sessionData.user : null);
      });
      showStatus(accountStatus, currentUser ? 'وارد حساب کاربری هستی.' : 'برای ورود یا ساخت حساب، فرم را تکمیل کن.', 'success');
      showStatus(feedbackStatus, currentUser ? 'می‌توانی بازخوردت را ارسال کنی.' : 'برای ارسال بازخورد ابتدا وارد حساب کاربری شو.');
    } catch (error) {
      showStatus(accountStatus, 'اتصال سرویس حساب کاربری برقرار نشد؛ تنظیمات و دسترسی شبکه را بررسی کن.', 'error');
      showStatus(adminStatus, 'پنل مدیریت فعلاً به سرویس احراز هویت دسترسی ندارد.', 'error');
    }
  }

  loadServerConfig();
  initAuth();
})();