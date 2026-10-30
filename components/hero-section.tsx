"use client"

import { useEffect, useRef, useState } from "react"
import { FloatingSparks } from "@/components/floating-sparks"

const TERMINAL_LINES = [
  { text: "$ termtone init --profile typewriter", delay: 0 },
  { text: "> Loading sound pack... [████████████] 100%", delay: 900 },
  { text: "> AI phase detection: ENABLED", delay: 1600 },
  { text: "> Keymap bound to: ~/.termtone/config.toml", delay: 2300 },
  { text: "> 12 custom triggers ready.", delay: 3000 },
  { text: "✓ Your terminal has a voice now.", delay: 3700 },
]

export function HeroSection() {
  const [visibleLines, setVisibleLines] = useState<number[]>([])
  const [cursorLine, setCursorLine] = useState(0)
  const termRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timers = TERMINAL_LINES.map((line, i) =>
      setTimeout(() => {
        setVisibleLines((prev) => (prev.includes(i) ? prev : [...prev, i]))
        setCursorLine(i)
      }, line.delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--phosphor) 1px, transparent 1px), linear-gradient(90deg, var(--phosphor) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Floating multicolor sparks */}
      <FloatingSparks count={32} />

      {/* CRT vignette */}
      <div className="absolute inset-0 crt-vignette" />

      {/* Corner decorations */}
      <div className="absolute top-20 left-6 text-muted-foreground text-xs font-mono opacity-40">
        <div>SYS:ONLINE</div>
        <div>MEM:512KB</div>
        <div>PORT:8080</div>
      </div>
      <div className="absolute top-20 right-6 text-muted-foreground text-xs font-mono opacity-40 text-right">
        <div>TERMTONE OS</div>
        <div>BUILD:2026.1</div>
        <div>AUDIO:READY</div>
      </div>

      {/* Horizontal rules */}
      <div className="absolute top-28 left-0 right-0 h-px bg-border opacity-30" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 border border-border px-3 py-1 mb-8 slide-up">
          <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-glow" />
          <span className="text-muted-foreground text-xs tracking-widest uppercase">
            Sound cues for AI CLIs · concept
          </span>
        </div>

        {/* Headline */}
        <h1
          className="slide-up-d1 mb-4 leading-none tracking-tight text-balance"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span
            className="block text-primary phosphor-glow"
            style={{ fontSize: "clamp(4rem, 12vw, 9rem)", lineHeight: 1 }}
          >
            TERMTONE
          </span>
          <span
            className="block text-amber amber-glow"
            style={{ fontSize: "clamp(1.4rem, 4vw, 2.8rem)", letterSpacing: "0.4em" }}
          >
            TERMINAL SOUNDBOARD
          </span>
        </h1>

        {/* Subheadline */}
        <p className="slide-up-d2 text-muted-foreground text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-10 text-balance">
          Give your terminal a voice. Typewriter sounds, AI phase cues, YES/NO prompts, output triggers — 12 fully customizable audio pads, built for solo devs who ship with style.
        </p>

        {/* CTAs */}
        <div className="slide-up-d3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="#pricing"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
            }}
            className="px-8 py-3 bg-primary text-primary-foreground text-xs tracking-widest uppercase font-mono box-glow-strong hover:bg-accent transition-all duration-300 pulse-glow"
          >
            Get Lifetime Access — $9
          </a>
          <a
            href="#soundboard"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById("soundboard")?.scrollIntoView({ behavior: "smooth" })
            }}
            className="px-8 py-3 border border-border text-muted-foreground text-xs tracking-widest uppercase font-mono hover:border-primary hover:text-primary transition-all duration-300"
          >
            Try the Soundboard
          </a>
        </div>

        {/* Terminal window */}
        <div
          ref={termRef}
          className="slide-up-d4 relative max-w-2xl mx-auto border border-border box-glow text-left"
          style={{ animation: "crt-flicker 8s infinite" }}
        >
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive opacity-70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber opacity-70" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-70" />
            <span className="ml-3 text-muted-foreground text-xs tracking-widest">
              bash — 80×24 — TermTone active
            </span>
            <span className="ml-auto text-primary text-xs">●</span>
          </div>
          {/* Terminal body */}
          <div className="p-5 min-h-40 font-mono text-sm leading-relaxed bg-crt-surface">
            {TERMINAL_LINES.map((line, i) => (
              <div
                key={i}
                className={`transition-opacity duration-300 ${
                  visibleLines.includes(i) ? "opacity-100" : "opacity-0"
                } ${
                  line.text.startsWith("✓")
                    ? "text-primary phosphor-glow-sm"
                    : line.text.startsWith(">")
                    ? "text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {line.text}
                {cursorLine === i && visibleLines.includes(i) && i < TERMINAL_LINES.length - 1 && (
                  <span className="cursor-blink text-primary">▌</span>
                )}
              </div>
            ))}
            {visibleLines.length === TERMINAL_LINES.length && (
              <div className="text-foreground mt-1">
                ${" "}
                <span className="cursor-blink text-primary">▌</span>
              </div>
            )}
          </div>
          {/* Bottom scanline effect */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-primary opacity-20" />
        </div>

        {/* Stats row */}
        <div className="slide-up-d4 flex items-center justify-center gap-8 mt-10 flex-wrap">
          {[
            { value: "12", label: "Sound Triggers",  color: "text-phosphor phosphor-glow-sm" },
            { value: "$9", label: "Lifetime Access",  color: "text-amber amber-glow" },
            { value: "AI", label: "Phase Detection",  color: "text-cyan cyan-glow" },
            { value: "∞",  label: "Free Updates",     color: "text-magenta magenta-glow" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`font-mono ${stat.color}`} style={{ fontFamily: "var(--font-display)", fontSize: "2rem" }}>
                {stat.value}
              </div>
              <div className="text-muted-foreground text-xs tracking-widest uppercase mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border opacity-40" />
    </section>
  )
}
