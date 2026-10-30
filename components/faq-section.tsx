"use client"

import { useState } from "react"

const FAQS = [
  {
    q: "What actually runs today?",
    a: "The soundboard on this page. All 12 sounds are synthesised live with the Web Audio API from oscillators, noise and filters, with no audio files. The CLI, the daemon and the output detection described here are the plan. They aren't built yet.",
  },
  {
    q: "How would TermTone hook into my terminal?",
    a: "As a small daemon next to your shell. It would read terminal output through a PTY (pseudo-terminal) wrapper, the same mechanism tmux and iTerm2 use, so your terminal works exactly as before, just louder.",
  },
  {
    q: "Does it work with AI CLIs like Claude, GPT, Aider, or Cursor?",
    a: "That's the plan, and there's no model involved. 'AI phase detection' means spotting the phases of an AI CLI's output with regex patterns and output-stream heuristics: reasoning phases, YES/NO prompts and finished responses, whichever tool you run.",
  },
  {
    q: "Can I use my own sound files?",
    a: "That's planned. The idea is a TOML config where any .wav or .mp3 can go on any pad, each with its own volume, pitch and trigger pattern. The soundboard here builds its 12 sounds in code instead.",
  },
  {
    q: "What's the performance overhead?",
    a: "There are no numbers yet, because the daemon isn't built. The plan is to play cues through CoreAudio on macOS and ALSA or PulseAudio on Linux, and keep the daemon idle until it has something to play.",
  },
  {
    q: "Is this a subscription? What does lifetime mean?",
    a: "No subscription. Ever. One payment of $9 and TermTone is yours permanently. Lifetime means every version update, every new sound pack, every new AI trigger — included at no extra cost, forever.",
  },
  {
    q: "Does it support Windows or WSL?",
    a: "macOS and Linux come first. WSL2 is planned after that, then native Windows through PowerShell.",
  },
  {
    q: "What if I want a refund?",
    a: "No questions asked refund within 14 days of purchase. Just email the address in your receipt. We'd love to know what didn't work, but you don't have to tell us.",
  },
]

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="relative py-24 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px flex-1 bg-border max-w-12" />
          <span className="text-muted-foreground text-xs tracking-[0.3em] uppercase">
            FAQ
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <h2
          className="text-foreground leading-none mb-12"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
        >
          <span className="text-primary phosphor-glow">FREQUENTLY</span>
          <br />
          <span className="text-muted-foreground">ASKED</span>
        </h2>

        <div className="space-y-px bg-border">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-card">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 hover:bg-secondary transition-colors duration-200"
                aria-expanded={open === i}
              >
                <span className="flex items-start gap-4">
                  <span className="text-muted-foreground font-mono text-xs mt-0.5 shrink-0">
                    [{String(i + 1).padStart(2, "0")}]
                  </span>
                  <span
                    className={`text-sm leading-relaxed transition-colors duration-200 ${
                      open === i ? "text-primary phosphor-glow-sm" : "text-foreground"
                    }`}
                  >
                    {faq.q}
                  </span>
                </span>
                <span
                  className={`text-primary font-mono text-sm shrink-0 transition-transform duration-300 ${
                    open === i ? "rotate-45" : "rotate-0"
                  }`}
                  style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem" }}
                >
                  +
                </span>
              </button>

              <div
                className={`overflow-hidden transition-all duration-400 ease-in-out ${
                  open === i ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-6 pl-16">
                  <p className="text-muted-foreground text-sm leading-relaxed border-l border-border pl-4">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
