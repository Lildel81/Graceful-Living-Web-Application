document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("saveResultsModal");
  const closeBtn = document.getElementById("modalClose");

  if (modal) {
    modal.style.display = "flex"; // show modal

    // close modal on clicking "Continue Without Saving"
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });

    // optional: close modal when clicking outside the content
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  }
});