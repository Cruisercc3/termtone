"use client"

import { useState } from "react"

const FAQS = [
  {
    q: "What actually runs today?",
    a: "The soundboard on this page and a small command-line tool. The tool hooks into Claude Code, so a sound plays when Claude finishes, when it needs your answer and when you send a prompt. It also wraps any other command and plays done or error from its exit code. I've tested it on Windows 11.",
  },
  {
    q: "How does it know what Claude Code is doing?",
    a: "It doesn't read your terminal at all. Claude Code has hooks that run a command when a turn ends or when it's waiting on you, and TermTone adds one for each of those. So nothing is guessed from the output. For other commands, termtone run just waits for the exit code.",
  },
  {
    q: "Does it work with other AI CLIs?",
    a: "Only through termtone run for now. That tells you when the whole run ends, but not when the agent stops to ask you something. Claude Code is the only one I've hooked into properly.",
  },
  {
    q: "Can I change the sounds?",
    a: "You can choose which of the 12 pads plays for each event, or turn one off, in ~/.termtone/config.json. Your own sound files aren't supported yet. The CLI turns the same recipes this page plays into WAV files on your machine, and 11 of the 12 match the browser's output sample for sample.",
  },
  {
    q: "What's the performance overhead?",
    a: "Claude Code doesn't wait for the sound. Each hook runs in the background and exits in about a fifth of a second. On my Windows laptop the sound starts a little under a second after the event, and most of that is PowerShell starting up to play it.",
  },
  {
    q: "Do I have to pay?",
    a: "No. Nothing here is for sale. The CLI is free and the code is on GitHub.",
  },
  {
    q: "Does it work on macOS, Linux or WSL?",
    a: "It should, but I haven't tested it there yet. On macOS it plays through afplay, and on Linux through paplay or aplay. WSL needs one of those installed first. Windows 11 is the only place I've run it.",
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
