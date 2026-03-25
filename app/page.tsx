"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/dashboard");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      {/* ─── NAV ─── */}
      <nav style={styles.nav} className="glass">
        <div style={styles.navInner}>
          <a href="/" style={styles.logo}>
            <span style={styles.logoIcon}>⚡</span> ActionBot
          </a>
          <div style={styles.navLinks}>
            <a href="#features" style={styles.navLink}>Features</a>
            <a href="#how-it-works" style={styles.navLink}>How It Works</a>
            <a href="#pricing" style={styles.navLink}>Pricing</a>
            <a href="/login" style={styles.navLink}>Log In</a>
            <a href="/signup" className="btn-premium" style={{ fontSize: 14, padding: "10px 22px" }}>
              Start Free
            </a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroText} className="animate-fade-in-up">
            <span className="pill pill-warning" style={{ marginBottom: 20, display: "inline-block" }}>
              Now in Public Beta
            </span>
            <h1 style={styles.heroH1} className="font-serif">
              Add AI to Any Website{" "}
              <span style={styles.heroAccent}>in 60 Seconds</span>
            </h1>
            <p style={styles.heroSub}>
              ActionBot is the multi-tenant AI platform that turns any website into a
              conversational experience. One script tag. Infinite possibilities.
            </p>
            <div style={styles.heroCta}>
              <a href="/signup" className="btn-premium" style={{ fontSize: 16, padding: "14px 32px" }}>
                Start Free →
              </a>
              <a href="#demo" className="btn-secondary" style={{ fontSize: 16, padding: "14px 32px" }}>
                See Demo
              </a>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>
              No credit card required &middot; Free forever plan
            </p>
          </div>

          {/* Chat widget mockup */}
          <div style={styles.heroVisual} className="animate-fade-in-up">
            <div style={styles.widgetMock}>
              <div style={styles.widgetHeader}>
                <div style={styles.widgetDot} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>ActionBot</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>online</span>
              </div>
              <div style={styles.widgetBody}>
                <div style={styles.msgBot}>
                  <div style={styles.msgBubbleBot}>Hi! How can I help you today? 👋</div>
                </div>
                <div style={styles.msgUser}>
                  <div style={styles.msgBubbleUser}>What are your pricing plans?</div>
                </div>
                <div style={styles.msgBot}>
                  <div style={styles.msgBubbleBot}>
                    We have 3 plans: Free, Pro ($29/mo), and Enterprise.
                    Want me to show details?
                  </div>
                </div>
                <div style={styles.typingRow}>
                  <div style={styles.typingDot} />
                  <div style={{ ...styles.typingDot, animationDelay: "0.2s" }} />
                  <div style={{ ...styles.typingDot, animationDelay: "0.4s" }} />
                </div>
              </div>
              <div style={styles.widgetInput}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Type a message...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" style={styles.section}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <span className="pill" style={{ marginBottom: 12, display: "inline-block" }}>Features</span>
            <h2 style={styles.sectionTitle} className="font-serif">
              Everything you need to deploy AI
            </h2>
            <p style={styles.sectionSub}>
              Powerful features out of the box, so you can focus on your product.
            </p>
          </div>
          <div style={styles.featuresGrid} className="stagger-children">
            {[
              { icon: "🤖", title: "AI-Powered Chat", desc: "Intelligent responses using advanced AI models that understand context and intent." },
              { icon: "⚡", title: "One-Line Integration", desc: "Single script tag, works with React, Vue, Next.js, plain HTML — any framework." },
              { icon: "🌙", title: "Dark Mode", desc: "Automatic system theme detection. Your widget always looks native." },
              { icon: "🌐", title: "Multi-Language", desc: "Support for 5+ languages out of the box. Reach a global audience." },
              { icon: "🔗", title: "Webhook Actions", desc: "Connect to any API with custom actions. Book meetings, file tickets, anything." },
              { icon: "📊", title: "Analytics", desc: "Track sessions, messages, and user engagement with a beautiful dashboard." },
            ].map((f, i) => (
              <div key={i} className="premium-card" style={styles.featureCard}>
                <div style={styles.featureIcon}>{f.icon}</div>
                <h3 style={styles.featureTitle}>{f.title}</h3>
                <p style={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" style={styles.darkSection}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <span className="pill pill-active" style={{ marginBottom: 12, display: "inline-block" }}>
              How It Works
            </span>
            <h2 style={{ ...styles.sectionTitle, color: "#fff" }} className="font-serif">
              Three steps to go live
            </h2>
            <p style={{ ...styles.sectionSub, color: "rgba(255,255,255,0.6)" }}>
              From sign-up to a live AI assistant on your site in under a minute.
            </p>
          </div>
          <div style={styles.stepsRow}>
            {[
              { num: "1", title: "Sign up & configure", desc: "Create your account, name your bot, and choose your AI model." },
              { num: "2", title: "Add the script tag", desc: "Copy one line of code and paste it into your website's HTML." },
              { num: "3", title: "Your AI is live", desc: "Visitors can now chat with your AI assistant instantly." },
            ].map((s, i) => (
              <div key={i} style={styles.stepCard}>
                <div style={styles.stepNum}>{s.num}</div>
                <h3 style={styles.stepTitle}>{s.title}</h3>
                <p style={styles.stepDesc}>{s.desc}</p>
                {i < 2 && <div style={styles.stepArrow}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEMO / EMBED CODE ─── */}
      <section id="demo" style={styles.section}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <span className="pill pill-success" style={{ marginBottom: 12, display: "inline-block" }}>
              Integration
            </span>
            <h2 style={styles.sectionTitle} className="font-serif">
              One script tag. That&rsquo;s it.
            </h2>
            <p style={styles.sectionSub}>
              Drop this snippet before your closing <code>&lt;/body&gt;</code> tag and you&rsquo;re done.
            </p>
          </div>
          <div style={styles.codeBlock} className="premium-card">
            <div style={styles.codeHeader}>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ ...styles.codeDot, background: "#ff5f57" }} />
                <span style={{ ...styles.codeDot, background: "#febc2e" }} />
                <span style={{ ...styles.codeDot, background: "#28c840" }} />
              </div>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>index.html</span>
            </div>
            <pre style={styles.codePre}>
{`<script
  src="https://actionbot.app/widget.js"
  data-bot-id="YOUR_BOT_ID"
  async>
</script>`}
            </pre>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" style={styles.darkSection}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <span className="pill pill-active" style={{ marginBottom: 12, display: "inline-block" }}>
              Pricing
            </span>
            <h2 style={{ ...styles.sectionTitle, color: "#fff" }} className="font-serif">
              Simple, transparent pricing
            </h2>
            <p style={{ ...styles.sectionSub, color: "rgba(255,255,255,0.6)" }}>
              Start free, upgrade when you&rsquo;re ready.
            </p>
          </div>
          <div style={styles.pricingRow}>
            {/* Free */}
            <div className="premium-card" style={styles.priceCard}>
              <h3 style={styles.priceTitle}>Free</h3>
              <div style={styles.priceAmount}>
                $0<span style={styles.pricePer}>/mo</span>
              </div>
              <ul style={styles.priceList}>
                <li>100 messages/month</li>
                <li>1 bot</li>
                <li>Basic analytics</li>
                <li>Community support</li>
              </ul>
              <a href="/signup" className="btn-secondary" style={{ width: "100%", textAlign: "center", display: "block", textDecoration: "none" }}>
                Get Started
              </a>
            </div>

            {/* Pro */}
            <div className="premium-card" style={{ ...styles.priceCard, ...styles.priceCardPro }}>
              <span className="pill pill-warning" style={{ position: "absolute" as const, top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 11 }}>
                Most Popular
              </span>
              <h3 style={styles.priceTitle}>Pro</h3>
              <div style={styles.priceAmount}>
                $29<span style={styles.pricePer}>/mo</span>
              </div>
              <ul style={styles.priceList}>
                <li>5,000 messages/month</li>
                <li>Unlimited bots</li>
                <li>Webhook actions</li>
                <li>Priority support</li>
                <li>Advanced analytics</li>
              </ul>
              <a href="/signup" className="btn-premium" style={{ width: "100%", textAlign: "center", display: "block", textDecoration: "none", background: "#e85d04" }}>
                Start Free Trial
              </a>
            </div>

            {/* Enterprise */}
            <div className="premium-card" style={styles.priceCard}>
              <h3 style={styles.priceTitle}>Enterprise</h3>
              <div style={styles.priceAmount}>
                Custom
              </div>
              <ul style={styles.priceList}>
                <li>Unlimited messages</li>
                <li>Unlimited bots</li>
                <li>SLA guarantee</li>
                <li>Dedicated support</li>
                <li>Custom integrations</li>
              </ul>
              <a href="mailto:hello@actionbot.app" className="btn-secondary" style={{ width: "100%", textAlign: "center", display: "block", textDecoration: "none" }}>
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={styles.ctaSection}>
        <div style={styles.container}>
          <h2 style={{ ...styles.sectionTitle, color: "#fff", marginBottom: 16 }} className="font-serif">
            Ready to add AI to your website?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 17, marginBottom: 28, maxWidth: 500, margin: "0 auto 28px" }}>
            Join hundreds of teams using ActionBot to delight their users.
          </p>
          <a href="/signup" className="btn-premium" style={{ fontSize: 17, padding: "16px 40px", background: "#e85d04" }}>
            Start Free →
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerCol}>
            <span style={{ ...styles.logo, fontSize: 18 }}>
              <span style={styles.logoIcon}>⚡</span> ActionBot
            </span>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
              The multi-tenant AI chatbot platform for modern teams.
            </p>
          </div>
          <div style={styles.footerCol}>
            <h4 style={styles.footerHeading}>Product</h4>
            <a href="#features" style={styles.footerLink}>Features</a>
            <a href="#pricing" style={styles.footerLink}>Pricing</a>
            <a href="#demo" style={styles.footerLink}>Integration</a>
          </div>
          <div style={styles.footerCol}>
            <h4 style={styles.footerHeading}>Company</h4>
            <a href="#" style={styles.footerLink}>About</a>
            <a href="#" style={styles.footerLink}>Blog</a>
            <a href="mailto:hello@actionbot.app" style={styles.footerLink}>Contact</a>
          </div>
          <div style={styles.footerCol}>
            <h4 style={styles.footerHeading}>Legal</h4>
            <a href="#" style={styles.footerLink}>Privacy</a>
            <a href="#" style={styles.footerLink}>Terms</a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          &copy; {new Date().getFullYear()} ActionBot. All rights reserved.
        </div>
      </footer>

      {/* ─── INLINE KEYFRAMES FOR TYPING DOTS ─── */}
      <style>{`
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

/* ─── STYLES ─── */
const styles: Record<string, React.CSSProperties> = {
  /* Nav */
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: "0 24px",
  },
  navInner: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
  },
  logo: {
    fontFamily: "var(--font-serif)",
    fontWeight: 700,
    fontSize: 22,
    color: "var(--text-body)",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  logoIcon: { fontSize: 20 },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 28,
  },
  navLink: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-body)",
    textDecoration: "none",
    opacity: 0.7,
    transition: "opacity 0.2s",
  },

  /* Hero */
  hero: {
    paddingTop: 120,
    paddingBottom: 80,
    overflow: "hidden",
  },
  heroInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    gap: 60,
    flexWrap: "wrap" as const,
  },
  heroText: { flex: "1 1 480px" },
  heroH1: {
    fontSize: "clamp(36px, 5vw, 56px)",
    lineHeight: 1.1,
    marginBottom: 20,
    color: "var(--text-body)",
  },
  heroAccent: { color: "#e85d04" },
  heroSub: {
    fontSize: 18,
    lineHeight: 1.6,
    color: "var(--text-muted)",
    maxWidth: 520,
    marginBottom: 28,
  },
  heroCta: { display: "flex", gap: 14, flexWrap: "wrap" as const },

  /* Hero widget mockup */
  heroVisual: { flex: "1 1 340px", display: "flex", justifyContent: "center" },
  widgetMock: {
    width: 320,
    borderRadius: 20,
    background: "#1a1a2e",
    boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
    overflow: "hidden",
    animation: "float 4s ease-in-out infinite",
  },
  widgetHeader: {
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(255,255,255,0.05)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "#fff",
  },
  widgetDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#28c840",
  },
  widgetBody: { padding: "18px 14px", minHeight: 200 },
  msgBot: { marginBottom: 14, display: "flex" },
  msgBubbleBot: {
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.85)",
    padding: "10px 14px",
    borderRadius: "16px 16px 16px 4px",
    fontSize: 13,
    maxWidth: "80%",
    lineHeight: 1.5,
  },
  msgUser: { marginBottom: 14, display: "flex", justifyContent: "flex-end" },
  msgBubbleUser: {
    background: "#e85d04",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "16px 16px 4px 16px",
    fontSize: 13,
    maxWidth: "80%",
    lineHeight: 1.5,
  },
  typingRow: {
    display: "flex",
    gap: 5,
    paddingLeft: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.4)",
    animation: "blink 1.4s infinite",
  },
  widgetInput: {
    padding: "14px 18px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },

  /* Shared section */
  section: { padding: "80px 0" },
  darkSection: {
    padding: "80px 0",
    background: "var(--accent)",
    color: "#fff",
  },
  container: { maxWidth: 1200, margin: "0 auto", padding: "0 24px" },
  sectionHeader: { textAlign: "center" as const, marginBottom: 48 },
  sectionTitle: { fontSize: "clamp(28px, 4vw, 42px)", lineHeight: 1.15, marginBottom: 12 },
  sectionSub: { fontSize: 16, color: "var(--text-muted)", maxWidth: 540, margin: "0 auto" },

  /* Features */
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 20,
  },
  featureCard: { padding: "32px 28px" },
  featureIcon: { fontSize: 32, marginBottom: 14 },
  featureTitle: { fontSize: 18, fontWeight: 600, marginBottom: 8 },
  featureDesc: { fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)" },

  /* Steps */
  stepsRow: {
    display: "flex",
    justifyContent: "center",
    gap: 40,
    flexWrap: "wrap" as const,
  },
  stepCard: {
    flex: "1 1 220px",
    maxWidth: 280,
    textAlign: "center" as const,
    position: "relative" as const,
  },
  stepNum: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#e85d04",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 16,
  },
  stepTitle: { fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#fff" },
  stepDesc: { fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.6)" },
  stepArrow: {
    position: "absolute" as const,
    right: -30,
    top: 20,
    fontSize: 24,
    color: "rgba(255,255,255,0.2)",
  },

  /* Code block */
  codeBlock: {
    maxWidth: 600,
    margin: "0 auto",
    overflow: "hidden",
  },
  codeHeader: {
    padding: "12px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  codeDot: { width: 10, height: 10, borderRadius: "50%", display: "inline-block" },
  codePre: {
    padding: "24px 22px",
    margin: 0,
    fontSize: 14,
    lineHeight: 1.7,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    color: "var(--text-body)",
    overflowX: "auto" as const,
  },

  /* Pricing */
  pricingRow: {
    display: "flex",
    justifyContent: "center",
    gap: 24,
    flexWrap: "wrap" as const,
  },
  priceCard: {
    flex: "1 1 280px",
    maxWidth: 340,
    padding: "36px 28px",
    position: "relative" as const,
  },
  priceCardPro: {
    border: "2px solid #e85d04",
    transform: "scale(1.04)",
  },
  priceTitle: { fontSize: 20, fontWeight: 600, marginBottom: 8 },
  priceAmount: { fontSize: 42, fontWeight: 700, marginBottom: 20, fontFamily: "var(--font-serif)" },
  pricePer: { fontSize: 16, fontWeight: 400, color: "var(--text-muted)" },
  priceList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 24px",
    fontSize: 14,
    lineHeight: 2.2,
    color: "var(--text-muted)",
  },

  /* Final CTA */
  ctaSection: {
    padding: "80px 0",
    background: "linear-gradient(135deg, #1B1C15 0%, #2a2b20 100%)",
    textAlign: "center" as const,
  },

  /* Footer */
  footer: {
    borderTop: "1px solid rgba(0,0,0,0.08)",
    padding: "48px 24px 24px",
  },
  footerInner: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 48,
  },
  footerCol: {
    flex: "1 1 180px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  footerHeading: { fontSize: 13, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 6 },
  footerLink: { fontSize: 14, color: "var(--text-muted)", textDecoration: "none" },
  footerBottom: {
    maxWidth: 1200,
    margin: "32px auto 0",
    paddingTop: 20,
    borderTop: "1px solid rgba(0,0,0,0.06)",
    fontSize: 13,
    color: "var(--text-muted)",
    textAlign: "center" as const,
  },
};
