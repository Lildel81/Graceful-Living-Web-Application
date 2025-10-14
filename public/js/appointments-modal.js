// public/js/appointments-modal.js
console.log("[appointments-modal] script loaded");

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("appointment-modal");
  if (!modal) {
    console.warn("[appointments-modal] #appointment-modal not found");
    return;
  }

  // Match your EJS: form has class 'ap-form' inside the modal
  const form = modal.querySelector("form.ap-form");
  if (!form) {
    console.warn("[appointments-modal] form.ap-form not found inside modal");
    return;
  }

  // Open/close hooks that match your EJS
  const openBtn = document.querySelector('[data-open="appointment-modal"]');
  const closeBtns = modal.querySelectorAll("[data-close]");

  // Use the 'hidden' attribute (your modal uses hidden on the <div>)
  function openModal() {
    modal.hidden = false;
    modal.classList.add("open");
  }
  function closeModal() {
    modal.hidden = true;
    modal.classList.remove("open");
  }

  openBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });

  closeBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      closeModal();
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // keep SPA experience
    console.log("[appointments-modal] submit intercepted");

    const fd = new FormData(form);
    const body = new URLSearchParams(fd); // x-www-form-urlencoded

    try {
      const resp = await fetch("/appointments", {
        method: "POST",
        headers: { Accept: "application/json" },
        body, // URLSearchParams sets Content-Type automatically
      });

      const data = await resp.json();

      if (resp.ok && data.ok) {
        closeModal();
        alert(data.message || "Appointment created");
        form.reset();
        window.refreshAppointments && window.refreshAppointments();
      } else {
        alert(data.error || "Failed to create appointment");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Network error. Please try again.");
    }
  });
});
