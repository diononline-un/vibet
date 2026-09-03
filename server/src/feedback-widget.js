(function () {
  var projectId = (window.__VIBET && window.__VIBET.projectId) || "";
  if (!projectId) return;

  var pinMode = false;
  var lastPin = null;

  var btn = document.createElement("button");
  btn.textContent = "Feedback";
  btn.style.cssText =
    "position:fixed;bottom:12px;right:12px;z-index:2147483000;background:#111;color:#eee;border:1px solid #333;border-radius:6px;padding:8px 14px;font:12px/1 monospace;cursor:pointer;opacity:.85";
  btn.onclick = function (e) {
    e.stopPropagation();
    pinMode = !pinMode;
    btn.textContent = pinMode ? "Click target (Esc to cancel)" : "Feedback";
    btn.style.background = pinMode ? "#2a1a1a" : "#111";
  };
  document.body.appendChild(btn);

  var panel = document.createElement("div");
  panel.style.cssText =
    "display:none;position:fixed;bottom:12px;right:12px;z-index:2147483001;background:#111;color:#eee;border:1px solid #333;border-radius:8px;padding:12px;width:300px;font:12px/1.4 monospace";
  panel.innerHTML =
    '<div style="margin-bottom:6px">Wish for ' +
    projectId +
    "</div>" +
    '<textarea id="__vibet_note" rows="4" style="width:100%;box-sizing:border-box;background:#1c1c1c;color:#eee;border:1px solid #333;border-radius:4px;font:12px monospace"></textarea>' +
    '<div id="__vibet_ctx" style="margin:6px 0;color:#8a8a8a;font-size:10px"></div>' +
    '<div style="display:flex;gap:6px;justify-content:flex-end">' +
    '<button id="__vibet_cancel" style="background:#222;color:#ccc;border:1px solid #333;border-radius:4px;padding:4px 10px;cursor:pointer">Cancel</button>' +
    '<button id="__vibet_save" style="background:#3a1f1f;color:#eee;border:1px solid #555;border-radius:4px;padding:4px 10px;cursor:pointer">Save</button>' +
    "</div>";
  document.body.appendChild(panel);

  var note = panel.querySelector("#__vibet_note");
  var ctx = panel.querySelector("#__vibet_ctx");

  function hidePanel() {
    panel.style.display = "none";
    pinMode = false;
    btn.textContent = "Feedback";
    btn.style.background = "#111";
  }

  panel.querySelector("#__vibet_cancel").onclick = hidePanel;
  panel.querySelector("#__vibet_save").onclick = function () {
    var text = note.value.trim();
    if (!text) return;
    var payload = {
      note: text,
      path: location.pathname,
      url: location.href,
      title: document.title,
    };
    if (lastPin) payload.pin = lastPin;
    fetch("/api/projects/" + projectId + "/wishes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        note.value = "";
        hidePanel();
        toast("Wish saved");
      })
      .catch(function () {
        toast("Failed to save wish");
      });
  };

  document.addEventListener(
    "click",
    function (e) {
      if (!pinMode) return;
      if (panel.contains(e.target) || btn.contains(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      var el = e.target;
      var tag = el.tagName ? el.tagName.toLowerCase() : "";
      var classes = (el.className && typeof el.className === "string" ? el.className : "").split(/\s+/).slice(0, 6).join(".");
      lastPin = {
        x: Math.round((e.clientX / window.innerWidth) * 100),
        y: Math.round((e.clientY / window.innerHeight) * 100),
        element: tag + (el.id ? "#" + el.id : "") + (classes ? "." + classes : ""),
        text: (el.textContent || "").trim().slice(0, 80),
      };
      ctx.textContent = lastPin.element + " @" + lastPin.x + "%, " + lastPin.y + "%";
      panel.style.display = "block";
      note.focus();
    },
    true
  );

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") hidePanel();
  });

  function toast(msg) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText =
      "position:fixed;top:12px;right:12px;z-index:2147483002;background:#111;color:#8a8a8a;border:1px solid #333;border-radius:6px;padding:8px 12px;font:12px monospace";
    document.body.appendChild(t);
    setTimeout(function () {
      t.remove();
    }, 2500);
  }
})();
