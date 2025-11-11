// /js/user-dashboard.js

// Helpers for the delete-account modal
function showDeleteModal() {
  const modal = document.getElementById('deleteModal');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');

  // focus the password field for accessibility
  const pwd = document.getElementById('deletePassword');
  if (pwd) pwd.focus();
}

function closeDeleteModal() {
  const modal = document.getElementById('deleteModal');
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');

  const pwd = document.getElementById('deletePassword');
  if (pwd) pwd.value = '';
}

document.addEventListener('DOMContentLoaded', () => {
  // Open/close modal buttons
  const openBtn = document.getElementById('open-delete-modal');
  const closeBtn = document.getElementById('close-delete-modal');

  if (openBtn) openBtn.addEventListener('click', showDeleteModal);
  if (closeBtn) closeBtn.addEventListener('click', closeDeleteModal);

  // Close modal when clicking outside its content
  const modal = document.getElementById('deleteModal');
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeDeleteModal();
    });
  }

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDeleteModal();
  });

  // Password confirmation validation for "Change Password"
  const newPasswordForm = document.querySelector('form[action="/user-dashboard/change-password"]');
  if (newPasswordForm) {
    newPasswordForm.addEventListener('submit', (e) => {
      const newPassword = /** @type {HTMLInputElement} */(document.getElementById('newPassword')).value;
      const confirmPassword = /** @type {HTMLInputElement} */(document.getElementById('confirmNewPassword')).value;

      if (newPassword !== confirmPassword) {
        e.preventDefault();
        alert('New passwords do not match!');
      }
    });
  }

  // Intercept deletes in the assessment list (replace inline onsubmit=confirm)
  document.querySelectorAll('form.delete-form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      const message = form.getAttribute('data-confirm') || 'Are you sure?';
      if (!window.confirm(message)) {
        e.preventDefault();
      }
    });
  });
});
