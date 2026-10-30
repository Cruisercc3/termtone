"use client"

import { useEffect, useRef, useState } from "react"

const INCLUDED = [
  "12 customizable sound pads",
  "Typewriter keystroke audio engine",
  "AI phase detection + audio cues",
  "YES / NO prompt alerts",
  "Output complete bell trigger",
  "Error / warning sound differentials",
  "Build, deploy & test event sounds",
  "Config file (TOML) — fully editable",
  "All future updates, forever",
  "macOS + Linux support",
  "CLI install in 30 seconds",
  "Lifetime license — no subscriptions",
]

export function PricingSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [typed, setTyped] = useState("")
  const [showCheckoutNote, setShowCheckoutNote] = useState(false)
  const target = "$ termtone install --license YOUR_KEY"

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    let i = 0
    const id = setInterval(() => {
      i++
      setTyped(target.slice(0, i))
      if (i >= target.length) clearInterval(id)
    }, 45)
    return () => clearInterval(id)
  }, [visible])

  return (
    <section id="pricing" className="relative py-24 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto" ref={ref}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px flex-1 bg-border max-w-12" />
          <span className="text-muted-foreground text-xs tracking-[0.3em] uppercase">
            Pricing
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <h2
          className="text-foreground leading-none mb-14"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
        >
          <span className="text-phosphor phosphor-glow">ONE PRICE.</span>
          <br />
          <span className="text-amber amber-glow">EVERYTHING.</span>
          <br />
          <span className="text-muted-foreground">FOREVER.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          {/* Price card */}
          <div
            className={`bg-card p-10 flex flex-col justify-between transition-all duration-700 box-glow-strong ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div>
              {/* Tag */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-1.5 bg-primary pulse-glow" />
                <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
                  Solo Developer License
                </span>
              </div>

              {/* Price display */}
              <div className="mb-2 flex items-end gap-3">
                <span
                  className="text-amber amber-glow leading-none"
                  style={{ fontFamily: "var(--font-display)", fontSize: "6rem", lineHeight: 1 }}
                >
                  $9
                </span>
                <div className="pb-3">
                  <div className="text-muted-foreground text-xs line-through">$49</div>
                  <div className="text-phosphor phosphor-glow-sm text-xs tracking-widest">LIFETIME</div>
                </div>
              </div>

              <p className="text-muted-foreground text-xs leading-relaxed mb-8">
                Pay once. Own it forever. Every future sound pack, AI trigger update, and platform release is included at no extra cost.
              </p>

              {/* Install command */}
              <div className="border border-border bg-crt-surface p-3 font-mono text-xs mb-8">
                <span className="text-muted-foreground text-[10px] block mb-1 tracking-widest">
                  AFTER PURCHASE:
                </span>
                <span className="text-primary">
                  {typed}
                  {typed.length < target.length && (
                    <span className="cursor-blink">▌</span>
                  )}
                </span>
              </div>

              {/* CTA. There's no checkout, so it says so instead of doing nothing. */}
              <button
                type="button"
                onClick={() => setShowCheckoutNote(true)}
                aria-controls="checkout-note"
                aria-expanded={showCheckoutNote}
                className="w-full py-4 bg-primary text-primary-foreground font-mono text-sm tracking-[0.25em] uppercase box-glow-strong pulse-glow hover:bg-accent transition-all duration-300 mb-3"
              >
                Get TermTone — $9
              </button>
              <div id="checkout-note" role="status" aria-live="polite">
                {showCheckoutNote && (
                  <div className="border border-amber/50 bg-crt-surface p-3 font-mono text-[11px] leading-relaxed mb-3">
                    <span className="text-amber">&gt; checkout isn&apos;t built yet.</span>{" "}
                    <span className="text-muted-foreground">
                      TermTone is a concept, and the soundboard is the part that runs.
                    </span>{" "}
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("soundboard")?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="text-phosphor underline underline-offset-2 hover:text-primary"
                    >
                      Try the soundboard
                    </button>
                  </div>
                )}
              </div>
              <p className="text-center text-muted-foreground text-[10px] tracking-widest">
                INSTANT DOWNLOAD · NO SUBSCRIPTION · 14-DAY REFUND
              </p>
            </div>
          </div>

          {/* Features list */}
          <div
            className={`bg-card p-10 transition-all duration-700 delay-150 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="text-muted-foreground text-[10px] tracking-[0.3em] uppercase mb-6">
              Everything Included
            </div>
            <ul className="space-y-3">
              {INCLUDED.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-xs text-foreground group">
                  <span className="text-primary mt-0.5 shrink-0 font-mono">›</span>
                  <span className="leading-relaxed group-hover:text-primary transition-colors duration-200">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            {/* Bonus badge */}
            <div className="mt-8 border border-border p-4 flex items-start gap-3">
              <span className="text-amber text-lg" style={{ fontFamily: "var(--font-display)" }}>★</span>
              <div>
                <div className="text-xs text-foreground mb-1">Early Adopter Bonus</div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  First 100 customers get exclusive vintage IBM Model F sound pack + direct access to the private Discord for feature requests.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust row */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 py-4 border-y border-border">
          {[
            "macOS 12+",
            "Ubuntu 20+",
            "Arch Linux",
            "zsh / bash / fish",
            "Works with any AI CLI",
          ].map((item) => (
            <span key={item} className="text-muted-foreground text-[10px] tracking-widest uppercase">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
