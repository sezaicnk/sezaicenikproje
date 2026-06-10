const API_BASE = '';

async function apiRequest(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Kayıt sırasında hata oluştu');
  }
  return data;
}

async function registerUser(formData) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
}

function showRegisterAlert(message, type = 'error') {
  const alertEl = document.getElementById('registerAlert');
  if (!alertEl) return;
  alertEl.className = `alert alert-${type}`;
  alertEl.textContent = message;
  alertEl.classList.remove('hidden');
}

function initRegister() {
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      fullName: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      password: document.getElementById('password').value
    };

    try {
      await registerUser(formData);
      showRegisterAlert('Kayıt başarıyla oluşturuldu. Giriş sayfasına yönlendiriliyorsunuz...', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
    } catch (error) {
      showRegisterAlert(error.message, 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', initRegister);
