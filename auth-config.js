// Public Supabase settings only. Never place service_role keys or passwords here.
window.SHADI_SUPABASE_CONFIG = {
  url: '',
  anonKey: ''
};

// Do not send private feedback to public GitHub issues.
document.addEventListener('submit', function (event) {
  const form = event.target;
  const config = window.SHADI_SUPABASE_CONFIG || {};
  if (!form || form.id !== 'feedbackForm' || (config.url && config.anonKey)) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const status = document.getElementById('feedbackStatus');
  if (status) {
    status.textContent = 'ارسال امن بازخورد هنوز فعال نیست؛ پس از اتصال Supabase می‌توانی پیام را خصوصی برای مدیریت ارسال کنی.';
    status.classList.remove('success');
    status.classList.add('error');
  }
}, true);
