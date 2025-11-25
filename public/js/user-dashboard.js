// /js/user-dashboard.js

// Helpers for the delete-account modal
function showDeleteModal() {
  const modal = document.getElementById("deleteModal");
  if (!modal) return;
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");

  // focus the password field for accessibility
  const pwd = document.getElementById("deletePassword");
  if (pwd) pwd.focus();
}

function closeDeleteModal() {
  const modal = document.getElementById("deleteModal");
  if (!modal) return;
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");

  const pwd = document.getElementById("deletePassword");
  if (pwd) pwd.value = "";
}

document.addEventListener("DOMContentLoaded", () => {
  // Open/close modal buttons
  const openBtn = document.getElementById("open-delete-modal");
  const closeBtn = document.getElementById("close-delete-modal");

  if (openBtn) openBtn.addEventListener("click", showDeleteModal);
  if (closeBtn) closeBtn.addEventListener("click", closeDeleteModal);

  // Close modal when clicking outside its content
  const modal = document.getElementById("deleteModal");
  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeDeleteModal();
    });
  }

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDeleteModal();
  });

  // Password confirmation validation for "Change Password"
  const newPasswordForm = document.querySelector(
    'form[action="/user-dashboard/change-password"]'
  );
  if (newPasswordForm) {
    newPasswordForm.addEventListener("submit", (e) => {
      const newPassword = /** @type {HTMLInputElement} */ (
        document.getElementById("newPassword")
      ).value;
      const confirmPassword = /** @type {HTMLInputElement} */ (
        document.getElementById("confirmNewPassword")
      ).value;

      if (newPassword !== confirmPassword) {
        e.preventDefault();
        alert("New passwords do not match!");
      }
    });
  }

  // Intercept deletes in the assessment list (replace inline onsubmit=confirm)
  document.querySelectorAll("form.delete-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      const message = form.getAttribute("data-confirm") || "Are you sure?";
      if (!window.confirm(message)) {
        e.preventDefault();
      }
    });
  });
  // =========================
  // 3. Appointment Details Modal
  // =========================
  var detailButtons = document.querySelectorAll(".appointment-details-btn");
  var apptModal = document.getElementById("appointmentDetailsModal");
  var closeApptModalBtn = document.getElementById("close-appointment-modal");

  if (apptModal && detailButtons.length > 0) {
    var nameEl = document.getElementById("appointmentName");
    var emailEl = document.getElementById("appointmentEmail");
    var dateEl = document.getElementById("appointmentDate");
    var timeEl = document.getElementById("appointmentTime");
    var locationEl = document.getElementById("appointmentLocation");
    var statusEl = document.getElementById("appointmentStatus");
    var notesEl = document.getElementById("appointmentNotes");

    function openAppointmentModal(btn) {
      if (!btn) return;

      if (nameEl) nameEl.textContent = btn.getAttribute("data-name") || "—";
      if (emailEl) emailEl.textContent = btn.getAttribute("data-email") || "—";
      if (dateEl) dateEl.textContent = btn.getAttribute("data-date") || "—";
      if (timeEl) timeEl.textContent = btn.getAttribute("data-time") || "—";
      if (locationEl)
        locationEl.textContent = btn.getAttribute("data-location") || "—";
      if (statusEl)
        statusEl.textContent = btn.getAttribute("data-status") || "—";
      if (notesEl) notesEl.textContent = btn.getAttribute("data-notes") || "—";

      // actually show modal (same pattern as deleteModal)
      apptModal.style.display = "flex";
      apptModal.setAttribute("aria-hidden", "false");
    }

    function closeAppointmentModal() {
      apptModal.style.display = "none";
      apptModal.setAttribute("aria-hidden", "true");
    }

    // Attach click handlers to each Details button
    detailButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        openAppointmentModal(btn);
      });
    });

    if (closeApptModalBtn) {
      closeApptModalBtn.addEventListener("click", function () {
        closeAppointmentModal();
      });
    }

    // close when clicking on backdrop
    apptModal.addEventListener("click", function (e) {
      if (e.target === apptModal) {
        closeAppointmentModal();
      }
    });

    // close on ESC
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeAppointmentModal();
      }
    });
  }
});
