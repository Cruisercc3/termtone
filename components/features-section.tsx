"use client"

import { useEffect, useRef, useState } from "react"

// 80% green, 20% orange accent distribution
const CARD_ACCENTS = [
  { text: "text-phosphor", border: "hover:border-phosphor", tag: "group-hover:border-phosphor group-hover:text-phosphor", title: "group-hover:text-phosphor group-hover:phosphor-glow-sm", bar: "group-hover:bg-phosphor" },
  { text: "text-amber",    border: "hover:border-amber",    tag: "group-hover:border-amber group-hover:text-amber",       title: "group-hover:text-amber group-hover:amber-glow",       bar: "group-hover:bg-amber" },
  { text: "text-phosphor", border: "hover:border-phosphor", tag: "group-hover:border-phosphor group-hover:text-phosphor", title: "group-hover:text-phosphor group-hover:phosphor-glow-sm", bar: "group-hover:bg-phosphor" },
  { text: "text-cyan",     border: "hover:border-cyan",     tag: "group-hover:border-cyan group-hover:text-cyan",         title: "group-hover:text-cyan group-hover:cyan-glow",         bar: "group-hover:bg-cyan" },
  { text: "text-phosphor", border: "hover:border-phosphor", tag: "group-hover:border-phosphor group-hover:text-phosphor", title: "group-hover:text-phosphor group-hover:phosphor-glow-sm", bar: "group-hover:bg-phosphor" },
  { text: "text-amber",    border: "hover:border-amber",    tag: "group-hover:border-amber group-hover:text-amber",       title: "group-hover:text-amber group-hover:amber-glow",       bar: "group-hover:bg-amber" },
]

const FEATURES = [
  {
    code: "01",
    title: "Typewriter Keystrokes",
    desc: "Every character you type fires a satisfying mechanical click — IBM Model M, Cherry MX Blue, or a vintage Underwood. Configure velocity sensitivity for realism.",
    tag: "AUDIO ENGINE",
    icon: "K",
  },
  {
    code: "02",
    title: "AI Phase Detection",
    desc: "TermTone listens to your AI agent's output stream. When a reasoning phase completes, a distinct chime fires — so you know without looking at the screen.",
    tag: "AI LAYER",
    icon: "A",
  },
  {
    code: "03",
    title: "YES / NO Prompt Alerts",
    desc: "When your AI or script pauses for a Y/N confirmation, a unique alert tone plays. Never miss a blocking prompt buried in a long output again.",
    tag: "SMART CUE",
    icon: "?",
  },
  {
    code: "04",
    title: "Output Complete Bell",
    desc: "A configurable completion sound fires when a full AI response or command output finishes streaming. Old-school terminal bell — reimagined and beautiful.",
    tag: "TRIGGER",
    icon: "O",
  },
  {
    code: "05",
    title: "Error & Warning Sounds",
    desc: "Distinct audio for stderr, warnings, and exit codes. A short buzz for non-zero exits, a low thud for fatal errors. Know immediately when something breaks.",
    tag: "WATCHDOG",
    icon: "!",
  },
  {
    code: "06",
    title: "12-Pad Custom Soundboard",
    desc: "Assign any sound to any event. 12 programmable pads, each with its own trigger, volume, and pitch. Map to keystrokes, regex patterns, or terminal states.",
    tag: "CUSTOMIZER",
    icon: "S",
  },
]

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[0]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length]

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), index * 80)
          obs.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [index])

  return (
    <div
      ref={ref}
      className={`group border border-border bg-card p-6 transition-all duration-500 ${accent.border} cursor-default ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-xs font-mono">
            [{feature.code}]
          </span>
          <span className={`px-2 py-0.5 text-[10px] tracking-widest uppercase border border-border text-muted-foreground ${accent.tag} transition-colors duration-300`}>
            {feature.tag}
          </span>
        </div>
        <span
          className={`${accent.text} transition-all duration-300`}
          style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem" }}
        >
          {feature.icon}
        </span>
      </div>

      {/* Title */}
      <h3 className={`text-foreground text-base tracking-wide mb-3 ${accent.title} transition-all duration-300`}>
        {feature.title}
      </h3>

      {/* Desc */}
      <p className="text-muted-foreground text-xs leading-relaxed">
        {feature.desc}
      </p>

      {/* Bottom accent bar */}
      <div className={`mt-5 h-px bg-border ${accent.bar} transition-colors duration-500`} />
    </div>
  )
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 px-6 border-t border-border">
      {/* Section label */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px flex-1 bg-border max-w-12" />
          <span className="text-muted-foreground text-xs tracking-[0.3em] uppercase">
            Features
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <h2
            className="text-foreground leading-none"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
          >
            <span className="text-phosphor phosphor-glow">BUILT FOR</span>
            <br />
            <span className="text-amber amber-glow">DEVS WHO FEEL</span>
            <br />
            <span className="text-muted-foreground">THE TERMINAL.</span>
          </h2>
          <p className="text-muted-foreground text-xs max-w-xs leading-relaxed md:text-right">
            Six ideas from the first concept. The Claude Code hooks and termtone run cover the AI phase, prompt, done and error cues today. Keystroke sounds and matching patterns in output are still ideas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.code} feature={feature} index={i} />
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="w-2 h-2 border border-primary block" />
          <span className="tracking-widest">THE CLI IS FREE AND THE CODE IS ON GITHUB</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>
    </section>
  )
}
