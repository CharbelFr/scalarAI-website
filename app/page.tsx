"use client";

import React from "react";
import clsx from "clsx";
import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────

type NavItem = {
  num: string;
  label: string;
  href: `#${string}`;
};

// ─── Nav config ──────────────────────────────────────────────────────────────

const NAV: NavItem[] = [
  { num: "01", label: "About",        href: "#about"        },
  { num: "02", label: "Case Studies", href: "#use-cases"    },
  { num: "03", label: "Scalar AI",    href: "#scalar-ai"    },
  { num: "04", label: "Publications", href: "#publications" },
  { num: "05", label: "Team",         href: "#team"         },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx("mx-auto w-full max-w-6xl px-6 md:px-10", className)}>
      {children}
    </div>
  );
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = React.useState<string>(ids[0] ?? "");
  React.useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { threshold: [0.2, 0.5], rootMargin: "-15% 0px -65% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

// ─── Scroll progress bar ─────────────────────────────────────────────────────

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.2 });
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[60] h-[1.5px] w-full origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.8), rgba(255,255,255,0.0))",
      }}
    />
  );
}

// ─── Cursor glow ─────────────────────────────────────────────────────────────

function CursorGlow() {
  const reduce = useReducedMotion();
  const [pos, setPos] = React.useState({ x: -999, y: -999 });
  const raf = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (reduce) return;
    const onMove = (e: MouseEvent) => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => setPos({ x: e.clientX, y: e.clientY }));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [reduce]);

  if (reduce) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[8]"
      style={{
        background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.055), transparent 55%)`,
      }}
    />
  );
}

// ─── Animated floating dots background ───────────────────────────────────────

function AnimatedDotsBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const reduce = useReducedMotion();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = 0, H = 0;

    type Dot = {
      x: number; y: number;
      vx: number; vy: number;
      r: number; alpha: number;
      pulseSpeed: number; pulsePhase: number;
    };

    let dots: Dot[] = [];

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      const count = Math.floor((W * H) / 7000);
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.6,
        alpha: Math.random() * 0.35 + 0.12,
        pulseSpeed: Math.random() * 0.008 + 0.003,
        pulsePhase: Math.random() * Math.PI * 2,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 1;

      for (const d of dots) {
        const pulse = Math.sin(t * d.pulseSpeed + d.pulsePhase) * 0.5 + 0.5;
        const a = d.alpha * (0.5 + pulse * 0.5);

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
        ctx.fill();

        d.x += d.vx;
        d.y += d.vy;

        if (d.x < -10) d.x = W + 10;
        if (d.x > W + 10) d.x = -10;
        if (d.y < -10) d.y = H + 10;
        if (d.y > H + 10) d.y = -10;
      }

      animId = requestAnimationFrame(draw);
    };

    if (!reduce) draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [reduce]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[2]"
      style={{ opacity: 1 }}
    />
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={clsx("relative scroll-mt-20 py-20 md:py-28", className)}>
      {children}
    </section>
  );
}

// ─── Reveal animation ─────────────────────────────────────────────────────────

function Reveal({
  children, className, delay = 0, y = 18,
}: {
  children: React.ReactNode; className?: string; delay?: number; y?: number;
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { margin: "-8% 0px -8% 0px", once: true });

  return (
    <motion.div
      ref={ref}
      className={clsx("overflow-visible", className)}
      initial={reduce ? false : { opacity: 0, y, filter: "blur(5px)" }}
      animate={
        reduce ? undefined
          : inView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y, filter: "blur(5px)" }
      }
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger children ─────────────────────────────────────────────────────────

function StaggerGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { margin: "-5% 0px -5% 0px", once: true });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={clsx("overflow-visible", className)}
      variants={reduce ? {} : {
        hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
        visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Button ────────────────────────────────────────────────────────────────────

function Button({
  children, variant = "primary", href, className,
}: {
  children: React.ReactNode; variant?: "primary" | "ghost"; href?: string; className?: string;
}) {
  const base = clsx(
    "inline-flex items-center gap-2 rounded-full text-sm font-medium transition-all duration-200 will-change-transform",
    variant === "primary"
      ? "bg-white text-zinc-950 px-5 py-2.5 hover:bg-zinc-100 hover:-translate-y-[1px] shadow-[0_1px_20px_rgba(255,255,255,0.15)]"
      : "border border-white/15 text-zinc-200 px-5 py-2.5 hover:border-white/30 hover:text-white hover:-translate-y-[1px]",
    className
  );
  if (href) return <a href={href} className={base}>{children}</a>;
  return <button className={base}>{children}</button>;
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <Reveal>
      <div className="inline-flex items-center gap-2.5">
        <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-600">{num}</span>
        <span className="h-px w-8 bg-zinc-700" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">{label}</span>
      </div>
    </Reveal>
  );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Reveal delay={0.05}>
      <h2
        className={clsx("mt-4 text-3xl text-zinc-50 md:text-4xl lg:text-[2.75rem]", className)}
        style={{
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          fontWeight: 600,
          letterSpacing: "-0.015em",
          lineHeight: 1.12,
          overflow: "visible",
        }}
      >
        {children}
      </h2>
    </Reveal>
  );
}

function SectionSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <Reveal delay={0.1}>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400">{children}</p>
    </Reveal>
  );
}

// ─── Divider ───────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/8 to-transparent" />
  );
}

// ─── Marquee ───────────────────────────────────────────────────────────────────

function Marquee({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-zinc-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-zinc-950 to-transparent" />
      <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-3">
        {children}
        {children}
      </div>
      <style>{`@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function GlassCard({
  children, className, hover = true,
}: {
  children: React.ReactNode; className?: string; hover?: boolean;
}) {
  return (
    <div className={clsx(
      "group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-sm",
      hover && "transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]",
      className
    )}>
      {hover && (
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute -inset-32 bg-[radial-gradient(350px_circle_at_50%_0%,rgba(255,255,255,0.05),transparent_70%)]" />
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Stat badge ───────────────────────────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-display text-3xl font-light tracking-tight text-zinc-50 md:text-4xl">{value}</div>
      <div className="text-xs tracking-wide text-zinc-500">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────────────────────

function Nav() {
  const active = useActiveSection(NAV.map((n) => n.href.slice(1)));
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <Container className="flex h-[68px] items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5">
            <div className="h-3 w-3 rounded-sm bg-white/80 transition group-hover:bg-white" />
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-widest text-zinc-50 uppercase">Scalar AI</div>
            <div className="font-mono text-[9px] tracking-[0.2em] text-zinc-500 uppercase">Implementation</div>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((l) => {
            const isActive = active === l.href.slice(1);
            return (
              <a
                key={l.href}
                href={l.href}
                className={clsx(
                  "relative rounded-lg px-3.5 py-2 text-[13px] tracking-wide transition-all duration-200",
                  isActive ? "text-zinc-50" : "text-zinc-400 hover:text-zinc-100"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-white/[0.07]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">{l.label}</span>
              </a>
            );
          })}
          <a
            href="#about"
            className="ml-3 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-zinc-950 shadow-[0_2px_20px_rgba(255,255,255,0.2)] transition hover:bg-zinc-100"
          >
            Book Demo <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </nav>

        {/* Mobile */}
        <a href="#about" className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-zinc-950 md:hidden">
          Demo
        </a>
      </Container>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────

function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 60]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <Section className="relative pt-12 pb-0 md:pt-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.04] blur-[120px]" />
        <div className="absolute -right-48 top-1/3 h-[400px] w-[400px] rounded-full bg-white/[0.03] blur-[100px]" />
        <div className="absolute -left-48 bottom-0 h-[400px] w-[400px] rounded-full bg-white/[0.03] blur-[100px]" />
      </div>

      <Container className="relative">
        <Reveal>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-zinc-300 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white/80" />
            </span>
            AI agents — live in production
            <span className="ml-1 text-zinc-500">→</span>
          </div>
        </Reveal>

        <motion.div style={{ y, opacity }}>
          <Reveal delay={0.06} className="mt-8">
            <h1
              className="max-w-4xl text-balance text-[clamp(2.6rem,6.5vw,5rem)] leading-[1.08] text-zinc-50"
              style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 300, letterSpacing: "-0.01em" }}
            >
              Enterprise AI.{" "}
              <span className="relative inline-block" style={{ fontWeight: 600 }}>
                <span className="relative z-10">Deployed.</span>
                <span aria-hidden className="absolute -inset-1 -z-0 rounded-xl blur-2xl" style={{ background: "rgba(255,255,255,0.06)" }} />
              </span>
              <br />
              <span style={{ color: "rgb(161,161,170)", fontWeight: 300 }}>Not just promised.</span>
            </h1>
          </Reveal>
        </motion.div>

        <Reveal delay={0.12} className="mt-7 max-w-xl">
          <p className="text-base leading-relaxed text-zinc-400 md:text-[17px]">
            Scalar AI embeds forward-deployed engineers and proprietary AI infrastructure
            directly into enterprise workflows — delivering measurable operational outcomes,
            not slide decks.
          </p>
        </Reveal>

        <Reveal delay={0.18} className="mt-8 flex flex-wrap items-center gap-3">
          <Button href="#use-cases">View case studies <ArrowRight className="h-4 w-4" /></Button>
          <Button variant="ghost" href="#about">Our working model</Button>
        </Reveal>

        <Reveal delay={0.24} className="mt-14">
          <div className="flex flex-wrap items-start gap-10 border-t border-white/[0.07] pt-10">
            <Stat value="3–6 wk" label="Pilot to production" />
            <div className="h-10 w-px bg-white/[0.08] self-center" />
            <Stat value="SME-led" label="Knowledge capture" />
            <div className="h-10 w-px bg-white/[0.08] self-center" />
            <Stat value="KPI-first" label="Deployment methodology" />
            <div className="h-10 w-px bg-white/[0.08] self-center" />
            <Stat value="NYC · DXB" label="Locations" />
          </div>
        </Reveal>

        <Reveal delay={0.3} className="mt-12 pb-0">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="mb-5 text-[10px] uppercase tracking-[0.18em] text-zinc-600">Trusted AI infrastructure from</div>
            <div className="grid grid-cols-2 items-center gap-6 sm:grid-cols-4">
              {[
                { src: "/openai.png", alt: "OpenAI" },
                { src: "/Copilot.png", alt: "Microsoft Copilot" },
                { src: "/gemini.png", alt: "Google Gemini" },
                { src: "/ClaudeAI.png", alt: "Anthropic Claude" },
              ].map((logo) => (
                <img key={logo.alt} src={logo.src} alt={logo.alt}
                  className="mx-auto h-8 object-contain opacity-40 grayscale transition duration-300 hover:opacity-70 hover:grayscale-0 md:h-10" />
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 01 ABOUT
// ─────────────────────────────────────────────────────────────────────────────

function About() {
  const pillars = [
    {
      icon: "→",
      title: "Forward-Deployed Engineers",
      desc: "Our team embeds directly into your organization — working alongside your people to understand workflows, capture knowledge, and ship AI systems that integrate with how work actually happens.",
    },
    {
      icon: "◈",
      title: "SME Intelligence Capture",
      desc: "We convert the irreplaceable expertise of your subject matter experts into structured, reusable AI intelligence — the foundation of every system we build.",
    },
    {
      icon: "◎",
      title: "KPI-Driven Delivery",
      desc: "Every engagement is anchored to measurable business outcomes. We design around your KPIs, instrument for observability, and iterate until the numbers move.",
    },
  ];

  return (
    <Section id="about">
      <Container>
        <SectionLabel num="01" label="About" />
        <SectionTitle>
          We don't consult.<br />
          <span className="text-zinc-400">We build and operate.</span>
        </SectionTitle>
        <SectionSubtitle>
          Scalar AI Implementation is an AI mission-partner — a hands-on execution firm that
          accelerates AI adoption by embedding proven systems directly into enterprise workflows.
        </SectionSubtitle>

        <StaggerGroup className="mt-12 grid gap-4 md:grid-cols-3">
          {pillars.map((p) => (
            <StaggerItem key={p.title}>
              <GlassCard className="h-full">
                <div className="mb-4 font-mono text-xl text-zinc-400">{p.icon}</div>
                <h3 className="text-sm font-semibold text-zinc-100">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{p.desc}</p>
              </GlassCard>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <Reveal delay={0.1} className="mt-6">
          <GlassCard hover={false} className="bg-white/[0.015]">
            <div className="mb-5 text-[10px] uppercase tracking-[0.18em] text-zinc-600">Industries we serve</div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: "Financial & Professional Services", desc: "Risk, operations, and decision intelligence at scale." },
                { title: "Public Sector", desc: "Workflow modernization with deployment-ready governance controls." },
                { title: "Telecom & Media", desc: "Customer operations and analytics embedded in production workflows." },
              ].map((ind) => (
                <div key={ind.title} className="rounded-xl border border-white/[0.06] p-4">
                  <div className="text-sm font-medium text-zinc-200">{ind.title}</div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">{ind.desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </Reveal>
      </Container>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 02 CASE STUDIES
// ─────────────────────────────────────────────────────────────────────────────

function GovProcurementIllustration() {
  return (
    <svg viewBox="0 0 480 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="gov-bg" x1="0" y1="0" x2="480" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f172a"/>
          <stop offset="100%" stopColor="#1e293b"/>
        </linearGradient>
        <radialGradient id="gov-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.06)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <rect width="480" height="200" fill="url(#gov-bg)" rx="12"/>
      <rect width="480" height="200" fill="url(#gov-glow)" rx="12"/>
      {[40, 80, 120, 160].map(y => (
        <line key={y} x1="0" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      ))}
      {[80, 160, 240, 320, 400].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="200" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      ))}
      <rect x="200" y="70" width="80" height="110" rx="2" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"/>
      <rect x="215" y="55" width="50" height="20" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
      <rect x="230" y="42" width="20" height="18" rx="2" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"/>
      {[0,1,2,3].map(col => [0,1,2].map(row => (
        <rect key={`${col}-${row}`} x={210 + col*16} y={80 + row*22} width="8" height="10" rx="1"
          fill={col === 1 && row === 1 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.07)"}
          stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
      )))}
      <rect x="229" y="148" width="22" height="32" rx="1" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8"/>
      <rect x="212" y="178" width="56" height="4" rx="1" fill="rgba(255,255,255,0.06)"/>
      <rect x="206" y="182" width="68" height="4" rx="1" fill="rgba(255,255,255,0.04)"/>
      <line x1="200" y1="120" x2="110" y2="80" stroke="rgba(148,163,184,0.2)" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="280" y1="120" x2="370" y2="80" stroke="rgba(148,163,184,0.2)" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="200" y1="150" x2="90" y2="155" stroke="rgba(148,163,184,0.15)" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="280" y1="150" x2="390" y2="155" stroke="rgba(148,163,184,0.15)" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="240" y1="70" x2="240" y2="30" stroke="rgba(148,163,184,0.15)" strokeWidth="1" strokeDasharray="4 3"/>
      {[
        { cx: 110, cy: 80, label: "Lead Scoring" },
        { cx: 370, cy: 80, label: "RFP Parser" },
        { cx: 90, cy: 155, label: "Compliance" },
        { cx: 390, cy: 155, label: "Analytics" },
        { cx: 240, cy: 22, label: "AI Engine" },
      ].map(({ cx, cy, label }) => (
        <g key={label}>
          <circle cx={cx} cy={cy} r="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8"/>
          <circle cx={cx} cy={cy} r="4" fill="rgba(255,255,255,0.5)"/>
          <text x={cx} y={cy + 26} textAnchor="middle" fontSize="7" fill="rgba(148,163,184,0.7)" fontFamily="IBM Plex Mono, monospace">{label}</text>
        </g>
      ))}
      <rect x="20" y="20" width="36" height="46" rx="3" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.7"/>
      <line x1="26" y1="34" x2="50" y2="34" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8"/>
      <line x1="26" y1="40" x2="50" y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
      <line x1="26" y1="46" x2="44" y2="46" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
      <rect x="424" y="118" width="36" height="46" rx="3" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.7"/>
      <line x1="430" y1="132" x2="454" y2="132" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8"/>
      <line x1="430" y1="138" x2="454" y2="138" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
      <line x1="430" y1="144" x2="448" y2="144" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
    </svg>
  );
}

function TelcoIllustration() {
  return (
    <svg viewBox="0 0 480 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="telco-bg" x1="0" y1="0" x2="480" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0c1628"/>
          <stop offset="100%" stopColor="#111827"/>
        </linearGradient>
        <radialGradient id="telco-glow1" cx="30%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(99,102,241,0.08)"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
        <radialGradient id="telco-glow2" cx="70%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(59,130,246,0.06)"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      <rect width="480" height="200" fill="url(#telco-bg)" rx="12"/>
      <rect width="480" height="200" fill="url(#telco-glow1)" rx="12"/>
      <rect width="480" height="200" fill="url(#telco-glow2)" rx="12"/>
      {[20, 36, 52, 68].map((r, i) => (
        <path key={r} d={`M 70 100 A ${r} ${r} 0 0 1 70 ${100 - r}`}
          stroke={`rgba(148,163,184,${0.18 - i * 0.04})`} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      ))}
      {[20, 36, 52, 68].map((r, i) => (
        <path key={`b${r}`} d={`M 70 100 A ${r} ${r} 0 0 0 70 ${100 + r}`}
          stroke={`rgba(148,163,184,${0.18 - i * 0.04})`} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      ))}
      <line x1="70" y1="50" x2="70" y2="155" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
      <line x1="55" y1="155" x2="85" y2="155" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      <line x1="60" y1="140" x2="80" y2="140" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2"/>
      <line x1="62" y1="120" x2="78" y2="120" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
      <rect x="66" y="46" width="8" height="8" rx="1" fill="rgba(255,255,255,0.6)"/>
      <line x1="410" y1="65" x2="410" y2="155" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      <line x1="399" y1="155" x2="421" y2="155" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
      <line x1="402" y1="142" x2="418" y2="142" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <rect x="406" y="61" width="6" height="6" rx="1" fill="rgba(255,255,255,0.4)"/>
      {[14, 26, 38].map((r, i) => (
        <path key={`rt${r}`} d={`M 410 100 A ${r} ${r} 0 0 1 410 ${100 - r}`}
          stroke={`rgba(148,163,184,${0.12 - i * 0.03})`} strokeWidth="1" fill="none"/>
      ))}
      {[
        { cx: 180, cy: 70 }, { cx: 240, cy: 45 }, { cx: 300, cy: 70 },
        { cx: 160, cy: 120 }, { cx: 240, cy: 115 }, { cx: 320, cy: 120 },
        { cx: 200, cy: 160 }, { cx: 280, cy: 160 },
      ].map(({ cx, cy }, i) => (
        <circle key={i} cx={cx} cy={cy} r="10" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.7"/>
      ))}
      {[
        [180,70, 240,45], [240,45, 300,70], [180,70, 160,120],
        [240,45, 240,115], [300,70, 320,120], [160,120, 240,115],
        [240,115, 320,120], [160,120, 200,160], [240,115, 200,160],
        [240,115, 280,160], [320,120, 280,160],
      ].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(148,163,184,0.14)" strokeWidth="0.8"/>
      ))}
      {[
        { cx: 180, cy: 70 }, { cx: 240, cy: 45 }, { cx: 300, cy: 70 },
        { cx: 160, cy: 120 }, { cx: 240, cy: 115 }, { cx: 320, cy: 120 },
        { cx: 200, cy: 160 }, { cx: 280, cy: 160 },
      ].map(({ cx, cy }, i) => (
        <circle key={i} cx={cx} cy={cy} r={i === 4 ? 5 : 3}
          fill={i === 4 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)"}/>
      ))}
      <rect x="130" y="14" width="62" height="18" rx="9" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.7"/>
      <text x="161" y="26" textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.7)" fontFamily="IBM Plex Mono, monospace" fontWeight="600">+17% ARPU</text>
      <rect x="286" y="14" width="72" height="18" rx="9" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.7"/>
      <text x="322" y="26" textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.7)" fontFamily="IBM Plex Mono, monospace" fontWeight="600">2× Digital Rev</text>
      <rect x="174" y="174" width="132" height="18" rx="9" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.7"/>
      <text x="240" y="186" textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.7)" fontFamily="IBM Plex Mono, monospace" fontWeight="600">2× Customer Engagement</text>
    </svg>
  );
}

function UseCases() {
  const govSuites = [
    {
      icon: "→",
      title: "Cognitive Lead Acceleration Suite",
      items: ["Pre-qualification assessment", "Win-probability scoring", "Pitch & article generator", "RFP predictor"],
    },
    {
      icon: "◈",
      title: "Cognitive Proposal Building",
      items: ["Intelligent RFP parser", "Proposal outline generator", "Pricing estimator", "Contract generator"],
    },
    {
      icon: "◎",
      title: "Cognitive Sourcing Suite",
      items: ["RFP generator", "Vendor self-evaluation & compliance", "Document templates"],
    },
    {
      icon: "⬡",
      title: "Cognitive Engagement Delivery Suite",
      items: ["Project performance & analytics", "GenAI market intelligence", "Compliance monitor", "KPI tracker"],
    },
  ];

  const telcoUseCases = [
    "AI-driven models exclude accounts with high churn propensity",
    "ML models segment accounts by growth potential and account needs",
    "Personalized NBO campaigns driven by AI-generated recommendations",
    "Real-time triggers: account milestones, usage-based signals, competitor engagement detection",
    "Scoring models to determine best engagement channel per account",
  ];

  const telcoKPIs = [
    { value: "17%", label: "ARPU Uplift" },
    { value: "2×", label: "Digital Channel Revenue Growth" },
    { value: "2×", label: "Customer Engagement" },
  ];

  return (
    <Section id="use-cases">
      <Container>
        <SectionLabel num="02" label="Case Studies" />
        <SectionTitle>
          Proof of impact —
          <br />
          <span className="text-zinc-400">live in production</span>
        </SectionTitle>
        <SectionSubtitle>
          End-to-end AI systems delivered across government and enterprise environments —
          anchored to measurable business outcomes from day one.
        </SectionSubtitle>

        {/* Case Study 1 */}
        <Reveal delay={0.05} className="mt-12">
          <GlassCard hover={false} className="overflow-hidden bg-white/[0.015] p-0">
            <div className="relative h-48 w-full overflow-hidden rounded-t-2xl border-b border-white/[0.07]">
              <GovProcurementIllustration />
              <div className="absolute left-5 top-5 flex items-center gap-2.5">
                <span className="inline-flex rounded-full border border-white/10 bg-zinc-950/70 px-3 py-1 text-[10px] uppercase tracking-widest text-zinc-400 backdrop-blur-sm">Case Study 01</span>
                <span className="inline-flex rounded-full border border-white/10 bg-zinc-950/70 px-3 py-1 text-[10px] uppercase tracking-widest text-zinc-400 backdrop-blur-sm">Public Sector</span>
              </div>
            </div>
            <div className="p-6 md:p-8">
              <h3 className="text-lg font-semibold leading-snug text-zinc-100 md:text-xl">Government Procurement AI</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
                A full-stack cognitive AI platform purpose-built for government procurement lifecycles —
                from early lead identification through to contract delivery and ongoing performance management.
              </p>
              <StaggerGroup className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {govSuites.map((suite) => (
                  <StaggerItem key={suite.title}>
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 h-full">
                      <div className="mb-3 font-mono text-base text-zinc-400">{suite.icon}</div>
                      <div className="text-xs font-semibold leading-snug text-zinc-200 mb-3">{suite.title}</div>
                      <ul className="space-y-1.5">
                        {suite.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-[11px] leading-relaxed text-zinc-500">
                            <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600"/>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          </GlassCard>
        </Reveal>

        {/* Case Study 2 */}
        <Reveal delay={0.1} className="mt-5">
          <GlassCard hover={false} className="overflow-hidden bg-white/[0.015] p-0">
            <div className="relative h-48 w-full overflow-hidden rounded-t-2xl border-b border-white/[0.07]">
              <TelcoIllustration />
              <div className="absolute left-5 top-5 flex items-center gap-2.5">
                <span className="inline-flex rounded-full border border-white/10 bg-zinc-950/70 px-3 py-1 text-[10px] uppercase tracking-widest text-zinc-400 backdrop-blur-sm">Case Study 02</span>
                <span className="inline-flex rounded-full border border-white/10 bg-zinc-950/70 px-3 py-1 text-[10px] uppercase tracking-widest text-zinc-400 backdrop-blur-sm">Telecom</span>
              </div>
            </div>
            <div className="p-6 md:p-8">
              <h3 className="text-lg font-semibold leading-snug text-zinc-100 md:text-xl">Telco AI-Powered Marketing Engine</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
                An end-to-end AI marketing system that personalizes customer engagement at scale —
                reducing churn, surfacing growth accounts, and driving revenue through real-time intelligence.
              </p>
              <div className="mt-6 grid gap-5 md:grid-cols-[1fr_220px]">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5">
                  <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-zinc-600">Use Cases Delivered</div>
                  <ul className="space-y-2.5">
                    {telcoUseCases.map((uc) => (
                      <li key={uc} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-400">
                        <span className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-500"/>
                        {uc}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col justify-center gap-4 rounded-xl border border-white/[0.12] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-5">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Outcomes</div>
                  {telcoKPIs.map(({ value, label }) => (
                    <div key={label} className="flex flex-col border-b border-white/[0.07] pb-4 last:border-0 last:pb-0">
                      <span className="text-4xl tracking-tight text-zinc-50" style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 300 }}>
                        {value}
                      </span>
                      <span className="mt-1 text-[11px] leading-snug text-zinc-500">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </Reveal>
      </Container>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 03 SCALAR AI
// ─────────────────────────────────────────────────────────────────────────────

function ScalarAI() {

  return (
    <Section id="scalar-ai">
      <Container>
        <SectionLabel num="03" label="Scalar AI" />
        <SectionTitle>
          Intelligence Scaled.
          <br />
          <span className="text-zinc-400">AI Native Products</span>
        </SectionTitle>

        {/* ── Product Cards ── */}
        <Reveal delay={0.15} className="mt-8">
          <div className="grid gap-4 md:grid-cols-2">

            {/* Scalar Autonomous Insights */}
            <a
              href="https://getscalar.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <GlassCard className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-zinc-400">
                      Scalar Product
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 transition group-hover:text-zinc-300" />
                  </div>
                  <div className="font-mono text-xl text-zinc-400 mb-3">◎</div>
                  <h3 className="text-sm font-semibold text-zinc-100">Scalar — Autonomous Insights</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    The autonomous insight platform for elite organizations — proprietary agents that proactively synthesize gigabytes of unstructured data into actionable intelligence, reducing time-to-hypothesis by 90% and severing the link between headcount and strategic output.
                  </p>
                </div>
                <div className="mt-5 text-xs text-zinc-600 transition group-hover:text-zinc-400">
                  getscalar.ai →
                </div>
              </GlassCard>
            </a>

            {/* Scalar Autonomous Insights */}
            <a
              href="/dubb"
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
             {/* Scalar AI DUBB */}
             <GlassCard className="h-full flex flex-col justify-between">
               <div>
                 <div className="flex items-center justify-between mb-4">
                   <span className="inline-flex rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-zinc-400">
                     Scalar Product
                   </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 transition group-hover:text-zinc-300" />
                 </div>
                 <div className="font-mono text-xl text-zinc-400 mb-3">⬡</div>
                 <h3 className="text-sm font-semibold text-zinc-100">Scalar AI DUBB</h3>
                 <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                   AI-powered video dubbing into 10+ Arabic dialects in seconds — localizing content at scale for the region's most demanding media and enterprise use cases.
                 </p>
               </div>
               <div className="mt-5 text-xs text-zinc-600  transition group-hover:text-zinc-400">
                 start dubbing →
               </div>
             </GlassCard>
            </a>


          </div>
        </Reveal>

        {/* ── CTA ── */}
        <Reveal delay={0.2} className="mt-4">
          <GlassCard hover={false} className="flex flex-col items-start gap-5 bg-white/[0.015] md:flex-row md:items-center">
            <div className="flex-1">
              <div className="text-sm font-semibold text-zinc-100">Ready to move from pilot to production?</div>
              <p className="mt-1.5 text-sm text-zinc-500">Most enterprises are stuck at pilot. We're built to change that.</p>
            </div>
            <Button href="#team">Talk to us <ArrowRight className="h-4 w-4" /></Button>
          </GlassCard>
        </Reveal>

      </Container>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 04 PUBLICATIONS — real articles, linked
// ─────────────────────────────────────────────────────────────────────────────

function Publications() {
  const pubs = [
    {
      type: "Harvard Business Review",
      source: "HBR",
      title: "Embracing Gen AI at Work",
      date: "Sep 2024",
      desc: "Gen AI can now be put to work by nearly anyone using everyday language. According to the authors' research, it will transform more than 40% of all work activity — and success will depend on mastering three core \"fusion skills\" that blend human judgment with AI capability.",
      url: "https://hbr.org/2024/09/embracing-gen-ai-at-work",
    },
    {
      type: "McKinsey & Company",
      source: "McKinsey",
      title: "The State of AI in 2025: Agents, Innovation, and Transformation",
      date: "Nov 2025",
      desc: "Most organizations are still navigating the transition from experimentation to scaled deployment. McKinsey's global survey of 1,993 participants finds that the highest-performing companies treat AI as a catalyst to transform their organizations — redesigning workflows and accelerating innovation enterprise-wide.",
      url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
    },
    {
      type: "MIT Technology Review",
      source: "MIT Tech Review",
      title: "Bridging the Operational AI Gap",
      date: "Mar 2026",
      desc: "A survey of 500 senior IT leaders finds that organizations are transitioning from AI pilots to production, but enterprise-wide scaling remains elusive. Companies with integrated data and unified governance are five times more likely to succeed — making operational foundations the defining factor in AI transformation.",
      url: "https://www.technologyreview.com/2026/03/04/1133642/bridging-the-operational-ai-gap/",
    },
    {
      type: "Harvard Business Review",
      source: "HBR",
      title: "6 Ways AI Changed Business in 2024",
      date: "Jan 2025",
      desc: "Generative AI has fundamentally shifted how enterprises approach data quality, decision-making, and operational efficiency. This analysis by Randy Bean identifies six concrete ways AI has altered the business landscape — and why companies that ignored data foundations are falling behind.",
      url: "https://hbr.org/2025/01/6-ways-ai-changed-business-in-2024-according-to-executives",
    },
  ];

  return (
    <Section id="publications">
      <Container>
        <SectionLabel num="04" label="Publications" />
        <SectionTitle>
          Thinking on AI
          <br />
          <span className="text-zinc-400">implementation</span>
        </SectionTitle>
        <SectionSubtitle>
          Frameworks, case studies, and perspectives from the front lines of enterprise AI deployment.
        </SectionSubtitle>

        <StaggerGroup className="mt-12 grid gap-4 md:grid-cols-2">
          {pubs.map((p) => (
            <StaggerItem key={p.title}>
              <GlassCard className="flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-zinc-400">
                    {p.source}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-600">{p.date}</span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold leading-snug text-zinc-100">{p.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">{p.desc}</p>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-zinc-200"
                >
                  Read article <ArrowUpRight className="h-3 w-3" />
                </a>
              </GlassCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 05 TEAM
// ─────────────────────────────────────────────────────────────────────────────

function Team() {
  const institutions = [
    "Strategy&", "Spotify", "Google", "Google Brain", "Salesforce",
    "INSEAD", "BCG", "Columbia Business School",
  ];

  const members = [
    { name: "CEO", bg: "Strategy& · INSEAD" },
    { name: "Head of Business", bg: "BCG · Columbia" },
    { name: "Lead AI Architect", bg: "Salesforce · Spotify"},
    { name: "Operations Lead", bg: "Strategy& · INSEAD" },
  ];

  return (
    <Section id="team">
      <Container>
        <SectionLabel num="05" label="Team" />
        <SectionTitle>
          Built by operators,
          <br />
          <span className="text-zinc-400">engineers, and researchers</span>
        </SectionTitle>
        <SectionSubtitle>
          An execution-first team with experience across top-tier strategy, engineering,
          and research institutions — focused on embedding AI into the core of how
          organizations work.
        </SectionSubtitle>

        <StaggerGroup className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {members.map((m) => (
            <StaggerItem key={m.name}>
              <GlassCard className="flex flex-col items-start">
                <div className="mb-4 h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04]" />
                <div className="text-sm font-semibold text-zinc-100">{m.name}</div>
                <div className="mt-1 text-xs text-zinc-500">{m.bg}</div>
              </GlassCard>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <Reveal delay={0.1} className="mt-6">
          <GlassCard hover={false} className="bg-white/[0.015]">
            <div className="mb-4 text-[10px] uppercase tracking-[0.18em] text-zinc-600">Alumni of</div>
            <Marquee>
              {institutions.map((n) => (
                <div key={n} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-[13px] text-zinc-400 whitespace-nowrap">
                  {n}
                </div>
              ))}
            </Marquee>
          </GlassCard>
        </Reveal>

        <Reveal delay={0.15} className="mt-6">
          <div className="rounded-2xl border border-white/[0.1] bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-8 md:p-10">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Contact</div>
                <h3 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-zinc-50 md:text-3xl">
                  AI Mission Partner<br />
                  <span className="text-zinc-400">for Enterprises</span>
                </h3>
                <p className="mt-3 text-sm text-zinc-500">
                  New York · Dubai — Tell us what you're building and we'll respond quickly.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button href="mailto:hello@getscalar.ai">Contact sales <ArrowRight className="h-4 w-4" /></Button>
                  <Button variant="ghost" href="#use-cases">See case studies</Button>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-zinc-950/60 p-6">
                <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Get in touch</div>
                <div className="space-y-3">
                  <input
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-white/20 focus:bg-white/[0.06]"
                    placeholder="Work email" type="email"
                  />
                  <input
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-white/20 focus:bg-white/[0.06]"
                    placeholder="Company"
                  />
                  <textarea
                    className="min-h-[100px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-white/20 focus:bg-white/[0.06] resize-none"
                    placeholder="What are you building?"
                  />
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100 hover:-translate-y-[1px]">
                    Send message <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-10">
      <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
            <div className="h-2.5 w-2.5 rounded-sm bg-white/60" />
          </div>
          <span className="font-display text-xs font-bold uppercase tracking-widest text-zinc-500">
            Scalar AI Implementation
          </span>
        </div>
        <div className="flex flex-wrap gap-5">
          {NAV.map((l) => (
            <a key={l.href} href={l.href} className="text-xs text-zinc-600 transition hover:text-zinc-300">
              {l.label}
            </a>
          ))}
        </div>
        <div className="text-xs text-zinc-700">© {new Date().getFullYear()} Scalar AI Implementation</div>
      </Container>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <div className="relative min-h-screen bg-zinc-950 font-sans text-zinc-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');
        :root {
          --font-display: 'Syne', system-ui, sans-serif;
          --font-body: 'IBM Plex Sans', system-ui, sans-serif;
          --font-mono: 'IBM Plex Mono', 'Courier New', monospace;
        }
        * { font-family: var(--font-body); }
        .font-display { font-family: var(--font-display) !important; }
        .font-mono, code, .tracking-widest { font-family: var(--font-mono) !important; }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(255,255,255,0.15); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #09090b; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      <ScrollProgress />
      <CursorGlow />
      <AnimatedDotsBackground />
      <Nav />

      <main className="relative z-[3]">
        <Hero />
        <Divider />
        <About />
        <Divider />
        <UseCases />
        <Divider />
        <ScalarAI />
        <Divider />
        <Publications />
        <Divider />
        <Team />
      </main>

      <Footer />
    </div>
  );
}
