(function () {
  "use strict";

  const scriptTag = document.currentScript;
  const API_KEY = scriptTag?.getAttribute("data-tenant") || "";
  const API_BASE = scriptTag?.getAttribute("data-api") || "http://localhost:8000";
  const THEME = scriptTag?.getAttribute("data-color") || "#6C5CE7";
  const customCssUrl = scriptTag?.getAttribute("data-cards-css") || null;
  const userConfig = (typeof window !== "undefined" && window.actionbotConfig) || {};

  // ─── i18n Translations ────────────────────────────────────
  const i18n = {
    en: { powered: "Powered by", placeholder: "Type a message...", send: "Send", download: "Download Chat", clear: "Clear Chat", online: "Online", confirm: "Confirm", cancel: "Cancel", actionReq: "Action Required", langLabel: "English" },
    hi: { powered: "द्वारा संचालित", placeholder: "संदेश लिखें...", send: "भेजें", download: "चैट डाउनलोड करें", clear: "चैट साफ़ करें", online: "ऑनलाइन", confirm: "पुष्टि करें", cancel: "रद्द करें", actionReq: "कार्रवाई आवश्यक", langLabel: "हिन्दी" },
    kn: { powered: "ಇವರಿಂದ ನಡೆಸಲ್ಪಡುತ್ತಿದೆ", placeholder: "ಸಂದೇಶ ಬರೆಯಿರಿ...", send: "ಕಳುಹಿಸಿ", download: "ಚಾಟ್ ಡೌನ್‌ಲೋಡ್", clear: "ಚಾಟ್ ಅಳಿಸಿ", online: "ಆನ್‌ಲೈನ್", confirm: "ದೃಢೀಕರಿಸಿ", cancel: "ರದ್ದುಮಾಡಿ", actionReq: "ಕ್ರಮ ಅಗತ್ಯ", langLabel: "ಕನ್ನಡ" },
    ta: { powered: "வழங்குபவர்", placeholder: "செய்தி எழுதுங்கள்...", send: "அனுப்பு", download: "அரட்டை பதிவிறக்கம்", clear: "அரட்டை அழி", online: "ஆன்லைன்", confirm: "உறுதிப்படுத்து", cancel: "ரத்து செய்", actionReq: "நடவடிக்கை தேவை", langLabel: "தமிழ்" },
    te: { powered: "అందించినది", placeholder: "సందేశం టైప్ చేయండి...", send: "పంపు", download: "చాట్ డౌన్‌లోడ్", clear: "చాట్ క్లియర్", online: "ఆన్‌లైన్", confirm: "నిర్ధారించు", cancel: "రద్దు", actionReq: "చర్య అవసరం", langLabel: "తెలుగు" },
  };

  // Detect language: data-lang attribute > navigator.language > 'en'
  function detectLang() {
    const attr = scriptTag?.getAttribute("data-lang");
    if (attr && i18n[attr]) return attr;
    const nav = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    if (nav.startsWith("hi")) return "hi";
    if (nav.startsWith("kn")) return "kn";
    if (nav.startsWith("ta")) return "ta";
    if (nav.startsWith("te")) return "te";
    return "en";
  }

  let currentLang = detectLang();
  function t(key) { return (i18n[currentLang] || i18n.en)[key] || i18n.en[key] || key; }

  let sessionId = localStorage.getItem(`actionbot_session_${API_KEY}`) || null;
  let isOpen = false;
  let isLoading = false;
  let botName = "AI Assistant";
  let welcomeMsg = "Hi! How can I help you?";
  let welcomeShown = false;
  let chatHistory = []; // in-memory message log for export
  let messageCount = 0; // total messages for rating prompt trigger
  let conversationRated = false; // prevent showing rating prompt twice

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

    /* === CSS VARIABLES (light/dark) === */
    :host{
      --ab-win-bg:#fff;
      --ab-msgs-bg:#f7f7f8;
      --ab-bot-bg:#fff;
      --ab-bot-color:#1a1a1a;
      --ab-inp-bg:#fafafa;
      --ab-inp-border:#e4e4e7;
      --ab-inp-color:inherit;
      --ab-inp-wrap-bg:#fff;
      --ab-inp-wrap-border:#f0f0f0;
      --ab-card-bg:#fff;
      --ab-card-title:#18181b;
      --ab-card-sub:#71717a;
      --ab-foot-bg:#fff;
      --ab-foot-color:#a1a1aa;
      --ab-foot-link:#71717a;
      --ab-confirm-bg:#fff;
      --ab-confirm-summary-bg:#fafafa;
      --ab-code-bg:rgba(0,0,0,.05);
      --ab-scroll-thumb:#d4d4d8;
      --ab-hdr-gradient:linear-gradient(#f7f7f8,transparent);
      --ab-qr-bg:#fff;
      --ab-qr-border:${THEME}25;
      --ab-act-s-bg:#f4f4f5;
      --ab-act-s-color:#3f3f46;
      --ab-cbtn-n-bg:#f4f4f5;
      --ab-cbtn-n-color:#71717a;
      --ab-ts-user:rgba(0,0,0,0.3);
      --ab-ts-bot:rgba(0,0,0,0.25);
      --ab-typing-bg:#fff;
      --ab-load-bg:#e4e4e7;
      --ab-fld-label:#a1a1aa;
      --ab-fld-value:#18181b;
      --ab-msg-shadow:0 1px 2px rgba(0,0,0,.04);
    }

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
      background:var(--ab-win-bg);
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
      background:var(--ab-hdr-gradient);
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

    /* === MENU BUTTON & DROPDOWN === */
    .hdr-menu{
      background:rgba(255,255,255,.12);border:none;color:#fff;
      width:30px;height:30px;border-radius:8px;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;transition:background .15s;flex-shrink:0;
      position:relative;
    }
    .hdr-menu:hover{background:rgba(255,255,255,.22)}
    .hdr-menu>svg{width:16px;height:16px}

    .menu-drop{
      position:absolute;top:calc(100% + 6px);right:0;
      min-width:175px;
      background:#fff;border-radius:12px;
      box-shadow:0 8px 30px rgba(0,0,0,.15),0 0 0 1px rgba(0,0,0,.04);
      opacity:0;transform:scale(.92) translateY(-4px);
      pointer-events:none;
      transition:all .18s cubic-bezier(.4,0,.2,1);
      z-index:10;overflow:hidden;
    }
    .menu-drop.show{
      opacity:1;transform:none;pointer-events:auto;
    }
    .menu-item{
      display:flex;align-items:center;gap:10px;
      width:100%;padding:11px 14px;
      background:none;border:none;
      font-size:12.5px;font-weight:500;
      color:#3f3f46;cursor:pointer;
      font-family:inherit;
      transition:background .12s;
    }
    .menu-item:hover{background:#f4f4f5}
    .menu-item:active{background:#e4e4e7}
    .menu-item+.menu-item{border-top:1px solid #f0f0f0}
    .menu-item svg{width:15px;height:15px;flex-shrink:0;color:#71717a}
    .menu-item.danger{color:#dc2626}
    .menu-item.danger svg{color:#dc2626}

    /* === LANGUAGE SWITCHER === */
    .hdr-lang{
      background:rgba(255,255,255,.12);border:none;color:#fff;
      width:30px;height:30px;border-radius:8px;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;transition:background .15s;flex-shrink:0;
      position:relative;
    }
    .hdr-lang:hover{background:rgba(255,255,255,.22)}
    .hdr-lang>svg{width:16px;height:16px}
    .lang-drop{
      position:absolute;top:calc(100% + 6px);right:0;
      min-width:130px;
      background:#fff;border-radius:12px;
      box-shadow:0 8px 30px rgba(0,0,0,.15),0 0 0 1px rgba(0,0,0,.04);
      opacity:0;transform:scale(.92) translateY(-4px);
      pointer-events:none;
      transition:all .18s cubic-bezier(.4,0,.2,1);
      z-index:10;overflow:hidden;
    }
    .lang-drop.show{
      opacity:1;transform:none;pointer-events:auto;
    }
    .lang-item{
      display:flex;align-items:center;gap:8px;
      width:100%;padding:10px 14px;
      background:none;border:none;
      font-size:12.5px;font-weight:500;
      color:#3f3f46;cursor:pointer;
      font-family:inherit;
      transition:background .12s;
    }
    .lang-item:hover{background:#f4f4f5}
    .lang-item:active{background:#e4e4e7}
    .lang-item+.lang-item{border-top:1px solid #f0f0f0}
    .lang-item.active{color:${THEME};font-weight:600}

    /* === MESSAGES === */
    .msgs{
      flex:1;overflow-y:auto;padding:16px 14px;
      display:flex;flex-direction:column;gap:6px;
      background:var(--ab-msgs-bg);
      scroll-behavior:smooth;
    }
    .msgs::-webkit-scrollbar{width:4px}
    .msgs::-webkit-scrollbar-thumb{background:var(--ab-scroll-thumb);border-radius:4px}

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
      background:var(--ab-bot-bg);color:var(--ab-bot-color);
      border-radius:4px 14px 14px 14px;
      box-shadow:var(--ab-msg-shadow);
    }
    .msg.bot:first-child{border-radius:14px 14px 14px 4px}
    .msg.user{
      background:${THEME};color:#fff;
      border-radius:14px 4px 14px 14px;
    }
    .msg.user:first-child{border-radius:14px 14px 4px 14px}

    .msg strong{font-weight:600}
    .msg code{
      background:var(--ab-code-bg);padding:1px 4px;border-radius:3px;
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
      background:var(--ab-qr-bg);color:${THEME};
      border:1.5px solid var(--ab-qr-border);
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
      background:var(--ab-card-bg);border-radius:12px;overflow:hidden;
      box-shadow:0 1px 3px rgba(0,0,0,.06);
      transition:all .15s;
    }
    .card:hover{box-shadow:0 3px 10px rgba(0,0,0,.08)}
    .card-img{
      width:100%;height:120px;object-fit:cover;display:block;
      background:#f4f4f5;
    }
    .card-bd{padding:10px 12px 12px}
    .card-t{font-size:13.5px;font-weight:600;color:var(--ab-card-title);margin-bottom:2px}
    .card-s{font-size:11px;color:var(--ab-card-sub);margin-bottom:6px}

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
    .fld-l{font-size:9px;font-weight:600;color:var(--ab-fld-label);text-transform:uppercase;letter-spacing:.3px}
    .fld-v{font-size:12.5px;font-weight:600;color:var(--ab-fld-value)}

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
    .act-s{background:var(--ab-act-s-bg);color:var(--ab-act-s-color)}
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
      background:var(--ab-confirm-bg);border-radius:12px;
      border-left:3px solid ${THEME};
      padding:12px;max-width:92%;
      box-shadow:0 1px 3px rgba(0,0,0,.06);
      animation:fadeUp .2s ease;
      align-self:flex-start;
    }
    .confirm-t{font-size:12px;font-weight:600;color:${THEME};margin-bottom:6px}
    .confirm-s{
      font-size:12px;color:#52525b;margin-bottom:10px;
      padding:8px 10px;background:var(--ab-confirm-summary-bg);border-radius:6px;
    }
    .confirm-btns{display:flex;gap:6px}
    .cbtn{
      flex:1;padding:8px;border:none;border-radius:6px;
      font-size:12px;font-weight:600;cursor:pointer;
      transition:all .12s;font-family:inherit;
    }
    .cbtn:hover{opacity:.85}
    .cbtn.y{background:#059669;color:#fff}
    .cbtn.n{background:var(--ab-cbtn-n-bg);color:var(--ab-cbtn-n-color)}
    .cbtn:disabled{opacity:.4;cursor:not-allowed}

    /* === TYPING === */
    .typing-group{
      display:none;align-items:flex-end;gap:8px;
      align-self:flex-start;max-width:92%;
      animation:fadeUp .2s ease;
    }
    .typing-group.on{display:flex}
    .typing-group .msg-av{
      width:26px;height:26px;border-radius:8px;
      background:${THEME};color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;flex-shrink:0;font-weight:600;
    }
    .typing{
      display:flex;align-items:center;gap:5px;
      padding:10px 16px;background:var(--ab-typing-bg);
      border-radius:4px 14px 14px 14px;
      box-shadow:0 1px 2px rgba(0,0,0,.04);
    }
    .dot{
      width:6px;height:6px;background:#a1a1aa;
      border-radius:50%;animation:boing 1.4s infinite;
    }
    .dot:nth-child(2){animation-delay:.15s}
    .dot:nth-child(3){animation-delay:.3s}
    @keyframes boing{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}

    /* === LOADING BAR === */
    .load-bar{
      height:2px;background:var(--ab-load-bg);
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

    /* === MESSAGE FEEDBACK (thumbs) === */
    .msg-feedback{
      display:flex;gap:2px;margin-top:4px;opacity:0;
      transition:opacity .15s;
    }
    .msg-group.bot:hover .msg-feedback{opacity:1}
    .msg-feedback.voted{opacity:1}
    .fb-btn{
      background:none;border:none;cursor:pointer;padding:3px 4px;
      border-radius:4px;display:flex;align-items:center;justify-content:center;
      transition:all .15s;color:#a1a1aa;
    }
    .fb-btn:hover{background:rgba(0,0,0,.05);color:#71717a}
    .fb-btn svg{width:14px;height:14px}
    .fb-btn.up-active{color:#22c55e}
    .fb-btn.down-active{color:#ef4444}
    .fb-btn.disabled{pointer-events:none;opacity:.5}

    /* === CONVERSATION RATING OVERLAY === */
    .rate-overlay{
      position:absolute;top:0;left:0;right:0;bottom:0;
      background:rgba(0,0,0,.4);z-index:20;
      display:flex;align-items:center;justify-content:center;
      animation:fadeIn .2s ease;
    }
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    .rate-card{
      background:#fff;border-radius:14px;padding:20px;
      width:calc(100% - 32px);max-width:320px;
      box-shadow:0 8px 30px rgba(0,0,0,.15);
      animation:fadeUp .25s ease;
    }
    .rate-title{
      font-size:14px;font-weight:600;color:#18181b;
      text-align:center;margin-bottom:14px;
    }
    .rate-stars{
      display:flex;justify-content:center;gap:6px;margin-bottom:14px;
    }
    .rate-star{
      background:none;border:none;cursor:pointer;padding:2px;
      transition:transform .12s;color:#d4d4d8;
    }
    .rate-star:hover{transform:scale(1.15)}
    .rate-star svg{width:28px;height:28px}
    .rate-star.active{color:#f59e0b}
    .rate-comment{
      width:100%;border:1.5px solid #e4e4e7;border-radius:8px;
      padding:8px 10px;font-size:12.5px;font-family:inherit;
      resize:vertical;min-height:60px;max-height:120px;
      outline:none;transition:border-color .15s;
      margin-bottom:12px;
    }
    .rate-comment:focus{border-color:${THEME}}
    .rate-comment::placeholder{color:#a1a1aa}
    .rate-btns{display:flex;gap:8px;justify-content:flex-end}
    .rate-btn{
      padding:7px 16px;border-radius:8px;border:none;
      font-size:12px;font-weight:600;cursor:pointer;
      font-family:inherit;transition:all .12s;
    }
    .rate-btn:hover{opacity:.85}
    .rate-btn.primary{background:${THEME};color:#fff}
    .rate-btn.secondary{background:#f4f4f5;color:#71717a}
    .rate-btn:disabled{opacity:.4;cursor:not-allowed}
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
          <div class="hdr-stat" id="hstat">Online</div>
        </div>
        <button class="hdr-menu" id="hmenu">
          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
          <div class="menu-drop" id="menuDrop">
            <button class="menu-item" id="menuDownload">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span id="menuDownloadTxt">Download Chat</span>
            </button>
            <button class="menu-item danger" id="menuClear">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span id="menuClearTxt">Clear Chat</span>
            </button>
          </div>
        </button>
        <button class="hdr-lang" id="hlang">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          <div class="lang-drop" id="langDrop"></div>
        </button>
        <button class="hdr-x" id="hx">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="msgs" id="msgs"></div>
      <div class="load-bar" id="lbar"></div>
      <div class="inp-wrap">
        <input class="inp" id="inp" placeholder="" autocomplete="off"/>
        <button class="snd" id="snd">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
      <div class="foot" id="foot">Powered by <a href="#">ActionBot</a></div>
    </div>
  `;
  shadow.appendChild(root);

  // ─── Refs ─────────────────────────────────────────────────
  const $ = id => shadow.getElementById(id);
  const bbl = $("bbl"), win = $("win"), hx = $("hx");
  const msgs = $("msgs"), inp = $("inp"), snd = $("snd");
  const hname = $("hname"), lbar = $("lbar");
  const hmenu = $("hmenu"), menuDrop = $("menuDrop");
  const menuDownload = $("menuDownload"), menuClear = $("menuClear");
  const hlang = $("hlang"), langDrop = $("langDrop");
  const hstat = $("hstat"), foot = $("foot");
  const menuDownloadTxt = $("menuDownloadTxt"), menuClearTxt = $("menuClearTxt");

  // ─── Events ───────────────────────────────────────────────
  bbl.addEventListener("click", () => toggle(true));
  hx.addEventListener("click", () => {
    if (messageCount >= 3 && !conversationRated) {
      showRatingPrompt();
    } else {
      toggle(false);
    }
  });
  snd.addEventListener("click", () => send());
  inp.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });

  // ─── Menu Events ──────────────────────────────────────────
  hmenu.addEventListener("click", (e) => {
    e.stopPropagation();
    menuDrop.classList.toggle("show");
    langDrop.classList.remove("show");
  });

  menuDownload.addEventListener("click", (e) => {
    e.stopPropagation();
    downloadChat();
    menuDrop.classList.remove("show");
  });

  menuClear.addEventListener("click", (e) => {
    e.stopPropagation();
    clearChat();
    menuDrop.classList.remove("show");
  });

  // ─── Language Switcher ───────────────────────────────────
  function buildLangDropdown() {
    langDrop.innerHTML = "";
    for (const code of Object.keys(i18n)) {
      const btn = document.createElement("button");
      btn.className = "lang-item" + (code === currentLang ? " active" : "");
      btn.textContent = i18n[code].langLabel;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        currentLang = code;
        applyLang();
        langDrop.classList.remove("show");
        buildLangDropdown();
      });
      langDrop.appendChild(btn);
    }
  }
  buildLangDropdown();

  hlang.addEventListener("click", (e) => {
    e.stopPropagation();
    langDrop.classList.toggle("show");
    menuDrop.classList.remove("show");
  });

  function applyLang() {
    inp.placeholder = t("placeholder");
    hstat.textContent = t("online");
    menuDownloadTxt.textContent = t("download");
    menuClearTxt.textContent = t("clear");
    foot.innerHTML = t("powered") + ' <a href="#">ActionBot</a>';
  }
  applyLang();

  // Close dropdowns when clicking outside
  document.addEventListener("click", () => {
    menuDrop.classList.remove("show");
    langDrop.classList.remove("show");
  });
  // Also close when clicking inside the shadow DOM but outside menu/lang
  root.addEventListener("click", (e) => {
    if (!hmenu.contains(e.target)) {
      menuDrop.classList.remove("show");
    }
    if (!hlang.contains(e.target)) {
      langDrop.classList.remove("show");
    }
  });

  function toggle(open) {
    isOpen = open;
    bbl.classList.toggle("hide", open);
    win.classList.toggle("open", open);
    if (open && !sessionId && !welcomeShown) initSession();
    if (open) setTimeout(() => inp.focus(), 100);
    // Close dropdowns when closing window
    if (!open) { menuDrop.classList.remove("show"); langDrop.classList.remove("show"); }
  }

  // ─── Download Chat ────────────────────────────────────────
  function downloadChat() {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const fileDate = now.toISOString().slice(0, 10);

    let content = "Chat with " + botName + "\n";
    content += "Exported on " + dateStr + "\n";
    content += "========================\n\n";

    if (chatHistory.length === 0) {
      content += "(No messages)\n";
    } else {
      for (const entry of chatHistory) {
        const time = new Date(entry.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        const sender = entry.role === "user" ? "You" : botName;
        content += "[" + time + "] " + sender + ": " + entry.text + "\n";
      }
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = botName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    a.download = "chat-" + safeName + "-" + fileDate + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ─── Clear Chat ───────────────────────────────────────────
  function clearChat() {
    // Remove session from storage
    localStorage.removeItem("actionbot_session_" + API_KEY);
    sessionId = null;
    welcomeShown = false;
    chatHistory = [];

    // Clear all message elements
    msgs.innerHTML = "";

    // Re-init session to show fresh welcome
    initSession();
  }

  // ─── Session ──────────────────────────────────────────────
  async function initSession() {
    try {
      const r = await fetch(API_BASE + "/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
        body: JSON.stringify({ apiKey: API_KEY, externalUserId: userConfig.externalUserId, metadata: userConfig.metadata }),
      });
      const d = await r.json();
      sessionId = d.sessionId;
      localStorage.setItem("actionbot_session_" + API_KEY, sessionId);
      botName = d.botName || "AI Assistant";
      welcomeMsg = d.welcomeMessage || "Hi! How can I help you?";
      hname.textContent = botName;
      if (!welcomeShown) {
        welcomeShown = true;
        addBot(welcomeMsg);
        if (d.quickReplies?.length) showQuickReplies(d.quickReplies);
      }
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
      const r = await fetch(API_BASE + "/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
        body: JSON.stringify({ message: text, sessionId, userContext: getLoggedInUser() }),
      });
      const d = await r.json();
      sessionId = d.sessionId;
      localStorage.setItem("actionbot_session_" + API_KEY, sessionId);

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
      const r = await fetch(API_BASE + "/api/chat/confirm/" + id, {
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
    // Play notification sound if widget is minimized
    if (!isOpen) playNotificationSound();
    chatHistory.push({ role: "bot", text: text, time: Date.now() });
    messageCount++;
    const msgIdx = messageCount;
    const g = mk("div", "msg-group bot");
    const av = mk("div", "msg-av");
    av.textContent = botName.charAt(0).toUpperCase();
    const col = mk("div", "msg-col");
    const m = mk("div", "msg bot");
    m.innerHTML = fmtMd(text);
    col.appendChild(m);

    // Thumbs up/down feedback
    const fbWrap = mk("div", "msg-feedback");
    const thumbUp = document.createElement("button");
    thumbUp.className = "fb-btn";
    thumbUp.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>';
    const thumbDown = document.createElement("button");
    thumbDown.className = "fb-btn";
    thumbDown.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>';

    thumbUp.addEventListener("click", (e) => {
      e.stopPropagation();
      if (thumbUp.classList.contains("disabled")) return;
      thumbUp.classList.add("up-active");
      thumbDown.classList.remove("down-active");
      thumbUp.classList.add("disabled");
      thumbDown.classList.add("disabled");
      fbWrap.classList.add("voted");
      sendFeedback({ sessionId, messageIndex: msgIdx, rating: 1, type: "message" });
    });

    thumbDown.addEventListener("click", (e) => {
      e.stopPropagation();
      if (thumbDown.classList.contains("disabled")) return;
      thumbDown.classList.add("down-active");
      thumbUp.classList.remove("up-active");
      thumbUp.classList.add("disabled");
      thumbDown.classList.add("disabled");
      fbWrap.classList.add("voted");
      sendFeedback({ sessionId, messageIndex: msgIdx, rating: -1, type: "message" });
    });

    fbWrap.appendChild(thumbUp);
    fbWrap.appendChild(thumbDown);
    col.appendChild(fbWrap);

    g.appendChild(av);
    g.appendChild(col);
    msgs.appendChild(g);
    scroll();
  }

  function addUser(text) {
    chatHistory.push({ role: "user", text: text, time: Date.now() });
    messageCount++;
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
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg><span>' + esc(a.label || cd.title || "Open Page") + '</span><span class="nav-arrow">\u203A</span>';
            btn.addEventListener("click", () => {
              window.open(a.payload.url, "_blank", "noopener");
              btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>Opened!</span>';
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
      h += '<img class="card-img" src="' + esc(d.image) + '" alt="' + esc(d.title||'') + '" loading="lazy"' + (d.url?' style="cursor:pointer"':'') + '/>';
    }
    h += '<div class="card-bd">';
    if (d.title) h += '<div class="card-t"' + (d.url?' style="cursor:pointer;color:'+THEME+'"':'') + '>' + esc(d.title) + '</div>';
    if (d.subtitle) h += '<div class="card-s">' + esc(d.subtitle) + '</div>';
    if (d.badges?.length) {
      h += '<div class="card-badges">';
      d.badges.forEach(b => { h += '<span class="badge badge-' + (b.color||'gray') + '">' + esc(b.text) + '</span>'; });
      h += '</div>';
    }
    if (d.fields?.length) {
      h += '<div class="card-flds">';
      d.fields.forEach(f => { h += '<div><div class="fld-l">' + esc(f.label) + '</div><div class="fld-v">' + esc(f.value) + '</div></div>'; });
      h += '</div>';
    }
    if (d.actions?.length) {
      h += '<div class="card-acts">';
      d.actions.forEach((a, i) => {
        const cls = a.style === "primary" ? "act-p" : a.style === "success" ? "act-g" : "act-s";
        h += '<button class="act ' + cls + '" data-i="' + i + '">' + esc(a.label) + '</button>';
      });
      h += '</div>';
    }
    h += '</div>';
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
    el.innerHTML = '<div class="confirm-t">\u26A1 ' + esc(t("actionReq")) + '</div>' +
      '<div class="confirm-s">' + esc(c.summary || "Execute: " + c.toolName) + '</div>' +
      '<div class="confirm-btns">' +
      '<button class="cbtn y" data-a="confirm">\u2713 ' + esc(t("confirm")) + '</button>' +
      '<button class="cbtn n" data-a="reject">\u2715 ' + esc(t("cancel")) + '</button>' +
      '</div>';
    msgs.appendChild(el);
    scroll();
    const btns = el.querySelectorAll(".cbtn");
    btns.forEach(b => b.addEventListener("click", () => doConfirm(c.id, b.dataset.a, Array.from(btns))));
  }

  function setLoading(on) {
    isLoading = on;
    snd.disabled = on;
    lbar.classList.toggle("on", on);
    let tg = shadow.querySelector(".typing-group");
    if (!tg) {
      tg = mk("div", "typing-group");
      const av = mk("div", "msg-av");
      av.textContent = botName.charAt(0).toUpperCase();
      const t = mk("div", "typing");
      t.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
      tg.appendChild(av);
      tg.appendChild(t);
    }
    // Always move typing indicator to the bottom
    if (on) msgs.appendChild(tg);
    tg.classList.toggle("on", on);
    if (on) scroll();
  }

  // ─── Notification Sound (Web Audio API) ──────────────────
  function playNotificationSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // First tone - A5 (880Hz)
      const o1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      o1.type = "sine";
      o1.frequency.setValueAtTime(880, ctx.currentTime);
      g1.gain.setValueAtTime(0.15, ctx.currentTime);
      g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      o1.connect(g1);
      g1.connect(ctx.destination);
      o1.start(ctx.currentTime);
      o1.stop(ctx.currentTime + 0.15);
      // Second tone - D6 (1174.66Hz), slightly delayed
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.type = "sine";
      o2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.12);
      g2.gain.setValueAtTime(0.001, ctx.currentTime);
      g2.gain.setValueAtTime(0.15, ctx.currentTime + 0.12);
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o2.connect(g2);
      g2.connect(ctx.destination);
      o2.start(ctx.currentTime + 0.12);
      o2.stop(ctx.currentTime + 0.3);
      // Clean up context after sounds finish
      setTimeout(() => ctx.close(), 500);
    } catch(e) {}
  }

  // ─── Feedback ────────────────────────────────────────────
  function sendFeedback(data) {
    fetch(API_BASE + "/api/chat/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify(data),
    }).catch(e => console.error("ActionBot feedback error:", e));
  }

  function showRatingPrompt() {
    // Remove existing overlay if any
    const existing = shadow.querySelector(".rate-overlay");
    if (existing) existing.remove();

    const overlay = mk("div", "rate-overlay");
    const card = mk("div", "rate-card");
    let selectedRating = 0;

    card.innerHTML =
      '<div class="rate-title">Rate this conversation</div>' +
      '<div class="rate-stars" id="rateStars">' +
        [1,2,3,4,5].map(i =>
          '<button class="rate-star" data-v="' + i + '">' +
          '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
          '</button>'
        ).join("") +
      '</div>' +
      '<textarea class="rate-comment" placeholder="Any additional feedback? (optional)"></textarea>' +
      '<div class="rate-btns">' +
        '<button class="rate-btn secondary" id="rateSkip">Skip</button>' +
        '<button class="rate-btn primary" id="rateSend" disabled>Submit</button>' +
      '</div>';

    overlay.appendChild(card);
    win.appendChild(overlay);

    const stars = card.querySelectorAll(".rate-star");
    const sendBtn = card.querySelector("#rateSend");
    const skipBtn = card.querySelector("#rateSkip");
    const commentEl = card.querySelector(".rate-comment");

    stars.forEach(s => {
      s.addEventListener("click", (e) => {
        e.stopPropagation();
        selectedRating = parseInt(s.dataset.v);
        stars.forEach((st, idx) => {
          st.classList.toggle("active", idx < selectedRating);
        });
        sendBtn.disabled = false;
      });
    });

    skipBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      conversationRated = true;
      overlay.remove();
      toggle(false);
    });

    sendBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!selectedRating) return;
      sendBtn.disabled = true;
      sendFeedback({
        sessionId,
        rating: selectedRating,
        comment: commentEl.value.trim() || null,
        type: "conversation",
      });
      conversationRated = true;
      overlay.remove();
      toggle(false);
    });

    // Click overlay background to dismiss
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        conversationRated = true;
        overlay.remove();
        toggle(false);
      }
    });
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
      .replace(/\n- /g,"\n\u2022 ")
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
    fetch(API_BASE + "/api/chat/history/" + sessionId, { headers: { "X-API-Key": API_KEY } })
      .then(r => { if (!r.ok) throw new Error("Session expired"); return r.json(); })
      .then(d => {
        if (d.botName) {
          botName = d.botName;
          hname.textContent = botName;
        }
        if (d.welcomeMessage) welcomeMsg = d.welcomeMessage;
        if (d.messages?.length) {
          welcomeShown = true;
          for (const m of d.messages) {
            if (m.role === "user" && m.content) addUser(m.content);
            if (m.role === "assistant" && m.content) addBot(m.content);
          }
          if (d.pendingConfirmations?.length) {
            d.pendingConfirmations.forEach(c => addConfirm(c));
          }
        }
      })
      .catch(() => { sessionId = null; localStorage.removeItem("actionbot_session_" + API_KEY); });
  }
})();
