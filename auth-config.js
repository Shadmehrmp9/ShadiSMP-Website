// فقط مقادیر عمومی Supabase را اینجا قرار بده.
// هرگز service_role key یا رمز عبور را در این فایل ننویس.
window.SHADI_SUPABASE_CONFIG = {
  url: '',
  anonKey: ''
};

// تا پیش از اتصال دیتابیس، Feedback به صفحهٔ ثبت گزارش GitHub هدایت می‌شود.
// با تنظیم Supabase، ارسال بازخورد به‌صورت مستقیم از داخل سایت انجام خواهد شد.
document.addEventListener('submit', function (event) {
  const form = event.target;
  if (!form || form.id !== 'feedbackForm' || (window.SHADI_SUPABASE_CONFIG && window.SHADI_SUPABASE_CONFIG.url)) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const data = new FormData(form);
  const category = String(data.get('category') || 'Feedback').trim();
  const message = String(data.get('message') || '').trim();
  if (message.length < 8) return;

  const issueUrl = new URL('https://github.com/Shadmehrmp9/ShadiSMP-Website/issues/new');
  issueUrl.searchParams.set('title', '[Website Feedback] ' + category);
  issueUrl.searchParams.set('body', 'بازخورد ارسالی از سایت SHADI SMP\\n\\nموضوع: ' + category + '\\n\\nپیام:\\n' + message);
  window.open(issueUrl.toString(), '_blank', 'noopener,noreferrer');

  const status = document.getElementById('feedbackStatus');
  if (status) {
    status.textContent = 'پیش‌نویس بازخورد در GitHub باز شد؛ برای ثبت نهایی باید آن را در GitHub ارسال کنی.';
    status.classList.remove('error');
    status.classList.add('success');
  }
}, true);
