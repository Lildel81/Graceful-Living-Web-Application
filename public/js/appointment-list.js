console.log("[appointment-list] script loaded");

(function () {
  const listEl = document.getElementById("ap-list");
  if (!listEl) return;

  function fmt(dt) {
    const d = new Date(dt);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function card(item) {
    const isZoom = item.location_type === "zoom";
    const join = item?.zoom?.join_url;
    const start = item?.zoom?.start_url;

    return `
      <article class="gl-card">
        <div class="gl-card-left"></div>
        <div class="gl-card-body">
          <div class="gl-card-title">${item.title || "Session"}</div>
          <div class="gl-card-sub">
            ${fmt(item.start)} • ${item.duration || 30} mins • ${
      item.clientName || ""
    } ${item.clientEmail ? `&lt;${item.clientEmail}&gt;` : ""}
          </div>
          <div class="gl-card-sub">
            Type: ${item.location_type}${
      isZoom && join
        ? ` • <a href="${join}" target="_blank" rel="noopener">Join link</a>`
        : ""
    }
          </div>
        </div>
        <div class="gl-card-actions">
          ${
            isZoom && start
              ? `<a class="gl-btn gl-btn-ghost" href="${start}" target="_blank" rel="noopener">Start</a>`
              : ""
          }
        </div>
      </article>
    `;
  }

  async function load() {
    try {
      const resp = await fetch("/appointments", {
        headers: { Accept: "application/json" },
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || "Failed");

      if (!data.items.length) {
        listEl.innerHTML = `<p style="opacity:.7;margin:12px 0">No upcoming appointments.</p>`;
        return;
      }

      listEl.innerHTML = data.items.map(card).join("");
    } catch (e) {
      console.error("[appointment-list] load error:", e);
      listEl.innerHTML = `<p style="color:#b00">Failed to load appointments.</p>`;
    }
  }

  // open edit modal when clicking "Edit"
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".ap-edit");
    if (!btn) return;
    e.preventDefault();
    if (window.openEditModal) {
      window.openEditModal({
        id: btn.dataset.id,
        date: btn.dataset.date,
        time: btn.dataset.time,
        duration: btn.dataset.duration,
      });
    }
  });

  // expose for modal to refresh after creating
  window.refreshAppointments = load;

  // initial
  load();

  function card(item) {
    const isZoom = item.location_type === "zoom";
    const join = item?.zoom?.join_url;
    const start = item?.zoom?.start_url;

    // Preformat current values for the modal
    const dt = new Date(item.start);
    const dateVal = dt.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeVal = dt.toTimeString().slice(0, 5); // HH:mm

    return `
    <article class="gl-card" data-id="${item._id}">
      <div class="gl-card-left"></div>
      <div class="gl-card-body">
        <div class="gl-card-title">${item.title || "Session"}</div>
        <div class="gl-card-sub">
          ${fmt(item.start)} • ${item.duration || 30} mins • ${
      item.clientName || ""
    } ${item.clientEmail ? `&lt;${item.clientEmail}&gt;` : ""}
        </div>
        <div class="gl-card-sub">
          Type: ${item.location_type}${
      isZoom && join
        ? ` • <a href="${join}" target="_blank" rel="noopener">Join link</a>`
        : ""
    }
        </div>
      </div>
      <div class="gl-card-actions">
        ${
          isZoom && start
            ? `<a class="gl-btn gl-btn-ghost" href="${start}" target="_blank" rel="noopener">Start</a>`
            : ""
        }
        <button class="gl-btn gl-btn-ghost ap-edit"
                data-id="${item._id}"
                data-date="${dateVal}"
                data-time="${timeVal}"
                data-duration="${item.duration || 30}">
          Edit
        </button>
      </div>
    </article>
  `;
  }
})();
