// /public/js/clientmanagement.js
window.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('cmUserFilter');
  const table = document.getElementById('cmUsersTable');
  if (!input || !table || !table.tBodies || !table.tBodies[0]) return;

  const rows = Array.from(table.tBodies[0].rows).map((row) => {
    const first = (row.cells[0]?.textContent || '').toLowerCase();
    const last  = (row.cells[1]?.textContent || '').toLowerCase();
    const phone = (row.cells[2]?.textContent || '').toLowerCase();
    const email = (row.cells[3]?.textContent || '').toLowerCase();
    return { row, text: `${first} ${last} ${phone} ${email}` };
  });

  function apply() {
    const q = input.value.trim().toLowerCase();
    for (const { row, text } of rows) {
      row.style.display = (!q || text.includes(q)) ? '' : 'none';
    }
  }

  input.addEventListener('input', apply);
  apply();
});

