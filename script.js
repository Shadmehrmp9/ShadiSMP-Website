const addressEl = document.getElementById('serverAddress');
const versionEl = document.getElementById('serverVersion');
const copyButton = document.getElementById('copyIp');

async function loadServerConfig() {
  try {
    const response = await fetch('./server.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load server config');
    const config = await response.json();
    if (config.address && config.address.trim()) {
      addressEl.textContent = config.address;
      copyButton.disabled = false;
    } else {
      addressEl.textContent = 'آدرس سرور هنوز ثبت نشده';
      copyButton.disabled = true;
    }
    if (config.version) versionEl.textContent = 'نسخه: ' + config.version;
  } catch (error) {
    addressEl.textContent = 'مشکل در دریافت آدرس سرور';
    copyButton.disabled = true;
  }
}
copyButton.addEventListener('click', async () => {
  const address = addressEl.textContent.trim();
  if (!address || copyButton.disabled) return;
  try {
    await navigator.clipboard.writeText(address);
    copyButton.innerHTML = 'کپی شد! <span>✓</span>';
    setTimeout(() => { copyButton.innerHTML = 'کپی آدرس <span>▣</span>'; }, 1600);
  } catch {
    copyButton.textContent = address;
  }
});
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
menuToggle.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mainNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));
loadServerConfig();