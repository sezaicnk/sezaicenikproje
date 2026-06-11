async function handleAdminLogin(event) {
  event.preventDefault();

  const alertEl = document.getElementById('loginAlert');
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;

  try {
    const data = await loginAdmin(username, password);
    window.location.href = 'index.html';
  } catch (error) {
    if (alertEl) {
      alertEl.textContent = error.message;
      alertEl.classList.remove('hidden');
    }
  }
}

function initLoginPage() {
  const form = document.getElementById('adminLoginForm');
  if (form) {
    form.addEventListener('submit', handleAdminLogin);
  }

  // Display URL-based OAuth/login errors
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  if (error) {
    const alertEl = document.getElementById('loginAlert');
    if (alertEl) {
      alertEl.textContent = 'Giriş Başarısız: ' + decodeURIComponent(error);
      alertEl.classList.remove('hidden');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
  initLoginPage();
}
