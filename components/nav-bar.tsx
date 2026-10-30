"use client"

import { useState, useEffect } from "react"

export function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [time, setTime] = useState("")

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      {/* Multicolor top stripe */}
      <div className="h-px w-full" style={{
        background: "linear-gradient(90deg, oklch(0.78 0.22 145) 0%, oklch(0.76 0.20 55) 40%, oklch(0.75 0.18 195) 70%, oklch(0.65 0.22 320) 100%)",
        opacity: 0.7
      }} />
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 border border-phosphor flex items-center justify-center box-glow">
            <span className="text-phosphor text-xs font-mono">TT</span>
          </div>
          <span className="text-phosphor phosphor-glow-sm text-sm tracking-[0.2em] uppercase">
            Term<span className="text-amber amber-glow">Tone</span>
          </span>
          <span className="text-muted-foreground text-xs hidden sm:block">
            v1.0
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Features", id: "features" },
            { label: "Soundboard", id: "soundboard" },
            { label: "Setup", id: "setup" },
            { label: "FAQ", id: "faq" },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-muted-foreground hover:text-primary transition-colors duration-200 text-xs tracking-widest uppercase hover:phosphor-glow-sm"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <span className="text-amber text-xs font-mono hidden sm:block tabular-nums opacity-70">
            {time}
          </span>
          <a
            href="https://github.com/Cruisercc3/termtone#install"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 bg-phosphor text-primary-foreground text-xs tracking-widest uppercase font-mono hover:bg-accent transition-all duration-200 box-glow"
          >
            Install
          </a>
        </div>
      </div>
    </nav>
  )
}
