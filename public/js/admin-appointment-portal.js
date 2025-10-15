(function () {
  const nav = document.querySelector(".gl-nav");
  const sched = document.getElementById("view-scheduling");
  const integ = document.getElementById("view-integrations");
  const h1 = document.querySelector(".gl-topbar h1");
  if (!nav || !sched || !integ || !h1) return;

  function show(which) {
    const isIntegrations = which === "integrations";
    sched.hidden = isIntegrations;
    integ.hidden = !isIntegrations;
    nav.querySelectorAll("a[data-view]").forEach((a) => {
      const active = a.dataset.view === which;
      a.classList.toggle("active", active);
      a.setAttribute("aria-current", active ? "page" : "false");
    });
    h1.textContent = isIntegrations ? "Integrations & Apps" : "Scheduling";
    const p = new URLSearchParams(location.search);
    p.set("view", which);
    history.replaceState(null, "", location.pathname + "?" + p.toString());
  }

  nav.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-view]");
    if (!link) return;
    e.preventDefault();
    show(link.dataset.view);
  });

  const initial = new URLSearchParams(location.search).get("view");
  show(initial === "integrations" ? "integrations" : "scheduling");
})();

(async function () {
  try {
    const r = await fetch("/integrations/zoom/status", {
      credentials: "same-origin",
    });
    const s = await r.json();
    const tile = document.querySelector(".app"); // your Zoom tile element
    const actions = tile?.querySelector(".actions");

    if (s.connected && actions) {
      actions.innerHTML = `
        <span class="badge">Connected as ${s.email}</span>
        <a class="gl-btn" href="/integrations/zoom/disconnect">Disconnect</a>
      `;
    }
  } catch (e) {
    /* ignore */
  }
})();
