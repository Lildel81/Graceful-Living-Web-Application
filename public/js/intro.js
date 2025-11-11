// Show modal on button click
document.getElementById("start-assessment-btn").onclick = function () {
    document.getElementById("terms-modal").style.display = "flex";
    document.body.style.overflow = "hidden";
    // Ensure the modal state is reset whenever it opens
    document.getElementById("terms-checkbox").checked = false;
    document.getElementById("terms-checkbox").disabled = true;
    document.getElementById("continue-btn").disabled = true;
    document.getElementById("terms-scroll").scrollTop = 0;
};

// Close modal
document.getElementById("close-modal-btn").onclick = function () {
    document.getElementById("terms-modal").style.display = "none";
    document.body.style.overflow = "";
    // Reset modal state
    document.getElementById("terms-checkbox").checked = false;
    document.getElementById("terms-checkbox").disabled = true;
    document.getElementById("continue-btn").disabled = true;
    document.getElementById("terms-scroll").scrollTop = 0;
};

// Enable checkbox after scrolling to bottom
document.getElementById("terms-scroll").addEventListener("scroll", function () {
    var el = this;
    // Check if the user is at the bottom (within a 2px tolerance for precision issues)
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        document.getElementById("terms-checkbox").disabled = false;
    }
});

// Enable/Disable continue button when checkbox is checked/unchecked
document
    .getElementById("terms-checkbox")
    .addEventListener("change", function () {
        document.getElementById("continue-btn").disabled = !this.checked;
    });