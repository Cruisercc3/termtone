"use client"

import { useEffect, useRef, useState } from "react"

const STEPS = [
  {
    step: "01",
    title: "Install in 30 Seconds",
    desc: "One command sets up the TermTone daemon and hooks it into your shell profile. Works with zsh, bash, and fish.",
    cmd: "$ termtone install",
    numColor: "text-phosphor phosphor-glow",
    cmdColor: "text-phosphor",
  },
  {
    step: "02",
    title: "Configure Your Pads",
    desc: "Edit the generated TOML config. Assign sounds to triggers, set volume per-pad, and map custom regex patterns to any audio event.",
    cmd: "$ termtone config --edit",
    numColor: "text-amber amber-glow",
    cmdColor: "text-amber",
  },
  {
    step: "03",
    title: "Launch & Listen",
    desc: "Start your terminal session as normal. TermTone runs silently in the background and fires audio on every configured event.",
    cmd: "$ termtone start",
    numColor: "text-cyan cyan-glow",
    cmdColor: "text-cyan",
  },
]

export function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
      },
      { threshold: 0.15 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="setup" className="relative py-24 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto" ref={ref}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px flex-1 bg-border max-w-12" />
          <span className="text-muted-foreground text-xs tracking-[0.3em] uppercase">
            Setup · planned
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <h2
          className="text-foreground leading-none mb-14"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
        >
          <span className="text-phosphor phosphor-glow">THREE COMMANDS.</span>
          <br />
          <span className="text-amber amber-glow">THAT&apos;S IT.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {STEPS.map((step, i) => (
            <div
              key={step.step}
              className={`bg-card p-8 flex flex-col gap-5 transition-all duration-600 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              {/* Step number */}
              <div
                className={`${step.numColor} leading-none`}
                style={{ fontFamily: "var(--font-display)", fontSize: "4rem" }}
              >
                {step.step}
              </div>

              {/* Title */}
              <h3 className="text-foreground text-sm tracking-wide">
                {step.title}
              </h3>

              {/* Desc */}
              <p className="text-muted-foreground text-xs leading-relaxed flex-1">
                {step.desc}
              </p>

              {/* Command */}
              <div className={`border border-border bg-crt-surface px-3 py-2 font-mono text-[11px] ${step.cmdColor}`}>
                {step.cmd}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA strip */}
        <div className="mt-8 p-6 border border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-foreground text-sm mb-1">Ready to make your terminal come alive?</div>
            <div className="text-muted-foreground text-xs">
              Join devs who ship code that sounds as good as it looks.
            </div>
          </div>
          <button
            onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-3 bg-primary text-primary-foreground text-xs tracking-widest uppercase font-mono box-glow hover:bg-accent transition-all duration-300 shrink-0"
          >
            Get TermTone — $9
          </button>
        </div>
      </div>
    </section>
  )
}
