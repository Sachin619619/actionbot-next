"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

/* ─── DEMO CHAT DATA ─── */
const DEMO_MESSAGES = [
  { role: "bot", text: "Hi! I'm FoodBot 🍔 How can I help you today?", delay: 0 },
  { role: "user", text: "Find me pizza places nearby", delay: 1200 },
  { role: "tool", name: "search_restaurants", input: '{"cuisine":"pizza","location":"nearby"}', delay: 2400 },
  { role: "tool_result", data: '3 restaurants found', delay: 3200 },
  { role: "bot", text: "I found 3 great pizza places! 🍕\n\n1. **Pizza Paradise** ⭐ 4.8 — $12\n2. **Italiano Express** ⭐ 4.6 — $15\n3. **Slice House** ⭐ 4.5 — $10\n\nWant to order from any?", delay: 4000 },
  { role: "user", text: "Order from Pizza Paradise, one Margherita", delay: 6000 },
  { role: "tool", name: "add_to_cart", input: '{"restaurant":"Pizza Paradise","item":"Margherita"}', delay: 7200 },
  { role: "tool_result", data: 'Added to cart — Total: $12', delay: 8000 },
  { role: "bot", text: "Added! 🛒 Your cart:\n• Margherita — $12\n\nReady to checkout?", delay: 8800 },
  { role: "user", text: "Yes, deliver to my home", delay: 10500 },
  { role: "tool", name: "place_order", input: '{"address":"Home","payment":"saved_card"}', delay: 11700 },
  { role: "tool_result", data: 'Order #4521 confirmed!', delay: 12500 },
  { role: "bot", text: "Order placed! 🎉 Your Margherita from Pizza Paradise is on its way.\n\n📦 Order #4521\n⏱️ Estimated delivery: 25 mins", delay: 13300 },
];

/* ─── ANIMATED COUNTER ─── */
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = target / 40;
          const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
          }, 30);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
}

export default function LandingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [visibleMsgs, setVisibleMsgs] = useState(0);
  const [demoStarted, setDemoStarted] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("actionbot_token");
    if (token) { router.replace("/dashboard"); }
    else { setReady(true); }
  }, [router]);

  // Auto-play demo chat
  useEffect(() => {
    if (!demoStarted) return;
    if (visibleMsgs >= DEMO_MESSAGES.length) return;

    const nextMsg = DEMO_MESSAGES[visibleMsgs];
    const delay = visibleMsgs === 0 ? 500 : nextMsg.delay - (DEMO_MESSAGES[visibleMsgs - 1]?.delay || 0);

    const timer = setTimeout(() => {
      setVisibleMsgs((v) => v + 1);
      // Auto scroll chat
      setTimeout(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 50);
    }, delay);

    return () => clearTimeout(timer);
  }, [visibleMsgs, demoStarted]);

  // Start demo when section is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !demoStarted) {
          setDemoStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    const el = document.getElementById("live-demo");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [ready, demoStarted]);

  if (!ready) return null;

  return (
    <div style={{ background: "#fafaf8", minHeight: "100vh" }}>
      {/* ─── NAV ─── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, padding: "0 24px" }}>
          <a href="/" style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 22, color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 32, height: 32, borderRadius: 10, background: "#e85d04", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff" }}>⚡</span>
            ActionBot
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a href="#features" style={darkNavLinkStyle}>Features</a>
            <a href="#live-demo" style={darkNavLinkStyle}>Live Demo</a>
            <a href="#channels" style={darkNavLinkStyle}>Channels</a>
            <a href="#pricing" style={darkNavLinkStyle}>Pricing</a>
            <a href="/login" style={{ ...darkNavLinkStyle, fontWeight: 600 }}>Log In</a>
            <a href="/signup" style={{ background: "#e85d04", color: "#fff", padding: "9px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none", transition: "transform 0.2s" }}>
              Start Free
            </a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ position: "relative", paddingTop: 140, paddingBottom: 80, overflow: "hidden", background: "#0a0a12" }}>
        {/* Dark hero background with subtle grain */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 80% 60% at 50% 30%, #1a1040 0%, #0d1117 50%, #0a0a12 100%)",
        }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(232,93,4,0.15)", border: "1px solid rgba(232,93,4,0.25)", borderRadius: 100, padding: "6px 16px", fontSize: 13, fontWeight: 600, color: "#fb923c", marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e85d04", animation: "pulse 2s infinite" }} />
            Now with WhatsApp, Telegram & Slack
          </div>

          <h1 style={{ fontSize: "clamp(40px, 6vw, 68px)", lineHeight: 1.08, fontWeight: 800, color: "#fff", marginBottom: 20, fontFamily: "var(--font-serif)" }}>
            Your AI Assistant,<br />
            <span style={{ color: "#fb923c" }}>Everywhere</span>
          </h1>

          <p style={{ fontSize: 19, lineHeight: 1.6, color: "rgba(255,255,255,0.7)", maxWidth: 580, margin: "0 auto 32px" }}>
            Deploy an AI chatbot on your website, WhatsApp, Telegram & Slack — with tool calling, knowledge base, and analytics. One platform.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/signup" style={{ background: "#e85d04", color: "#fff", padding: "15px 36px", borderRadius: 14, fontSize: 16, fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 14px rgba(232,93,4,0.3)" }}>
              Start Free →
            </a>
            <a href="#live-demo" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", color: "#fff", padding: "15px 36px", borderRadius: 14, fontSize: 16, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.15)" }}>
              Watch Demo
            </a>
          </div>

          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 14 }}>
            No credit card required · Free forever plan
          </p>

          {/* Trust bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, marginTop: 48, flexWrap: "wrap" }}>
            {[
              { num: 500, suffix: "+", label: "Businesses" },
              { num: 50000, suffix: "+", label: "Messages/day" },
              { num: 99, suffix: "%", label: "Uptime" },
              { num: 4, suffix: " Channels", label: "Integrated" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", fontFamily: "var(--font-serif)" }}>
                  <AnimatedNumber target={s.num} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ padding: "80px 0", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0f7ff", border: "1px solid #dbeafe", borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: "#2563eb", marginBottom: 12 }}>
              Features
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#1a1a1a", marginBottom: 12, fontFamily: "var(--font-serif)" }}>
              Everything you need to deploy AI
            </h2>
            <p style={{ fontSize: 16, color: "#888", maxWidth: 540, margin: "0 auto" }}>
              Powerful features out of the box — so you can focus on your product.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {[
              { icon: "🤖", title: "AI-Powered Chat", desc: "Advanced AI that understands context, handles multi-turn conversations, and executes real actions.", color: "#e85d04" },
              { icon: "⚡", title: "Tool Calling", desc: "Connect your APIs as tools. The AI decides when to call them — search, book, order, anything.", color: "#2563eb" },
              { icon: "🌐", title: "Multi-Channel", desc: "One bot on Website, WhatsApp, Telegram & Slack. Manage everything from a single dashboard.", color: "#16a34a" },
              { icon: "📚", title: "Knowledge Base", desc: "Add FAQs, docs, and policies. The AI uses them to give accurate, contextual answers.", color: "#9333ea" },
              { icon: "🔗", title: "Webhook Actions", desc: "Trigger any workflow — send emails, create tickets, update CRMs — via simple webhooks.", color: "#dc2626" },
              { icon: "📊", title: "Analytics & Logs", desc: "Track sessions, messages, user engagement, and bot performance with rich visualizations.", color: "#0891b2" },
            ].map((f, i) => (
              <div key={i} style={{ background: "#fafaf8", borderRadius: 20, padding: "28px 24px", border: "1px solid rgba(0,0,0,0.05)", transition: "all 0.3s" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${f.color}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#888" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIVE DEMO ─── */}
      <section id="live-demo" style={{ padding: "80px 0", background: "#0f0f0f" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(232,93,4,0.15)", border: "1px solid rgba(232,93,4,0.2)", borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: "#e85d04", marginBottom: 12 }}>
              Live Demo
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#fff", marginBottom: 12, fontFamily: "var(--font-serif)" }}>
              Watch AI execute real actions
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", maxWidth: 540, margin: "0 auto" }}>
              See how ActionBot searches restaurants, adds to cart, and places orders — all through natural conversation.
            </p>
          </div>

          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            {/* Phone frame */}
            <div style={{ borderRadius: 28, background: "#1a1a2e", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Header */}
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "#e85d04", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🍔</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>FoodBot</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Powered by ActionBot</div>
                </div>
                <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
              </div>

              {/* Chat body */}
              <div ref={chatRef} style={{ padding: "16px", minHeight: 420, maxHeight: 420, overflowY: "auto", scrollBehavior: "smooth" }}>
                {DEMO_MESSAGES.slice(0, visibleMsgs).map((msg, i) => {
                  if (msg.role === "bot") {
                    return (
                      <div key={i} style={{ marginBottom: 12, display: "flex", animation: "fadeInUp 0.3s ease" }}>
                        <div style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", padding: "10px 14px", borderRadius: "16px 16px 16px 4px", fontSize: 13, maxWidth: "85%", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  }
                  if (msg.role === "user") {
                    return (
                      <div key={i} style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end", animation: "fadeInUp 0.3s ease" }}>
                        <div style={{ background: "#e85d04", color: "#fff", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", fontSize: 13, maxWidth: "80%", lineHeight: 1.5 }}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  }
                  if (msg.role === "tool") {
                    return (
                      <div key={i} style={{ marginBottom: 8, display: "flex", animation: "fadeInUp 0.3s ease" }}>
                        <div style={{ background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 12, padding: "8px 12px", fontSize: 11, maxWidth: "90%", fontFamily: "monospace" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb", animation: "pulse 1s infinite" }} />
                            <span style={{ fontWeight: 700, color: "#2563eb", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Tool Call</span>
                          </div>
                          <div style={{ color: "#93c5fd" }}>{msg.name}({msg.input})</div>
                        </div>
                      </div>
                    );
                  }
                  if (msg.role === "tool_result") {
                    return (
                      <div key={i} style={{ marginBottom: 12, display: "flex", animation: "fadeInUp 0.3s ease" }}>
                        <div style={{ background: "rgba(22,163,106,0.12)", border: "1px solid rgba(22,163,106,0.2)", borderRadius: 12, padding: "6px 12px", fontSize: 11, fontFamily: "monospace" }}>
                          <span style={{ color: "#4ade80", fontWeight: 600 }}>✓ </span>
                          <span style={{ color: "#86efac" }}>{msg.data}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Typing indicator */}
                {visibleMsgs < DEMO_MESSAGES.length && demoStarted && (
                  <div style={{ display: "flex", gap: 5, paddingLeft: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.4)", animation: "blink 1.4s infinite" }} />
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.4)", animation: "blink 1.4s infinite 0.2s" }} />
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.4)", animation: "blink 1.4s infinite 0.4s" }} />
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                  Type a message...
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e85d04", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14 }}>→</div>
              </div>
            </div>

            {/* Demo replay button */}
            {visibleMsgs >= DEMO_MESSAGES.length && (
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button
                  onClick={() => { setVisibleMsgs(0); setDemoStarted(true); }}
                  style={{ background: "rgba(232,93,4,0.15)", color: "#e85d04", border: "1px solid rgba(232,93,4,0.3)", padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  ↻ Replay Demo
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: "80px 0", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: "#16a34a", marginBottom: 12 }}>
              How It Works
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#1a1a1a", marginBottom: 12, fontFamily: "var(--font-serif)" }}>
              Go live in 3 steps
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, maxWidth: 1000, margin: "0 auto" }}>
            {[
              { num: "01", title: "Configure your bot", desc: "Name it, set personality, add knowledge base, and connect your API tools. No coding needed.", icon: "⚙️" },
              { num: "02", title: "Connect channels", desc: "Embed on your website with one script tag, or connect WhatsApp, Telegram & Slack instantly.", icon: "🔌" },
              { num: "03", title: "Watch it work", desc: "Your AI handles conversations, executes actions, and you monitor everything from the dashboard.", icon: "📊" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#fafaf8", borderRadius: 24, padding: "32px 28px", border: "1px solid rgba(0,0,0,0.05)", position: "relative" }}>
                <div style={{ position: "absolute", top: 20, right: 24, fontSize: 48, fontWeight: 900, color: "rgba(0,0,0,0.03)", fontFamily: "var(--font-serif)" }}>{s.num}</div>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{s.icon}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "#888" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CHANNELS ─── */}
      <section id="channels" style={{ padding: "80px 0", background: "#fafaf8" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: "#9333ea", marginBottom: 12 }}>
              Multi-Channel
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#1a1a1a", marginBottom: 12, fontFamily: "var(--font-serif)" }}>
              One bot, every platform
            </h2>
            <p style={{ fontSize: 16, color: "#888", maxWidth: 540, margin: "0 auto" }}>
              Your AI assistant works everywhere your customers are. Same brain, same tools, different channels.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, maxWidth: 1000, margin: "0 auto" }}>
            {[
              { icon: "🌐", name: "Website Widget", desc: "Embed a chat widget on any site with a single script tag", color: "#e85d04", tag: "1-line embed" },
              { icon: "💬", name: "WhatsApp", desc: "Connect via WhatsApp Business API for customer support", color: "#25D366", tag: "Business API" },
              { icon: "✈️", name: "Telegram", desc: "Create a Telegram bot that auto-connects to your AI", color: "#0088cc", tag: "Bot API" },
              { icon: "#️⃣", name: "Slack", desc: "Add your AI assistant to any Slack workspace", color: "#4A154B", tag: "Events API" },
            ].map((ch, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", border: "1px solid rgba(0,0,0,0.05)", textAlign: "center", transition: "all 0.3s" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{ch.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>{ch.name}</h3>
                <div style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 100, fontSize: 10, fontWeight: 600, background: `${ch.color}12`, color: ch.color, border: `1px solid ${ch.color}20`, marginBottom: 10 }}>
                  {ch.tag}
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "#888" }}>{ch.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EMBED CODE ─── */}
      <section style={{ padding: "80px 0", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fefce8", border: "1px solid #fde68a", borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: "#ca8a04", marginBottom: 12 }}>
              Integration
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#1a1a1a", marginBottom: 12, fontFamily: "var(--font-serif)" }}>
              One script tag. That&rsquo;s it.
            </h2>
          </div>

          <div style={{ maxWidth: 600, margin: "0 auto", borderRadius: 20, overflow: "hidden", background: "#1a1a1a", boxShadow: "0 10px 40px rgba(0,0,0,0.12)" }}>
            <div style={{ padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>index.html</span>
            </div>
            <pre style={{ padding: "24px 22px", margin: 0, fontSize: 14, lineHeight: 1.8, fontFamily: "'SF Mono', 'Fira Code', monospace", color: "#4ade80", overflowX: "auto" }}>
{`<script
  src="https://actionbot-next.vercel.app/widget.js"
  data-tenant="YOUR_API_KEY"
  async>
</script>`}
            </pre>
          </div>
        </div>
      </section>

      {/* ─── USE CASES ─── */}
      <section style={{ padding: "80px 0", background: "#fafaf8" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#1a1a1a", marginBottom: 12, fontFamily: "var(--font-serif)" }}>
              Built for every use case
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              { emoji: "🛒", title: "E-Commerce", desc: "Product search, order tracking, returns — all automated" },
              { emoji: "🏥", title: "Healthcare", desc: "Appointment booking, symptom checking, prescription reminders" },
              { emoji: "🏨", title: "Hospitality", desc: "Room booking, concierge services, menu ordering" },
              { emoji: "🏦", title: "Finance", desc: "Account inquiries, transaction alerts, loan applications" },
              { emoji: "🎓", title: "Education", desc: "Course enrollment, FAQ handling, student support" },
              { emoji: "🏢", title: "SaaS", desc: "Onboarding, feature guidance, billing support" },
            ].map((uc, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "24px 20px", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{uc.emoji}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>{uc.title}</h3>
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" style={{ padding: "80px 0", background: "#0f0f0f" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(232,93,4,0.15)", border: "1px solid rgba(232,93,4,0.2)", borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: "#e85d04", marginBottom: 12 }}>
              Pricing
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#fff", marginBottom: 12, fontFamily: "var(--font-serif)" }}>
              Simple, transparent pricing
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", maxWidth: 540, margin: "0 auto" }}>
              Start free, upgrade when you&rsquo;re ready.
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            {[
              {
                name: "Starter", price: "₹399", period: "/mo", popular: false,
                features: ["1,000 messages/month", "1 bot", "Website widget", "Basic analytics", "Email support"],
                cta: "Get Started", ctaLink: "/signup",
              },
              {
                name: "Growth", price: "₹699", period: "/mo", popular: true,
                features: ["10,000 messages/month", "Unlimited bots", "All channels (WhatsApp, Telegram, Slack)", "Webhook actions & tools", "Advanced analytics", "Priority support"],
                cta: "Start Free Trial", ctaLink: "/signup",
              },
              {
                name: "Enterprise", price: "₹999", period: "/mo", popular: false,
                features: ["Unlimited messages", "Unlimited bots", "All channels", "Custom integrations", "SLA guarantee", "Dedicated support"],
                cta: "Get Started", ctaLink: "/signup",
              },
            ].map((plan, i) => (
              <div key={i} style={{
                flex: "1 1 300px", maxWidth: 360, borderRadius: 24, padding: "36px 28px",
                background: plan.popular ? "linear-gradient(135deg, #1a1a2e 0%, #1e1e3e 100%)" : "rgba(255,255,255,0.04)",
                border: plan.popular ? "2px solid #e85d04" : "1px solid rgba(255,255,255,0.08)",
                position: "relative", transform: plan.popular ? "scale(1.04)" : "none",
              }}>
                {plan.popular && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#e85d04", color: "#fff", padding: "4px 16px", borderRadius: 100, fontSize: 11, fontWeight: 700 }}>
                    Most Popular
                  </div>
                )}
                <h3 style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{plan.name}</h3>
                <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", marginBottom: 20, fontFamily: "var(--font-serif)" }}>
                  {plan.price}<span style={{ fontSize: 16, fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", fontSize: 14, lineHeight: 2.2, color: "rgba(255,255,255,0.6)" }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#22c55e", fontSize: 14 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href={plan.ctaLink} style={{
                  display: "block", textAlign: "center", padding: "13px 0", borderRadius: 14, fontSize: 14, fontWeight: 600, textDecoration: "none",
                  background: plan.popular ? "#e85d04" : "rgba(255,255,255,0.08)",
                  color: "#fff", border: plan.popular ? "none" : "1px solid rgba(255,255,255,0.12)",
                }}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY ACTIONBOT COMPARISON ─── */}
      <section id="compare" style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#e85d04", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, display: "block" }}>
              Why ActionBot?
            </span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#111", marginBottom: 12, fontFamily: "var(--font-serif)" }}>
              Compare with alternatives
            </h2>
            <p style={{ color: "#666", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>
              ActionBot gives you enterprise-grade AI automation at a fraction of the cost
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "2px solid #e5e7eb", color: "#9ca3af", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Feature</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", borderBottom: "2px solid #e85d04", color: "#e85d04", fontSize: 13, fontWeight: 700 }}>ActionBot</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", borderBottom: "2px solid #e5e7eb", color: "#9ca3af", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Intercom</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", borderBottom: "2px solid #e5e7eb", color: "#9ca3af", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Drift</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", borderBottom: "2px solid #e5e7eb", color: "#9ca3af", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Tidio</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "AI-Powered Responses", actionbot: true, intercom: true, drift: true, tidio: true },
                  { feature: "Custom Tool Calling (APIs)", actionbot: true, intercom: false, drift: false, tidio: false },
                  { feature: "Multi-Channel (WhatsApp, Telegram, Slack)", actionbot: true, intercom: "partial", drift: false, tidio: "partial" },
                  { feature: "Knowledge Base RAG", actionbot: true, intercom: true, drift: true, tidio: true },
                  { feature: "Human Handoff / Live Takeover", actionbot: true, intercom: true, drift: true, tidio: true },
                  { feature: "Webhook Actions", actionbot: true, intercom: false, drift: false, tidio: false },
                  { feature: "Multi-Tenant / White-Label", actionbot: true, intercom: false, drift: false, tidio: false },
                  { feature: "Custom Bot Personality", actionbot: true, intercom: "partial", drift: false, tidio: true },
                  { feature: "Embeddable Widget", actionbot: true, intercom: true, drift: true, tidio: true },
                  { feature: "Starting Price", actionbot: "₹399/mo", intercom: "$74/mo", drift: "$2,500/mo", tidio: "$29/mo" },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "13px 16px", color: "#374151", fontWeight: 500 }}>{row.feature}</td>
                    {[row.actionbot, row.intercom, row.drift, row.tidio].map((val, j) => (
                      <td key={j} style={{ padding: "13px 16px", textAlign: "center" }}>
                        {val === true ? (
                          <span style={{ color: j === 0 ? "#e85d04" : "#22c55e", fontSize: 18, fontWeight: 700 }}>✓</span>
                        ) : val === false ? (
                          <span style={{ color: "#d1d5db", fontSize: 18 }}>✕</span>
                        ) : val === "partial" ? (
                          <span style={{ color: "#f59e0b", fontSize: 12, fontWeight: 600 }}>Partial</span>
                        ) : (
                          <span style={{ color: j === 0 ? "#e85d04" : "#6b7280", fontSize: 13, fontWeight: j === 0 ? 700 : 500 }}>{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>
              ActionBot is the only platform that combines AI chat, custom tool calling, webhook actions, and multi-channel support — all in one affordable package.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{ padding: "80px 0", background: "linear-gradient(135deg, #e85d04 0%, #c2410c 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 24px" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#fff", marginBottom: 16, fontFamily: "var(--font-serif)" }}>
            Ready to add AI to your business?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 17, marginBottom: 28, lineHeight: 1.6 }}>
            Join hundreds of teams using ActionBot to delight their users across every channel.
          </p>
          <a href="/signup" style={{ display: "inline-block", background: "#fff", color: "#e85d04", padding: "16px 40px", borderRadius: 16, fontSize: 17, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            Start Free →
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: "#0f0f0f", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 24px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 48 }}>
          <div style={{ flex: "1 1 240px" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 20, color: "#fff", display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: "#e85d04", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff" }}>⚡</span>
              ActionBot
            </div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6 }}>
              The multi-tenant AI chatbot platform for modern teams. Deploy on web, WhatsApp, Telegram & Slack.
            </p>
          </div>
          {[
            { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "Channels", href: "#channels" }, { label: "Pricing", href: "#pricing" }, { label: "Demo", href: "#live-demo" }] },
            { title: "Company", links: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }, { label: "Contact", href: "mailto:hello@actionbot.app" }] },
            { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }] },
          ].map((col, i) => (
            <div key={i} style={{ flex: "1 1 140px" }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>{col.title}</h4>
              {col.links.map((link, j) => (
                <a key={j} href={link.href} style={{ display: "block", fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none", lineHeight: 2.2 }}>
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1200, margin: "32px auto 0", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
          &copy; {new Date().getFullYear()} ActionBot. All rights reserved.
        </div>
      </footer>

      {/* ─── KEYFRAMES ─── */}
      <style>{`
        @keyframes blink { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        a:hover { opacity: 0.9; }
      `}</style>
    </div>
  );
}

const navLinkStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none",
};
const darkNavLinkStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.7)", textDecoration: "none",
};
