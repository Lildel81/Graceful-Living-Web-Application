document.getElementById('forgot-password').addEventListener('click', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('reset-status');
    statusEl.textContent = 'Sending reset email...';

    try {
      const res = await fetch('/auth/reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // If you later collect an email from the user, add it here:
        // body: JSON.stringify({ email: document.getElementById('email').value })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        statusEl.textContent = 'Reset email sent (check your inbox).';
      } else {
        statusEl.textContent = data.error || 'Could not send reset email.';
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = 'Network error while sending reset email.';
    }
  });