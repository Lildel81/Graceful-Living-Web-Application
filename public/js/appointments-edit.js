console.log("[appointments-edit] script loaded");

(function () {
  const modal = document.getElementById("edit-appointment-modal");
  if (!modal) return;

  const form = modal.querySelector("form");
  const closeEls = modal.querySelectorAll("[data-close]");

  function open() {
    modal.hidden = false;
    modal.classList.add("open");
  }
  function close() {
    modal.classList.remove("open");
    modal.hidden = true;
  }

  closeEls.forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      close();
    })
  );

  // Expose a helper so the list can open the modal prefilled
  window.openEditModal = ({ id, date, time, duration }) => {
    form.elements["id"].value = id;
    form.elements["date"].value = date;
    form.elements["time"].value = time;
    form.elements["duration"].value = duration || 30;
    open();
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = form.elements["id"].value;
    const date = form.elements["date"].value;
    const time = form.elements["time"].value;
    const duration = form.elements["duration"].value;
    const timezone = form.elements["timezone"]?.value || "America/Los_Angeles";

    try {
      const resp = await fetch(`/appointments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ date, time, duration, timezone }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || "Failed");

      close();
      if (window.refreshAppointments) window.refreshAppointments();
      alert(
        "Appointment updated" +
          (data.item?.location_type === "zoom" ? " (Zoom updated)" : "")
      );
    } catch (err) {
      console.error("Edit error:", err);
      alert("Failed to update appointment");
    }
  });
})();
