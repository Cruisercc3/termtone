"use client"

import { useEffect, useState } from "react"

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Soundboard", href: "#soundboard" },
  { label: "Setup", href: "#setup" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "GitHub", href: "https://github.com/Cruisercc3/termtone", external: true },
]

export function Footer() {
  const [year] = useState(new Date().getFullYear())
  // Counts real pad presses on this page, sent by the soundboard
  const [played, setPlayed] = useState(0)
  const [audioOk, setAudioOk] = useState<boolean | null>(null)

  useEffect(() => {
    const onPlay = () => setPlayed((n) => n + 1)
    window.addEventListener("termtone:play", onPlay)
    setAudioOk(typeof window.AudioContext === "function")
    return () => window.removeEventListener("termtone:play", onPlay)
  }, [])

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return
    e.preventDefault()
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <footer className="border-t border-border py-10 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border border-primary flex items-center justify-center box-glow">
              <span className="text-primary text-xs font-mono">TT</span>
            </div>
            <div>
              <span className="text-primary phosphor-glow-sm text-sm tracking-[0.2em] uppercase block">
                TermTone
              </span>
              <span className="text-muted-foreground text-[10px] tracking-widest">
                TERMINAL SOUNDBOARD
              </span>
            </div>
          </div>

          {/* Live count of sounds played on this page */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid="played-count">
            <span className="text-primary font-mono" style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem" }}>
              {played}
            </span>
            <span className="tracking-widest uppercase text-[10px]">
              Sounds played this visit
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => scrollTo(e, link.href)}
                {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="hover:text-primary transition-colors duration-200 tracking-widest uppercase text-[10px]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="h-px bg-border mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-muted-foreground tracking-widest">
          <span>© {year} TERMTONE. BUILT FOR SOLO DEVS WHO FEEL THE TERMINAL.</span>
          <span className="flex items-center gap-2" data-testid="audio-status">
            <span
              className={`w-1.5 h-1.5 rounded-full pulse-glow ${audioOk === false ? "bg-destructive" : "bg-primary"}`}
            />
            {audioOk === null ? "CHECKING WEB AUDIO" : audioOk ? "WEB AUDIO READY" : "WEB AUDIO NOT SUPPORTED HERE"}
          </span>
        </div>
      </div>
    </footer>
  )
}
