"use client";

import React from "react";
import clsx from "clsx";
import { ArrowRight, ArrowUpRight, Upload, ChevronDown, Play, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  AnimatePresence,
} from "framer-motion";

type Language = { id: string; label: string; flag: string };
type Status = "idle" | "uploading" | "processing" | "done" | "error";
type InputMode = "url" | "file";

const INPUT_LANGUAGES: Language[] = [
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "fr", label: "French", flag: "🇫🇷" },
  { id: "es", label: "Spanish", flag: "🇪🇸" },
  { id: "es-mx", label: "Spanish — Mexican", flag: "🇲🇽" },
  { id: "de", label: "German", flag: "🇩🇪" },
  { id: "tr", label: "Turkish", flag: "🇹🇷" },
  { id: "ar", label: "Arabic", flag: "🇦🇪" },
];

const OUTPUT_LANGUAGES: Language[] = [
  { id: "ar-lb", label: "Arabic — Lebanese", flag: "🇱🇧" },
  { id: "ar-eg", label: "Arabic — Egyptian", flag: "🇪🇬" },
  { id: "ar-sa", label: "Arabic — Saudi", flag: "🇸🇦" },
];

//const WEBHOOK_URL = "http://64.225.108.151:5678/workflow/PZnVVOHit0FmHbPP";

//const WEBHOOK_URL = "https://n8n.scalar-ai.co/webhook-test/3eb7c51a-49c4-4906-8c8b-8eccf91be2e4";
const WEBHOOK_URL = "https://n8n.scalar-ai.co/webhook/3eb7c51a-49c4-4906-8c8b-8eccf91be2e4"

function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("mx-auto w-full max-w-5xl px-6 md:px-10", className)}>{children}</div>;
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.2 });
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[60] h-[1.5px] w-full origin-left"
      style={{ scaleX, background: "linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.8), rgba(255,255,255,0.0))" }}
    />
  );
}

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
    return () => { window.removeEventListener("mousemove", onMove); if (raf.current) cancelAnimationFrame(raf.current); };
  }, [reduce]);
  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[8]"
      style={{ background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.045), transparent 55%)` }} />
  );
}

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
    type Dot = { x: number; y: number; vx: number; vy: number; r: number; alpha: number; pulseSpeed: number; pulsePhase: number; };
    let dots: Dot[] = [];
    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      const count = Math.floor((W * H) / 7000);
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.6, alpha: Math.random() * 0.35 + 0.12,
        pulseSpeed: Math.random() * 0.008 + 0.003, pulsePhase: Math.random() * Math.PI * 2,
      }));
    };
    resize();
    window.addEventListener("resize", resize);
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H); t += 1;
      for (const d of dots) {
        const pulse = Math.sin(t * d.pulseSpeed + d.pulsePhase) * 0.5 + 0.5;
        const a = d.alpha * (0.5 + pulse * 0.5);
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; ctx.fill();
        d.x += d.vx; d.y += d.vy;
        if (d.x < -10) d.x = W + 10; if (d.x > W + 10) d.x = -10;
        if (d.y < -10) d.y = H + 10; if (d.y > H + 10) d.y = -10;
      }
      animId = requestAnimationFrame(draw);
    };
    if (!reduce) draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [reduce]);
  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-[2]" />;
}

// GlassCard — NOTE: no overflow-hidden so dropdowns are never clipped
function GlassCard({ children, className, hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={clsx(
      "group relative rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-sm",
      hover && "transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]",
      className
    )}>
      {children}
    </div>
  );
}

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={clsx("overflow-visible", className)}
      initial={{ opacity: 0, y: 16, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── Language Selector — opens upward above the button ───────────────────────

function LangSelect({ label, options, value, onChange }: {
  label: string; options: Language[]; value: string; onChange: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);

  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">{label}</div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.07] focus:outline-none"
      >
        <span className="flex items-center gap-2.5">
          <span>{selected?.flag}</span>
          <span>{selected?.label ?? "Select…"}</span>
        </span>
        <ChevronDown className={clsx("h-4 w-4 flex-shrink-0 text-zinc-500 transition-transform duration-200", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-[9999] rounded-xl border border-white/20 bg-zinc-900 shadow-[0_-8px_40px_rgba(0,0,0,0.8)]"
          >
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className={clsx(
                  "flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl",
                  value === opt.id ? "bg-white/[0.07] text-white" : "text-zinc-300 hover:bg-white/[0.05] hover:text-white"
                )}
              >
                <span>{opt.flag}</span>
                <span>{opt.label}</span>
                {value === opt.id && <span className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/50" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <header className={clsx("sticky top-0 z-50 transition-all duration-500", scrolled ? "border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl" : "bg-transparent")}>
      <Container className="flex h-[68px] items-center justify-between">
        <a href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5">
            <div className="h-3 w-3 rounded-sm bg-white/80 transition group-hover:bg-white" />
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-widest text-zinc-50 uppercase">Scalar DUBB</div>
            <div className="font-mono text-[9px] tracking-[0.2em] text-zinc-500 uppercase">Arabic Dialect Dubbing</div>
          </div>
        </a>
        <a href="/" className="hidden items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-[13px] text-zinc-300 transition hover:border-white/30 hover:text-white md:flex">
          ← Back to Scalar AI
        </a>
      </Container>
    </header>
  );
}

// ─── MAIN DUBB TOOL ───────────────────────────────────────────────────────────

function DubbTool() {
  const [inputMode, setInputMode] = React.useState<InputMode>("url");
  const [videoUrl, setVideoUrl] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [inputLang, setInputLang] = React.useState("en");
  const [outputLang, setOutputLang] = React.useState("ar-lb");
  const [status, setStatus] = React.useState<Status>("idle");
  const [outputUrl, setOutputUrl] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [progress, setProgress] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("video/")) { setErrorMsg("Please upload a video file."); setStatus("error"); return; }
    setFile(f); setStatus("idle"); setOutputUrl(null); setErrorMsg("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  };

  const hasInput = inputMode === "url" ? videoUrl.trim().length > 0 : file !== null;
  const isProcessing = status === "uploading" || status === "processing";
  const selectedOutput = OUTPUT_LANGUAGES.find(l => l.id === outputLang);

  const reset = () => { setFile(null); setVideoUrl(""); setStatus("idle"); setOutputUrl(null); setErrorMsg(""); setProgress(0); };

  const pollJob = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`https://n8n.scalar-ai.co/webhook/check-job?jobId=${jobId}`);
        const data = await res.json();
  
        if (data.status === "processing") {
          setProgress((p) => Math.min(p + 5, 90));
        }

        if (data.status === "done") {
          clearInterval(interval);
          setOutputUrl(data.videoUrl);
          setStatus("done");
          setProgress(100);
        }

        if (data.status === "error") {
          clearInterval(interval);
          setStatus("error");
          setErrorMsg("Processing failed.");
        }

      } catch {
        clearInterval(interval);
        setStatus("error");
        setErrorMsg("Failed to check job status.");
      }
    }, 4000);
  };

  const handleSubmit = async () => {
    if (!hasInput) return;
    setStatus("processing"); setProgress(0); setOutputUrl(null); setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("inputLanguage", inputLang);
      formData.append("outputLanguage", outputLang);
      
      if (inputMode === "file" && file) {
        formData.append("file", file);
      } else {
        formData.append("videoUrl", videoUrl.trim());
      }

      // 2. Send to n8n
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        // Note: Do NOT set Content-Type header when sending FormData; 
        // the browser will set it automatically with the correct boundary.
        body: formData,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      // 3. Handle the Response 
      // If n8n returns the file directly:
      /* const blob = await res.blob();
      setOutputUrl(URL.createObjectURL(blob));
      setStatus("done");
      setProgress(100); */
      const data = await res.json();
      const jobId = data.jobId;

      setStatus("processing");
      pollJob(jobId);

    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
/*
      const progressInterval = setInterval(() => {
        setProgress((p) => { if (p >= 85) { clearInterval(progressInterval); return 85; } return p + Math.random() * 10; });
      }, 500);

      if (inputMode === "file") {
        clearInterval(progressInterval);
        throw new Error("File upload coming soon — please paste a video URL for now.");
      }

      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoUrl.trim(),
          inputLanguage: inputLang,
          inputLanguageLabel: INPUT_LANGUAGES.find(l => l.id === inputLang)?.label ?? inputLang,
          outputLanguage: outputLang,
          outputLanguageLabel: OUTPUT_LANGUAGES.find(l => l.id === outputLang)?.label ?? outputLang,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const blob = await res.blob();
      setOutputUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
*/
  };

  return (
    <section className="relative py-16 md:py-24">
      <Container>
        <Reveal>
          <div className="inline-flex items-center gap-2.5">
            <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-600">01</span>
            <span className="h-px w-8 bg-zinc-700" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">Dubbing Studio</span>
          </div>
        </Reveal>

        <Reveal delay={0.05} className="mt-4">
          <h1 className="max-w-3xl text-3xl text-zinc-50 md:text-4xl lg:text-[2.75rem]"
            style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.12 }}>
            Dub your video into<br />
            <span className="text-zinc-400">Arabic dialects in seconds.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.1} className="mt-4">
          <p className="max-w-xl text-base leading-relaxed text-zinc-500">
            Paste a video URL or upload a file, pick your languages, and let Scalar DUBB handle the rest —
            AI-powered dubbing into Lebanese, Egyptian, and Saudi Arabic.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_340px]">

          {/* ── Left: Input + Languages + Submit ── */}
          <div className="flex flex-col gap-4">

            {/* Mode toggle */}
            <Reveal delay={0.1}>
              <div className="inline-flex rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
                {([["url", "Paste URL"], ["file", "Upload File"]] as [InputMode, string][]).map(([mode, lbl]) => (
                  <button key={mode} type="button" onClick={() => { setInputMode(mode); reset(); }}
                    className={clsx("rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200",
                      inputMode === mode ? "bg-white/[0.08] text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}>
                    {lbl}
                  </button>
                ))}
              </div>
            </Reveal>

            {/* URL input */}
            <AnimatePresence mode="wait">
              {inputMode === "url" && (
                <motion.div key="url" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                  <GlassCard hover={false}>
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">Video URL</div>
                    <input
                      type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://example.com/your-video.mp4"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-white/20 focus:bg-white/[0.06]"
                    />
                    <p className="mt-2 text-[11px] text-zinc-600">Paste a direct link — Google Drive, Dropbox, S3, or any public URL.</p>
                  </GlassCard>
                </motion.div>
              )}

              {inputMode === "file" && (
                <motion.div key="file" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                  <GlassCard hover={false} className="p-0">
                    <div
                      className={clsx("flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 transition-all duration-200",
                        dragOver ? "border-white/30 bg-white/[0.05]" : file ? "border-white/[0.12] bg-white/[0.02]" : "border-white/[0.07] hover:border-white/[0.15] hover:bg-white/[0.02]")}
                      onClick={() => !file && inputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                    >
                      <input ref={inputRef} type="file" accept="video/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                      {file ? (
                        <>
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                            <Play className="h-5 w-5 text-zinc-300" />
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-zinc-100">{file.name}</div>
                            <div className="mt-1 font-mono text-[11px] text-zinc-500">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); reset(); }}
                            className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-500 transition hover:border-white/20 hover:text-zinc-300">Remove</button>
                        </>
                      ) : (
                        <>
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                            <Upload className="h-5 w-5 text-zinc-500" />
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-zinc-300">Drop your video here</div>
                            <div className="mt-1 text-xs text-zinc-600">or click to browse — MP4, MOV, WEBM</div>
                          </div>
                        </>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Language selectors — in a plain div, NOT inside overflow-hidden */}
            <Reveal delay={0.16}>
              <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-sm overflow-visible">
                <LangSelect label="Input Language" options={INPUT_LANGUAGES} value={inputLang} onChange={setInputLang} />
                <LangSelect label="Output Dialect" options={OUTPUT_LANGUAGES} value={outputLang} onChange={setOutputLang} />
              </div>
            </Reveal>

            {/* Submit button */}
            <Reveal delay={0.2}>
              <button
                type="button"
                disabled={!hasInput || isProcessing}
                onClick={handleSubmit}
                className={clsx(
                  "flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-sm font-semibold transition-all duration-200",
                  !hasInput || isProcessing
                    ? "cursor-not-allowed bg-white/[0.05] text-zinc-600"
                    : "bg-white text-zinc-950 shadow-[0_1px_20px_rgba(255,255,255,0.15)] hover:bg-zinc-100 hover:-translate-y-[1px]"
                )}
              >
                {isProcessing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                ) : (
                  <>Dub to {selectedOutput?.label} <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </Reveal>
          </div>

          {/* ── Right: Output ── */}
          <Reveal delay={0.18} className="flex flex-col gap-4">
            <GlassCard hover={false} className="flex flex-1 flex-col">
              <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">Output</div>
              <AnimatePresence mode="wait">
                {status === "idle" && !outputUrl && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
                    <div className="font-mono text-3xl text-zinc-700">⬡</div>
                    <div className="text-xs text-zinc-600">Your dubbed video will appear here</div>
                  </motion.div>
                )}
                {isProcessing && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-1 flex-col items-center justify-center gap-5 py-16">
                    <div className="relative flex h-16 w-16 items-center justify-center">
                      <div className="absolute inset-0 animate-ping rounded-full border border-white/10" />
                      <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-zinc-300">Uploading & dubbing…</div>
                      <div className="mt-1 font-mono text-[11px] text-zinc-600">This may take a moment</div>
                    </div>
                    <div className="w-full overflow-hidden rounded-full bg-white/[0.05]">
                      <motion.div className="h-px rounded-full bg-white/40" initial={{ width: "0%" }}
                        animate={{ width: `${Math.min(progress, 100)}%` }} transition={{ ease: "linear" }} />
                    </div>
                  </motion.div>
                )}
                {status === "done" && outputUrl && (
                  <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col gap-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <CheckCircle2 className="h-4 w-4 text-zinc-300" />
                      Dubbed successfully — {selectedOutput?.label}
                    </div>
                    <video src={outputUrl} controls className="w-full rounded-xl border border-white/[0.07] bg-black" />
                    <a href={outputUrl} download={`dubb-${outputLang}.mp4`}
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-xs text-zinc-400 transition hover:border-white/[0.2] hover:text-zinc-200">
                      Download video <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                    <button type="button" onClick={reset} className="text-center text-xs text-zinc-600 transition hover:text-zinc-400">
                      Dub another video
                    </button>
                  </motion.div>
                )}
                {status === "error" && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
                    <AlertCircle className="h-8 w-8 text-zinc-500" />
                    <div className="text-sm text-zinc-400">{errorMsg || "Something went wrong."}</div>
                    <button type="button" onClick={reset}
                      className="rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-500 transition hover:border-white/20 hover:text-zinc-300">
                      Try again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { num: "01", title: "Paste or Upload", desc: "Drop a video file or paste a public URL — Google Drive, Dropbox, S3, or any direct link." },
    { num: "02", title: "Select Languages", desc: "Choose the source language of your video and the target Arabic dialect." },
    { num: "03", title: "AI Dubs", desc: "Our pipeline transcribes, translates, and synthesizes a natural-sounding voiceover in seconds." },
    { num: "04", title: "Download", desc: "Get your dubbed video back, ready to publish across any platform." },
  ];
  return (
    <section className="border-t border-white/[0.06] py-16 md:py-24">
      <Container>
        <Reveal>
          <div className="inline-flex items-center gap-2.5">
            <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-600">02</span>
            <span className="h-px w-8 bg-zinc-700" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">How it works</span>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div key={s.num} initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}>
              <GlassCard className="h-full">
                <div className="mb-4 font-mono text-[11px] tracking-widest text-zinc-600">{s.num}</div>
                <div className="text-sm font-semibold text-zinc-100">{s.title}</div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">{s.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-10">
      <Container className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
            <div className="h-2.5 w-2.5 rounded-sm bg-white/60" />
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-600">Scalar DUBB</span>
        </div>
        <a href="/" className="text-xs text-zinc-600 transition hover:text-zinc-300">← Back to Scalar AI Implementation</a>
        <div className="text-xs text-zinc-700">© {new Date().getFullYear()} Scalar AI Implementation</div>
      </Container>
    </footer>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function DubbPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 font-sans text-zinc-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');
        :root { --font-display: 'Syne', system-ui, sans-serif; --font-body: 'IBM Plex Sans', system-ui, sans-serif; --font-mono: 'IBM Plex Mono', monospace; }
        * { font-family: var(--font-body); }
        .font-display { font-family: var(--font-display) !important; }
        .font-mono, code, .tracking-widest { font-family: var(--font-mono) !important; }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(255,255,255,0.15); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #09090b; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
      <ScrollProgress />
      <CursorGlow />
      <AnimatedDotsBackground />
      <Nav />
      <main className="relative z-[3]">
        <DubbTool />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
