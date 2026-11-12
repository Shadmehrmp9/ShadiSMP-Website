const addressEl = document.getElementById('serverAddress');
const versionEl = document.getElementById('serverVersion');
const copyButton = document.getElementById('copyIp');
const copyLabel = document.getElementById('copyLabel');

async function loadServerConfig() {
  try {
    const response = await fetch('./server.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Server configuration unavailable');
    const config = await response.json();
    const address = typeof config.address === 'string' ? config.address.trim() : '';

    if (address) {
      addressEl.textContent = address;
      copyButton.disabled = false;
    } else {
      addressEl.textContent = 'آدرس سرور به‌زودی اعلام می‌شود';
      copyButton.disabled = true;
    }

    if (config.version) versionEl.textContent = 'نسخه: ' + config.version;
  } catch (error) {
    addressEl.textContent = 'آدرس سرور فعلاً در دسترس نیست';
    copyButton.disabled = true;
  }
}

copyButton.addEventListener('click', async () => {
  const address = addressEl.textContent.trim();
  if (!address || copyButton.disabled) return;

  try {
    await navigator.clipboard.writeText(address);
    copyLabel.textContent = 'آدرس کپی شد';
    copyButton.querySelector('.copy-icon').textContent = '✓';
    window.setTimeout(() => {
      copyLabel.textContent = 'کپی آدرس سرور';
      copyButton.querySelector('.copy-icon').textContent = '▣';
    }, 1800);
  } catch (error) {
    copyLabel.textContent = 'کپی خودکار انجام نشد';
  }
});

const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

menuToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

loadServerConfig();