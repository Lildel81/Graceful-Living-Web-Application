(function () {
  const input = document.getElementById('image');
  if (!input) return;

  const err  = document.getElementById('imageError');
  const wrap = document.getElementById('imagePreview');
  const img  = document.getElementById('imageThumb');
  const meta = document.getElementById('imageMeta');
  const clearBtn = document.getElementById('clearImage');

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const OK_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

  function resetPreview(msg) {
    if (wrap) wrap.style.display = 'none';
    if (img) img.src = '';
    if (meta) meta.textContent = '';
    if (err) {
      err.textContent = msg || '';
      err.style.display = msg ? 'block' : 'none';
    }
  }

  input.addEventListener('change', () => {
    resetPreview();
    const file = input.files && input.files[0];
    if (!file) return;

    if (!OK_TYPES.includes(file.type)) {
      resetPreview('Only PNG, JPG/JPEG, WEBP, or GIF files are allowed.');
      input.value = '';
      return;
    }
    if (file.size > MAX_SIZE) {
      resetPreview('Image too large (max 5MB). Please choose a smaller file.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      if (img) img.src = e.target.result;
      if (meta) meta.textContent = `${file.name} — ${Math.round(file.size/1024)} KB`;
      if (wrap) wrap.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      resetPreview();
    });
  }
})();
