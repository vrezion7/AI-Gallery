import { KEY, sanitize, choose, acquire, ownedIds } from "./state.js";
const $ = (s) => document.querySelector(s),
  app = $("#app");
let registry,
  ids,
  state,
  memory = null,
  storageOK = true,
  busy = false,
  renderToken = 0,
  revealTimer,
  shownPending = null,
  currentRoute = "",
  positions = new Map(),
  viewerReturn = null;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function notice(message) {
  $("#notice").textContent = message;
  $("#notice").hidden = false;
}
function read() {
  if (!storageOK) return memory || sanitize(null, ids);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return memory || sanitize(null, ids);
    return sanitize(JSON.parse(raw), ids);
  } catch (e) {
    if (e instanceof SyntaxError) {
      notice(
        "Saved progress was unreadable. Valid progress could not be recovered.",
      );
      return memory || sanitize(null, ids);
    }
    storageOK = false;
    notice(
      "Browser storage is unavailable. Progress works in this tab only and may be lost on refresh.",
    );
    return memory || sanitize(null, ids);
  }
}
function write(next) {
  memory = next;
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    storageOK = false;
    notice(
      "Progress could not be saved. Keep this tab open; refreshing may lose your collection.",
    );
  }
}
const owned = () => ownedIds(state, registry);
const featuredCount = () =>
  Object.values(registry).filter((c) => c.featured).length;
const hiddenCount = () =>
  ids.length -
  featuredCount() -
  state.collectedIds.filter((id) => !registry[id].featured).length;
const visible = (c) => c && (c.featured || state.collectedIds.includes(c.id));
const route = () => location.hash.replace(/^#/, "") || "/archive";
function go(path) {
  if (route() === path) render();
  else location.hash = path;
}
function card(c) {
  return `<a class="card" href="#/character/${c.id}" aria-label="View ${esc(c.displayName)}"><figure><img src="${esc(c.card)}" alt="${esc(c.displayName)} character artwork" width="600" height="800" loading="lazy" decoding="async"></figure><div class="caption"><strong>${esc(c.displayName)}</strong><small>${c.featured ? "FEATURED" : "COLLECTED"}</small></div></a>`;
}
function safeImages() {
  app.querySelectorAll("img").forEach((img) =>
    img.addEventListener(
      "error",
      () => {
        const box = document.createElement("div");
        box.className = "image-error";
        box.textContent = "Artwork could not load. ";
        const b = document.createElement("button");
        b.textContent = "Retry image";
        b.onclick = () => {
          box.remove();
          img.hidden = false;
          img.src = img.getAttribute("src");
        };
        box.append(b);
        img.after(box);
        img.hidden = true;
      },
      { once: true },
    ),
  );
}
function archive() {
  const cards = Object.values(registry)
    .sort((a, b) => a.archiveOrder - b.archiveOrder)
    .map((c) =>
      visible(c)
        ? card(c)
        : '<div class="mystery-wrap"><button class="mystery" data-mystery aria-label="Unrevealed character. Discover through Summon"><b aria-hidden="true">?</b><span>UNREVEALED</span></button></div>',
    )
    .join("");
  return `<section class="intro"><p class="eyebrow">THE CHARACTER ARCHIVE</p><h1>A world waiting<br>to be discovered.</h1><p>Nine original characters. The featured three are already yours; summon to uncover the rest.</p></section><div class="stats"><span><strong>${owned().length} / ${ids.length}</strong> collected</span><span>${featuredCount()} featured · ${hiddenCount()} to discover</span></div><section class="grid" aria-label="Character archive">${cards}</section>`;
}
function concealed() {
  return '<section class="empty"><span class="sigil">?</span><h1>A mystery awaits.</h1><p>Discover this character through a free summon.</p><a class="button primary" href="#/summon">Go to Summon</a></section>';
}
function detail(id) {
  const c = registry[id];
  if (!c)
    return '<h1>Page not found</h1><a class="button" href="#/archive">Return to Archive</a>';
  if (!visible(c))
    return `<button class="back" data-back>← Back</button>${concealed()}`;
  return `<button class="back" data-back>← Back</button><section class="detail"><img class="portrait" src="${c.portrait}" alt="${esc(c.displayName)} portrait" width="800" height="1200" decoding="async"><div class="detail-copy"><p class="eyebrow">CHARACTER ARCHIVE</p><h1>${esc(c.displayName)}</h1>${c.displayName !== c.id ? `<p>${c.id}</p>` : ""}<p class="owned">${c.featured ? "Featured · In your collection" : "Collected · In your collection"}</p><p>${c.featured ? "A featured character, part of your collection from the start. Summon to discover the hidden ones." : "Explore the complete original artwork."}</p><a class="button primary" href="#/character/${id}/artwork">View Full Artwork ↗</a></div></section>`;
}
function collection() {
  let n = owned().length;
  return `<p class="eyebrow">YOUR DISCOVERIES</p><h1>My Collection</h1><div class="stats"><span><strong>${n} / ${ids.length}</strong> collected</span><span>Featured first, then discovery order</span></div><div class="progress" role="progressbar" aria-label="Collection progress" aria-valuemin="0" aria-valuemax="${ids.length}" aria-valuenow="${n}"><i style="width:${(n / ids.length) * 100}%"></i></div>${n === ids.length ? '<p class="owned">Collection Complete · Every character discovered.</p>' : ""}${
    n
      ? `<section class="grid" aria-label="Collected characters">${owned()
          .map((id) => card(registry[id]))
          .join("")}</section>`
      : '<div class="empty"><span class="sigil">✧</span><h2>Your first discovery awaits.</h2><p>Each summon reveals one new character. Your collection starts here.</p><a class="button primary" href="#/summon">Go to Summon</a></div>'
  }`;
}
function chamber() {
  return `<section class="summon"><p class="eyebrow">HOLOGRAPHIC GATEWAY</p><h1>Meet your next discovery.</h1><p>One summon. One new character.</p><div class="chamber" aria-hidden="true"><svg class="hologram" viewBox="0 0 200 240" fill="none" stroke="currentColor"><path d="M100 15 165 63v96l-65 65-65-65V63Z" opacity=".35"/><path d="m100 40 45 35v73l-45 48-45-48V75Z"/><path d="m100 65 25 46-25 52-25-52Z"/><path d="M35 63 165 159M165 63 35 159" opacity=".2"/><circle cx="100" cy="112" r="65" stroke-dasharray="2 8"/></svg></div><p class="owned">${owned().length} / ${ids.length} collected</p>${owned().length === ids.length ? '<h2>Collection Complete</h2><a class="button primary" href="#/collection">View Collection</a>' : '<button class="primary" id="pull">Summon ×1</button>'}<p class="summon-note">Always free · No duplicates · ${storageOK ? "Saved on this browser" : "Temporary tab-only progress"}</p></section>`;
}
async function locked(action) {
  if (navigator.locks)
    return navigator.locks.request(
      "ai-gallery-progress",
      { mode: "exclusive" },
      action,
    );
  const lockKey = KEY + ".lock",
    token = crypto.randomUUID?.() || String(Math.random());
  let obtained = false;
  try {
    const old = JSON.parse(localStorage.getItem(lockKey) || "null");
    if (old && old.until > Date.now())
      throw Error(
        "Another tab is updating your collection. Try again in a moment.",
      );
    localStorage.setItem(
      lockKey,
      JSON.stringify({ token, until: Date.now() + 3000 }),
    );
    await new Promise((r) => setTimeout(r, 60));
    obtained =
      JSON.parse(localStorage.getItem(lockKey) || "null")?.token === token;
    if (!obtained) throw Error("Another tab is summoning. Try again.");
    return await action();
  } catch (e) {
    if (
      !storageOK ||
      ["QuotaExceededError", "SecurityError"].includes(e.name)
    ) {
      storageOK = false;
      notice(
        "Browser storage is unavailable. Progress is temporary in this tab.",
      );
      return action();
    }
    throw e;
  } finally {
    if (obtained)
      try {
        if (
          JSON.parse(localStorage.getItem(lockKey) || "null")?.token === token
        )
          localStorage.removeItem(lockKey);
      } catch {}
  }
}
async function pull() {
  if (busy) return;
  busy = true;
  $("#pull")?.setAttribute("disabled", "");
  try {
    await locked(() => {
      state = read();
      if (state.pendingReveal) return;
      const id = choose(state, registry);
      if (id) write(acquire(state, id));
    });
    render();
  } catch (e) {
    notice(e.message);
  } finally {
    busy = false;
    $("#pull")?.removeAttribute("disabled");
  }
}
async function acknowledge() {
  await locked(() => {
    state = read();
    if (state.pendingReveal === shownPending)
      write({ ...state, pendingReveal: null });
  });
  shownPending = null;
}
async function reveal(token) {
  const id = state.pendingReveal,
    c = registry[id];
  shownPending = null;
  app.innerHTML = `<section class="summon"><p class="eyebrow">NEW DISCOVERY</p><div class="reveal"><button id="skip" class="skip">Skip</button><div id="reveal-art" class="loading" role="status">Preparing your artwork…</div></div><div class="result-copy"><h1>${esc(c.displayName)}</h1><p class="owned">New collection acquisition · ${owned().length} / ${ids.length}</p><div class="actions result-actions" hidden><button id="result-detail">View Character</button><button id="again" class="primary">${owned().length === ids.length ? "View Collection" : "Summon Again"}</button></div></div></section>`;
  let skip = matchMedia("(prefers-reduced-motion: reduce)").matches;
  $("#skip").onclick = () => {
    skip = true;
    if ($(".reveal img")) finish();
  };
  function finish() {
    if (token !== renderToken) return;
    clearTimeout(revealTimer);
    $(".reveal").classList.remove("playing");
    $("#skip").hidden = true;
    $(".result-actions").hidden = false;
    shownPending = id;
  }
  $("#result-detail").onclick = async () => {
    try {
      await acknowledge();
      go("/character/" + id);
    } catch (e) {
      notice(e.message);
    }
  };
  $("#again").onclick = async () => {
    try {
      await acknowledge();
      if (owned().length === ids.length) go("/collection");
      else render();
    } catch (e) {
      notice(e.message);
    }
  };
  const image = new Image();
  image.alt = c.id + " full original artwork";
  image.className = "splash";
  image.decoding = "async";
  image.src = c.splash;
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error("Artwork timeout")), 15000);
      const done = () => {
        clearTimeout(timeout);
        resolve();
      };
      const fail = () => {
        clearTimeout(timeout);
        reject();
      };
      if (image.complete) {
        image.naturalWidth ? done() : fail();
      } else {
        image.onload = done;
        image.onerror = fail;
      }
    });
    if (token !== renderToken) return;
    $("#reveal-art").replaceWith(image);
    if (skip) finish();
    else {
      $(".reveal").classList.add("playing");
      revealTimer = setTimeout(finish, 2250);
    }
  } catch {
    if (token !== renderToken) return;
    $("#reveal-art").innerHTML =
      '<p class="image-error">The artwork could not load. Your character is safely acquired.</p><button id="retry-reveal">Retry artwork</button>';
    $("#retry-reveal").onclick = () => render();
    $("#skip").textContent = "Continue without artwork";
    $("#skip").onclick = finish;
  }
}
function bind() {
  safeImages();
  app.querySelectorAll("[data-back]").forEach(
    (b) =>
      (b.onclick = () => {
        if (history.state?.from) history.back();
        else go("/archive");
      }),
  );
  app.querySelectorAll("[data-mystery]").forEach(
    (b) =>
      (b.onclick = () => {
        let d = $("#mystery-dialog");
        if (!d) {
          d = document.createElement("dialog");
          d.id = "mystery-dialog";
          d.innerHTML =
            '<button class="close" aria-label="Close mystery explanation">×</button>' +
            concealed();
          document.body.append(d);
          d.querySelector("button").onclick = () => d.close();
          d.querySelector("a").onclick = () => d.close();
        }
        d.showModal();
      }),
  );
  $("#pull")?.addEventListener("click", pull);
}
function render() {
  if (!registry) return;
  clearTimeout(revealTimer);
  const r = route(),
    art = /^\/character\/(G-\d{3})\/artwork$/.exec(r);
  state = read();
  if (art && visible(registry[art[1]])) {
    const base = "/character/" + art[1];
    if (!history.state?.viewerEntered) {
      history.replaceState(
        { gallery: true, from: currentRoute || null },
        "",
        "#" + base,
      );
      history.pushState(
        { gallery: true, from: base, viewerEntered: true },
        "",
        "#" + r,
      );
    }
    if (currentRoute !== base) {
      if (currentRoute) positions.set(currentRoute, scrollY);
      app.innerHTML = detail(art[1]);
      currentRoute = base;
      bind();
    }
    openViewer(art[1]);
    return;
  }
  if ($("#viewer").open) $("#viewer").close();
  if (currentRoute) positions.set(currentRoute, scrollY);
  const token = ++renderToken;
  currentRoute = r;
  history.replaceState({ ...history.state, gallery: true }, "");
  app.innerHTML =
    r === "/archive"
      ? archive()
      : r === "/collection"
        ? collection()
        : r === "/summon"
          ? chamber()
          : /^\/character\/G-\d{3}(?:\/artwork)?$/.test(r)
            ? detail(r.split("/")[2])
            : '<h1>Page not found</h1><a class="button" href="#/archive">Return to Archive</a>';
  document.querySelectorAll(".bottom a").forEach((a) => {
    const active = a.hash === "#" + r;
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  bind();
  if (r === "/summon" && state.pendingReveal) reveal(token);
  requestAnimationFrame(() => {
    scrollTo(0, positions.get(r) || 0);
    app.focus({ preventScroll: true });
  });
}
let scale = 1,
  x = 0,
  y = 0,
  pointers = new Map(),
  gesture = null,
  lastTap = 0;
function transform() {
  const v = $("#viewport"),
    im = $("#full-art");
  const fit = im.naturalWidth
    ? Math.min(
        v.clientWidth / im.naturalWidth,
        v.clientHeight / im.naturalHeight,
      )
    : 1;
  const bx = Math.max(
      0,
      ((im.naturalWidth || v.clientWidth) * fit * scale - v.clientWidth) / 2,
    ),
    by = Math.max(
      0,
      ((im.naturalHeight || v.clientHeight) * fit * scale - v.clientHeight) / 2,
    );
  x = Math.max(-bx, Math.min(bx, x));
  y = Math.max(-by, Math.min(by, y));
  im.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
  $("#zoom-label").textContent = scale.toFixed(1) + "×";
}
function zoom(s) {
  scale = Math.max(1, Math.min(4, s));
  if (scale === 1) x = y = 0;
  transform();
}
function openViewer(id) {
  const d = $("#viewer");
  if (d.open) return;
  viewerReturn = { scroll: scrollY, entered: !!history.state?.viewerEntered };
  $("#full-art").src = registry[id].splash;
  $("#full-art").alt = id + " original artwork";
  $("#viewer-error").hidden = true;
  $("#full-art").hidden = false;
  $("#full-art").onload = () => {
    $("#viewer-error").hidden = true;
    transform();
  };
  $("#full-art").onerror = () => {
    $("#full-art").hidden = true;
    $("#viewer-error").hidden = false;
  };
  scale = 1;
  x = y = 0;
  transform();
  d.showModal();
}
function closeViewer() {
  if (history.state?.viewerEntered) history.back();
  else go("/character/" + route().split("/")[2]);
}
$("#viewer-close").onclick = closeViewer;
$("#viewer").addEventListener("cancel", (e) => {
  e.preventDefault();
  closeViewer();
});
$("#viewer").addEventListener("close", () => {
  pointers.clear();
  if (viewerReturn) scrollTo(0, viewerReturn.scroll);
});
$("#viewer-retry").onclick = () => {
  $("#viewer-error").hidden = true;
  $("#full-art").hidden = false;
  $("#full-art").src = registry[route().split("/")[2]].splash;
};
$("#zoom-in").onclick = () => zoom(scale + 0.5);
$("#zoom-out").onclick = () => zoom(scale - 0.5);
$("#zoom-reset").onclick = () => zoom(1);
const vp = $("#viewport");
const distance = () => {
  const p = [...pointers.values()];
  return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
};
vp.onpointerdown = (e) => {
  vp.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) gesture = { distance: distance(), scale };
  else gesture = { x: e.clientX, y: e.clientY, ox: x, oy: y, moved: false };
};
vp.onpointermove = (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2 && gesture.distance)
    zoom((gesture.scale * distance()) / gesture.distance);
  else if (pointers.size === 1 && gesture) {
    if (Math.abs(e.clientX - gesture.x) + Math.abs(e.clientY - gesture.y) > 8)
      gesture.moved = true;
    if (scale > 1) {
      x = gesture.ox + e.clientX - gesture.x;
      y = gesture.oy + e.clientY - gesture.y;
      transform();
    }
  }
};
vp.onpointerup = (e) => {
  if (pointers.size === 1 && gesture && !gesture.distance && !gesture.moved) {
    const now = Date.now();
    if (now - lastTap < 300) {
      zoom(scale > 1 ? 1 : 2.5);
      lastTap = 0;
    } else lastTap = now;
  }
  pointers.delete(e.pointerId);
  gesture = null;
};
vp.onpointercancel = () => {
  pointers.clear();
  gesture = null;
};
vp.onwheel = (e) => {
  e.preventDefault();
  zoom(scale + (e.deltaY < 0 ? 0.2 : -0.2));
};
window.addEventListener("resize", transform);
$("#info").onclick = () => {
  $("#storage-status").textContent = storageOK
    ? "Storage: browser-local saving is available."
    : "Storage: temporary tab-only mode. Saving is unavailable.";
  $("#info-dialog").showModal();
};
document
  .querySelectorAll("[data-close]")
  .forEach((b) => (b.onclick = () => $("#" + b.dataset.close).close()));
$("#reset").onclick = () => $("#reset-dialog").showModal();
$("#confirm-reset").onclick = async () => {
  try {
    await locked(() => write(sanitize(null, ids)));
    shownPending = null;
    $("#reset-dialog").close();
    $("#info-dialog").close();
    render();
  } catch (e) {
    notice(e.message);
  }
};
document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (a?.hash.startsWith("#/")) {
    e.preventDefault();
    if (a.hash !== location.hash) {
      history.pushState(
        {
          gallery: true,
          from: currentRoute,
          viewerEntered: a.hash.endsWith("/artwork"),
        },
        "",
        a.hash,
      );
    }
    render();
  }
});
window.addEventListener("hashchange", render);
window.addEventListener("storage", (e) => {
  if (e.key === KEY) {
    render();
  }
});
window.addEventListener("pageshow", (e) => {
  if (e.persisted) render();
});
async function start() {
  try {
    const response = await fetch("./data/characters.json");
    if (!response.ok) throw Error("Registry unavailable");
    registry = await response.json();
    ids = Object.keys(registry);
    if (!ids.length) throw Error("Registry is empty");
    state = read();
    write(state);
    render();
  } catch (e) {
    app.innerHTML =
      '<h1>The archive could not open.</h1><p>Please serve this folder over HTTP and check that data/characters.json is available.</p><button id="reload">Retry</button>';
    $("#reload").onclick = () => location.reload();
    notice(e.message);
  }
}
window.addEventListener("error", (e) =>
  notice(
    "Something could not load. Your saved collection is retained. Reload to retry.",
  ),
);
window.addEventListener("unhandledrejection", () =>
  notice(
    "An action could not finish. Please try again; acquired characters remain saved.",
  ),
);
start();
