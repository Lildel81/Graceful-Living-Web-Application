document.addEventListener("DOMContentLoaded", () => {
  const yes = document.getElementById("hc-yes");
  const no = document.getElementById("hc-no");
  const box = document.getElementById("healthcare-details");
  const role = document.getElementById("healthcareRole");
  const yrs = document.getElementById("healthcareYears");

  function toggleHealthcareFields() {
    const show = yes && yes.checked;
    if (box) box.hidden = !show;
    if (role) role.required = show;
    if (yrs) yrs.required = show;
  }

  if (yes) yes.addEventListener("change", toggleHealthcareFields);
  if (no) no.addEventListener("change", toggleHealthcareFields);


  toggleHealthcareFields();
});
