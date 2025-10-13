(function(){
  const form = document.getElementById('filters');
  const q = document.getElementById('q');
  if (!form || !q) return;

  let t = null;
  q.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => form.submit(), 400);
  });
})();