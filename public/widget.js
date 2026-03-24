(function () {
  "use strict";

  const scriptTag = document.currentScript;
  const API_KEY = scriptTag?.getAttribute("data-tenant") || "";
  const API_BASE = scriptTag?.getAttribute("data-api") || "http://localhost:8000";
  const THEME = scriptTag?.getAttribute("data-color") || "#6C5CE7";
  const customCssUrl = scriptTag?.getAttribute("data-cards-css") || null;
  const userConfig = (typeof window !== "undefined" && window.actionbotConfig) || {};

  let sessionId = localStorage.getItem(`actionbot_session_${API_KEY}`) || null;
  let isOpen = false;
  let isLoading = false;
  let botName = "AI Assistant";
  let welcomeMsg = "Hi! How can I help you?";

  // ─── Detect Logged-in User (Supabase) ─────────────────
  function getLoggedInUser() {
    try {
      // Check window.actionbotConfig first
      if (userConfig.userEmail) return { email: userConfig.userEmail, name: userConfig.userName || "" };
      // Try Supabase session from localStorage
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
          const d = JSON.parse(localStorage.getItem(key) || "{}");
          const u = d?.user || d;
          if (u?.email) return { email: u.email, name: u.user_metadata?.name || u.user_metadata?.full_name || "" };
        }
      }
    } catch(e) {}
    return null;
  }

  // ─── Widget Host ──────────────────────────────────────────
  const host = document.createElement("div");
  host.id = "actionbot-widget-host";
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "closed" });

  // ─── Styles ───────────────────────────────────────────────
  const css = document.createElement("style");
  css.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}

    /* === BUBBLE === */
    .bubble{
      position:fixed;bottom:20px;right:20px;z-index:999999;
      width:58px;height:58px;border-radius:50%;
      background:${THEME};color:#fff;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;
      box-shadow:0 4px 14px ${THEME}50,0 2px 6px rgba(0,0,0,.12);
      transition:all .25s cubic-bezier(.4,0,.2,1);
      border:none;outline:none;
    }
    .bubble svg{width:26px;height:26px;transition:transform .25s}
    .bubble:hover{transform:scale(1.08);box-shadow:0 6px 20px ${THEME}60}
    .bubble.hide{transform:scale(0);pointer-events:none}

    /* === WINDOW === */
    .win{
      position:fixed;bottom:20px;right:20px;z-index:999999;
      width:380px;height:min(620px,calc(100vh - 40px));
      border-radius:16px;overflow:hidden;
      background:#fff;
      box-shadow:0 0 0 1px rgba(0,0,0,.04),0 8px 40px rgba(0,0,0,.12);
      display:flex;flex-direction:column;
      transform:scale(.92) translateY(20px);opacity:0;
      pointer-events:none;
      transition:all .25s cubic-bezier(.4,0,.2,1);
      font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      -webkit-font-smoothing:antialiased;
    }
    .win.open{transform:none;opacity:1;pointer-events:auto}
    @media(max-width:420px){
      .win{width:100%;height:100%;bottom:0;right:0;border-radius:0}
    }

    /* === HEADER === */
    .hdr{
      background:${THEME};color:#fff;
      padding:16px 16px 14px;display:flex;align-items:center;
      gap:10px;flex-shrink:0;position:relative;
    }
    .hdr::after{
      content:'';position:absolute;bottom:-12px;left:0;right:0;
      height:12px;
      background:linear-gradient(#f7f7f8,transparent);
      z-index:1;pointer-events:none;
    }
    .hdr-av{
      width:36px;height:36px;border-radius:10px;
      background:rgba(255,255,255,.15);
      display:flex;align-items:center;justify-content:center;
      font-size:18px;flex-shrink:0;
    }
    .hdr-info{flex:1;min-width:0}
    .hdr-name{font-size:14.5px;font-weight:600;line-height:1.2}
    .hdr-stat{
      font-size:11px;opacity:.75;display:flex;align-items:center;gap:4px;margin-top:1px;
    }
    .hdr-stat::before{
      content:'';width:6px;height:6px;border-radius:50%;background:#4ade80;
    }
    .hdr-x{
      background:rgba(255,255,255,.12);border:none;color:#fff;
      width:30px;height:30px;border-radius:8px;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;transition:background .15s;flex-shrink:0;
    }
    .hdr-x:hover{background:rgba(255,255,255,.22)}
    .hdr-x svg{width:16px;height:16px}

    /* === MESSAGES === */
    .msgs{
      flex:1;overflow-y:auto;padding:16px 14px;
      display:flex;flex-direction:column;gap:6px;
      background:#f7f7f8;
      scroll-behavior:smooth;
    }
    .msgs::-webkit-scrollbar{width:4px}
    .msgs::-webkit-scrollbar-thumb{background:#d4d4d8;border-radius:4px}

    /* bot avatar for groups */
    .msg-group{display:flex;gap:8px;align-items:flex-end;max-width:92%}
    .msg-group.user{align-self:flex-end;flex-direction:row-reverse}
    .msg-group.bot{align-self:flex-start}
    .msg-av{
      width:26px;height:26px;border-radius:8px;
      background:${THEME};color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;flex-shrink:0;font-weight:600;
    }
    .msg-av.user-av{background:#e4e4e7;color:#71717a}

    .msg-col{display:flex;flex-direction:column;gap:2px;min-width:0;max-width:100%}

    .msg{
      padding:10px 14px;font-size:13.5px;line-height:1.55;
      word-wrap:break-word;
      animation:fadeUp .2s ease;
    }
    @keyframes fadeUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}

    .msg.bot{
      background:#fff;color:#1a1a1a;
      border-radius:4px 14px 14px 14px;
      box-shadow:0 1px 2px rgba(0,0,0,.04);
    }
    .msg.bot:first-child{border-radius:14px 14px 14px 4px}
    .msg.user{
      background:${THEME};color:#fff;
      border-radius:14px 4px 14px 14px;
    }
    .msg.user:first-child{border-radius:14px 14px 4px 14px}

    .msg strong{font-weight:600}
    .msg code{
      background:rgba(0,0,0,.05);padding:1px 4px;border-radius:3px;
      font-size:12.5px;font-family:'SF Mono',Monaco,monospace;
    }

    /* === QUICK REPLIES (welcome suggestions) === */
    .qr-wrap{
      display:flex;flex-wrap:wrap;gap:6px;
      padding:4px 0 4px;
      animation:fadeUp .3s ease;
    }
    .qr{
      padding:7px 14px;border-radius:20px;
      background:#fff;color:${THEME};
      border:1.5px solid ${THEME}25;
      font-size:12px;font-weight:500;
      cursor:pointer;transition:all .15s;
      font-family:inherit;
      box-shadow:0 1px 2px rgba(0,0,0,.04);
    }
    .qr:hover{background:${THEME};color:#fff;border-color:${THEME}}
    .qr:active{transform:scale(.97)}

    /* === CARDS === */
    .cards{
      align-self:flex-start;width:100%;
      display:flex;flex-direction:column;gap:8px;
      animation:fadeUp .25s ease;
      padding:4px 0;
    }
    .card{
      background:#fff;border-radius:12px;overflow:hidden;
      box-shadow:0 1px 3px rgba(0,0,0,.06);
      transition:all .15s;
    }
    .card:hover{box-shadow:0 3px 10px rgba(0,0,0,.08)}
    .card-img{
      width:100%;height:120px;object-fit:cover;display:block;
      background:#f4f4f5;
    }
    .card-bd{padding:10px 12px 12px}
    .card-t{font-size:13.5px;font-weight:600;color:#18181b;margin-bottom:2px}
    .card-s{font-size:11px;color:#71717a;margin-bottom:6px}

    .card-badges{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px}
    .badge{
      font-size:10px;font-weight:500;padding:2px 6px;
      border-radius:4px;line-height:1.4;
    }
    .badge-amber{background:#fef3c7;color:#92400e}
    .badge-green{background:#dcfce7;color:#166534}
    .badge-blue{background:#dbeafe;color:#1e40af}
    .badge-purple{background:#ede9fe;color:#5b21b6}
    .badge-red{background:#fee2e2;color:#991b1b}
    .badge-gray{background:#f4f4f5;color:#3f3f46}

    .card-flds{display:flex;gap:12px;margin-bottom:10px}
    .fld-l{font-size:9px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:.3px}
    .fld-v{font-size:12.5px;font-weight:600;color:#18181b}

    .card-acts{display:flex;gap:4px}
    .act{
      flex:1;padding:7px 4px;border:none;border-radius:6px;
      font-size:10.5px;font-weight:600;cursor:pointer;
      transition:all .12s;font-family:inherit;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    }
    .act:hover{opacity:.85}
    .act:active{transform:scale(.97)}
    .act-p{background:${THEME};color:#fff}
    .act-s{background:#f4f4f5;color:#3f3f46}
    .act-g{background:#059669;color:#fff}

    /* === AUTO-OPEN NAV BUTTON === */
    .nav-btn{
      display:flex;align-items:center;gap:10px;
      width:100%;padding:14px 16px;margin:6px 0;
      background:${THEME};color:#fff;
      border:none;border-radius:12px;cursor:pointer;
      font-family:inherit;font-size:14px;font-weight:600;
      transition:all .2s;
      box-shadow:0 2px 8px ${THEME}40;
      animation:navPulse 1.5s ease-in-out infinite;
    }
    .nav-btn:hover{opacity:.9;transform:scale(1.01)}
    .nav-btn:active{transform:scale(.98)}
    .nav-btn svg{width:20px;height:20px;flex-shrink:0}
    .nav-btn span{flex:1;text-align:left}
    .nav-arrow{margin-left:auto;font-size:18px}
    @keyframes navPulse{0%,100%{box-shadow:0 2px 8px ${THEME}40}50%{box-shadow:0 4px 16px ${THEME}60}}

    /* === CONFIRMATION === */
    .confirm{
      background:#fff;border-radius:12px;
      border-left:3px solid ${THEME};
      padding:12px;max-width:92%;
      box-shadow:0 1px 3px rgba(0,0,0,.06);
      animation:fadeUp .2s ease;
      align-self:flex-start;
    }
    .confirm-t{font-size:12px;font-weight:600;color:${THEME};margin-bottom:6px}
    .confirm-s{
      font-size:12px;color:#52525b;margin-bottom:10px;
      padding:8px 10px;background:#fafafa;border-radius:6px;
    }
    .confirm-btns{display:flex;gap:6px}
    .cbtn{
      flex:1;padding:8px;border:none;border-radius:6px;
      font-size:12px;font-weight:600;cursor:pointer;
      transition:all .12s;font-family:inherit;
    }
    .cbtn:hover{opacity:.85}
    .cbtn.y{background:#059669;color:#fff}
    .cbtn.n{background:#f4f4f5;color:#71717a}
    .cbtn:disabled{opacity:.4;cursor:not-allowed}

    /* === TYPING === */
    .typing{
      display:none;align-items:center;gap:4px;
      padding:10px 16px;background:#fff;
      border-radius:4px 14px 14px 14px;
      align-self:flex-start;
      box-shadow:0 1px 2px rgba(0,0,0,.04);
      margin-left:34px;
    }
    .typing.on{display:flex}
    .dot{
      width:5px;height:5px;background:#a1a1aa;
      border-radius:50%;animation:boing 1.4s infinite;
    }
    .dot:nth-child(2){animation-delay:.15s}
    .dot:nth-child(3){animation-delay:.3s}
    @keyframes boing{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}

    /* === LOADING BAR === */
    .load-bar{
      height:2px;background:#e4e4e7;
      position:relative;overflow:hidden;
      display:none;flex-shrink:0;
    }
    .load-bar.on{display:block}
    .load-bar::after{
      content:'';position:absolute;top:0;left:-35%;
      width:35%;height:100%;
      background:${THEME};border-radius:2px;
      animation:slide 1s ease-in-out infinite;
    }
    @keyframes slide{to{left:100%}}

    /* === INPUT === */
    .inp-wrap{
      padding:10px 12px;background:#fff;
      border-top:1px solid #f0f0f0;
      display:flex;gap:8px;align-items:center;flex-shrink:0;
    }
    .inp{
      flex:1;border:1.5px solid #e4e4e7;border-radius:10px;
      padding:9px 12px;font-size:13.5px;outline:none;
      font-family:inherit;background:#fafafa;
      transition:all .15s;
    }
    .inp:focus{border-color:${THEME};background:#fff;box-shadow:0 0 0 3px ${THEME}10}
    .inp::placeholder{color:#a1a1aa}
    .snd{
      width:36px;height:36px;border-radius:10px;
      background:${THEME};color:#fff;border:none;
      cursor:pointer;display:flex;align-items:center;
      justify-content:center;transition:all .15s;flex-shrink:0;
    }
    .snd:hover{opacity:.85}
    .snd:disabled{opacity:.3;cursor:not-allowed}
    .snd svg{width:16px;height:16px}

    .foot{
      text-align:center;padding:4px;
      font-size:9.5px;color:#a1a1aa;background:#fff;flex-shrink:0;
    }
    .foot a{color:#71717a;text-decoration:none;font-weight:500}
  `;
  shadow.appendChild(css);

  if (customCssUrl) {
    fetch(customCssUrl).then(r => r.text()).then(c => {
      const s = document.createElement("style");
      s.textContent = c;
      shadow.appendChild(s);
    });
  }

  // ─── HTML ─────────────────────────────────────────────────
  const root = document.createElement("div");
  root.innerHTML = `
    <button class="bubble" id="bbl">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </button>
    <div class="win" id="win">
      <div class="hdr">
        <div class="hdr-av" id="hav">🏠</div>
        <div class="hdr-info">
          <div class="hdr-name" id="hname">AI Assistant</div>
          <div class="hdr-stat">Online</div>
        </div>
        <button class="hdr-x" id="hx">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="msgs" id="msgs"></div>
      <div class="load-bar" id="lbar"></div>
      <div class="inp-wrap">
        <input class="inp" id="inp" placeholder="Type a message..." autocomplete="off"/>
        <button class="snd" id="snd">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
      <div class="foot">Powered by <a href="#">ActionBot</a></div>
    </div>
  `;
  shadow.appendChild(root);

  // ─── Refs ─────────────────────────────────────────────────
  const $ = id => shadow.getElementById(id);
  const bbl = $("bbl"), win = $("win"), hx = $("hx");
  const msgs = $("msgs"), inp = $("inp"), snd = $("snd");
  const hname = $("hname"), lbar = $("lbar");

  // ─── Events ───────────────────────────────────────────────
  bbl.addEventListener("click", () => toggle(true));
  hx.addEventListener("click", () => toggle(false));
  snd.addEventListener("click", () => send());
  inp.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });

  function toggle(open) {
    isOpen = open;
    bbl.classList.toggle("hide", open);
    win.classList.toggle("open", open);
    if (open && !sessionId) initSession();
    if (open) setTimeout(() => inp.focus(), 100);
  }

  // ─── Session ──────────────────────────────────────────────
  async function initSession() {
    try {
      const r = await fetch(`${API_BASE}/api/chat/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
        body: JSON.stringify({ apiKey: API_KEY, externalUserId: userConfig.externalUserId, metadata: userConfig.metadata }),
      });
      const d = await r.json();
      sessionId = d.sessionId;
      localStorage.setItem(`actionbot_session_${API_KEY}`, sessionId);
      botName = d.botName || "AI Assistant";
      welcomeMsg = d.welcomeMessage || "Hi! How can I help you?";
      hname.textContent = botName;
      addBot(welcomeMsg);
      // Quick reply suggestions
      showQuickReplies(["Show PGs in Koramangala", "Budget PGs under ₹10k", "PGs with AC & WiFi"]);
    } catch (e) {
      console.error("ActionBot init error:", e);
      addBot("Sorry, I'm having trouble connecting. Please try again later.");
    }
  }

  // ─── Send ─────────────────────────────────────────────────
  async function send(overrideText) {
    const text = overrideText || inp.value.trim();
    if (!text || isLoading) return;
    inp.value = "";
    // Remove quick replies
    shadow.querySelectorAll(".qr-wrap").forEach(el => el.remove());
    addUser(text);
    setLoading(true);
    try {
      if (!sessionId) await initSession();
      const r = await fetch(`${API_BASE}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
        body: JSON.stringify({ message: text, sessionId, userContext: getLoggedInUser() }),
      });
      const d = await r.json();
      sessionId = d.sessionId;
      localStorage.setItem(`actionbot_session_${API_KEY}`, sessionId);

      if (d.type === "confirmation_required") {
        if (d.content) addBot(d.content);
        addConfirm(d.confirmation);
      } else if (d.type === "error") {
        addBot(d.content || "Something went wrong.");
      } else {
        if (d.content) addBot(d.content);
      }
      if (d.attachments && d.attachments.length > 0) addCards(d.attachments);
    } catch (e) {
      console.error("ActionBot send error:", e);
      addBot("Sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false);
      inp.focus();
    }
  }

  // ─── Confirm ──────────────────────────────────────────────
  async function doConfirm(id, action, btns) {
    btns.forEach(b => b.disabled = true);
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/chat/confirm/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
        body: JSON.stringify({ action, sessionId }),
      });
      const d = await r.json();
      addBot(d.content);
    } catch (e) {
      addBot("Failed to process. Please try again.");
    } finally { setLoading(false); }
  }

  // ─── Actions ──────────────────────────────────────────────
  function doAction(act) {
    if (!act) return;
    if (act.action === "send_message" && act.payload?.message) {
      send(act.payload.message);
    } else if (act.action === "open_url" && act.payload?.url) {
      window.open(act.payload.url, "_blank", "noopener");
    } else if (act.action === "custom_event" && act.payload) {
      document.dispatchEvent(new CustomEvent("actionbot:custom_event", { detail: act.payload }));
    }
  }

  // ─── Renderers ────────────────────────────────────────────
  function addBot(text) {
    if (!text) return;
    const g = mk("div", "msg-group bot");
    const av = mk("div", "msg-av");
    av.textContent = botName.charAt(0).toUpperCase();
    const col = mk("div", "msg-col");
    const m = mk("div", "msg bot");
    m.innerHTML = fmtMd(text);
    col.appendChild(m);
    g.appendChild(av);
    g.appendChild(col);
    msgs.appendChild(g);
    scroll();
  }

  function addUser(text) {
    const g = mk("div", "msg-group user");
    const col = mk("div", "msg-col");
    const m = mk("div", "msg user");
    m.innerHTML = esc(text);
    col.appendChild(m);
    g.appendChild(col);
    msgs.appendChild(g);
    scroll();
  }

  function showQuickReplies(items) {
    const w = mk("div", "qr-wrap");
    items.forEach(text => {
      const b = mk("button", "qr");
      b.textContent = text;
      b.addEventListener("click", () => { w.remove(); send(text); });
      w.appendChild(b);
    });
    msgs.appendChild(w);
    scroll();
  }

  function addCards(attachments) {
    if (!attachments?.length) return;
    for (const c of attachments) {
      const cd = c.data || c;
      // Auto-open: show a prominent tap-to-open button (mobile-safe)
      if (cd.auto_open && cd.actions?.length) {
        for (const a of cd.actions) {
          if (a.action === "open_url" && a.payload?.url) {
            const btn = document.createElement("button");
            btn.className = "nav-btn";
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg><span>${esc(a.label || cd.title || "Open Page")}</span><span class="nav-arrow">\u203A</span>`;
            btn.addEventListener("click", () => {
              window.open(a.payload.url, "_blank", "noopener");
              btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>Opened!</span>`;
              btn.style.animation = "none";
              btn.style.opacity = "0.7";
            });
            const g = mk("div","msg-group");
            g.appendChild(btn);
            msgs.appendChild(g);
          }
        }
        scroll();
        continue;
      }
    }
    const w = mk("div", "cards");
    for (const c of attachments) {
      const cd = c.data || c;
      if (cd.auto_open) continue;
      w.appendChild(buildCard(cd));
    }
    if (w.children.length) { msgs.appendChild(w); scroll(); }
  }

  function buildCard(d) {
    const el = mk("div", "card");
    let h = "";
    if (d.image) {
      h += `<img class="card-img" src="${esc(d.image)}" alt="${esc(d.title||'')}" loading="lazy"${d.url?' style="cursor:pointer"':''}/>`;
    }
    h += `<div class="card-bd">`;
    if (d.title) h += `<div class="card-t"${d.url?' style="cursor:pointer;color:'+THEME+'"':''}>${esc(d.title)}</div>`;
    if (d.subtitle) h += `<div class="card-s">${esc(d.subtitle)}</div>`;
    if (d.badges?.length) {
      h += `<div class="card-badges">`;
      d.badges.forEach(b => { h += `<span class="badge badge-${b.color||'gray'}">${esc(b.text)}</span>`; });
      h += `</div>`;
    }
    if (d.fields?.length) {
      h += `<div class="card-flds">`;
      d.fields.forEach(f => { h += `<div><div class="fld-l">${esc(f.label)}</div><div class="fld-v">${esc(f.value)}</div></div>`; });
      h += `</div>`;
    }
    if (d.actions?.length) {
      h += `<div class="card-acts">`;
      d.actions.forEach((a, i) => {
        const cls = a.style === "primary" ? "act-p" : a.style === "success" ? "act-g" : "act-s";
        h += `<button class="act ${cls}" data-i="${i}">${esc(a.label)}</button>`;
      });
      h += `</div>`;
    }
    h += `</div>`;
    el.innerHTML = h;
    if (d.actions) {
      el.querySelectorAll(".act").forEach(b => {
        b.addEventListener("click", e => { e.stopPropagation(); doAction(d.actions[+b.dataset.i]); });
      });
    }
    // Make card title + image clickable if URL exists
    if (d.url) {
      const clickable = el.querySelectorAll(".card-img, .card-t");
      clickable.forEach(c => c.addEventListener("click", (e) => { e.stopPropagation(); window.open(d.url, "_blank", "noopener"); }));
    }
    // Handle broken images
    const img = el.querySelector(".card-img");
    if (img) img.addEventListener("error", () => { img.style.display = "none"; });
    return el;
  }

  function addConfirm(c) {
    const el = mk("div", "confirm");
    el.innerHTML = `
      <div class="confirm-t">⚡ Action Required</div>
      <div class="confirm-s">${esc(c.summary || "Execute: " + c.toolName)}</div>
      <div class="confirm-btns">
        <button class="cbtn y" data-a="confirm">✓ Confirm</button>
        <button class="cbtn n" data-a="reject">✕ Cancel</button>
      </div>`;
    msgs.appendChild(el);
    scroll();
    const btns = el.querySelectorAll(".cbtn");
    btns.forEach(b => b.addEventListener("click", () => doConfirm(c.id, b.dataset.a, Array.from(btns))));
  }

  function setLoading(on) {
    isLoading = on;
    snd.disabled = on;
    lbar.classList.toggle("on", on);
    let t = shadow.querySelector(".typing");
    if (!t) {
      t = mk("div", "typing");
      t.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div>`;
    }
    // Always move typing indicator to the bottom
    if (on) msgs.appendChild(t);
    t.classList.toggle("on", on);
    if (on) scroll();
  }

  // ─── Helpers ──────────────────────────────────────────────
  function mk(tag, cls) { const e = document.createElement(tag); e.className = cls; return e; }
  function scroll() { requestAnimationFrame(() => { msgs.scrollTop = msgs.scrollHeight; }); }
  function esc(s) { return !s ? "" : String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
  function fmtMd(t) {
    if (!t) return "";
    const ls = 'color:'+THEME+';text-decoration:underline;font-weight:500';
    // Extract and protect URLs first (before HTML escaping mangles them)
    const urls = [];
    let s = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (_, txt, url) => { urls.push({txt,url}); return '\x00LINK'+(urls.length-1)+'\x00'; });
    s = s.replace(/(https?:\/\/[^\s*\])<]+)/g, (_, url) => { urls.push({txt:url,url}); return '\x00LINK'+(urls.length-1)+'\x00'; });
    // Now apply HTML escaping and markdown
    s = s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,"<em>$1</em>")
      .replace(/`(.+?)`/g,"<code>$1</code>")
      .replace(/\n- /g,"\n• ")
      .replace(/\n(\d+)\. /g,"\n$1. ")
      .replace(/\n/g,"<br>");
    // Restore URLs as clickable links
    s = s.replace(/\x00LINK(\d+)\x00/g, (_, i) => {
      const l = urls[+i];
      return '<a href="'+l.url+'" target="_blank" rel="noopener" style="'+ls+'">'+l.txt+'</a>';
    });
    return s;
  }

  // ─── Restore Session ─────────────────────────────────────
  if (sessionId) {
    fetch(`${API_BASE}/api/chat/history/${sessionId}`, { headers: { "X-API-Key": API_KEY } })
      .then(r => r.json())
      .then(d => {
        if (d.botName) {
          botName = d.botName;
          hname.textContent = botName;
        }
        if (d.messages) {
          for (const m of d.messages) {
            if (m.role === "user" && m.content) addUser(m.content);
            if (m.role === "assistant" && m.content) addBot(m.content);
          }
          if (d.pendingConfirmations?.length) {
            d.pendingConfirmations.forEach(c => addConfirm(c));
          }
        }
      })
      .catch(() => { sessionId = null; localStorage.removeItem(`actionbot_session_${API_KEY}`); });
  }
})();
