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
      await loginAdmin(formData.email, formData.password);
      showRegisterAlert('Kayıt başarıyla oluşturuldu. Ana sayfaya yönlendiriliyorsunuz...', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 800);
    } catch (error) {
      showRegisterAlert(error.message, 'error');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRegister);
} else {
  initRegister();
}
