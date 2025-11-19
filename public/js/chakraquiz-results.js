(function(){
  const form = document.getElementById('filters');
  const q = document.getElementById('q');
  if (!form) return;

  // 1) Debounce search input
  if (q) {
    let t = null;
    q.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => form.submit(), 400);
    });
  }

  // 2) Auto-submit on any other filter change (selects, checkboxes, date inputs)
  form.addEventListener('change', (e) => {
    // Ignore the search input here (it already debounces)
    if (e.target === q) return;
    form.submit();
  });
})();

/* Delete Clients */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') return fn();
    document.addEventListener('DOMContentLoaded', fn);
  }
  ready(function () {
    const bulkForm = document.getElementById('bulkDeleteForm');  
    const selectAll = document.getElementById('selectAll');
    const deleteBtn = document.getElementById('deleteBtn');
    if (!bulkForm) return;

    const rowChecks = () => Array.from(bulkForm.querySelectorAll('input[name="ids[]"]'));

    function updateBtn() {
      deleteBtn.disabled = !rowChecks().some(cb => cb.checked);
    }
    if (selectAll) selectAll.addEventListener('change', () => {
      rowChecks().forEach(cb => cb.checked = selectAll.checked);
      updateBtn();
    });
    bulkForm.addEventListener('change', (e) => {
      if (e.target && e.target.name === 'ids[]') {
        if (!e.target.checked && selectAll) selectAll.checked = false;
        updateBtn();
      }
    });
    bulkForm.addEventListener('submit', (e) => {
      if (!rowChecks().some(cb => cb.checked)) e.preventDefault();
      else if (!window.confirm('Delete selected records? This cannot be undone.')) e.preventDefault();
    });
    updateBtn();
  });
})();
