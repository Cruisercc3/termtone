"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { FloatingSparks } from "@/components/floating-sparks"

// Pad color themes: each pad gets a unique color accent
const PAD_COLORS = [
  { border: "border-phosphor/60",    text: "text-phosphor",    bg: "bg-phosphor",    shadow: "0 0 0 1px oklch(0.78 0.22 145), 0 0 18px oklch(0.78 0.22 145 / 45%)" },
  { border: "border-amber/60",       text: "text-amber",       bg: "bg-amber",       shadow: "0 0 0 1px oklch(0.76 0.20 55), 0 0 18px oklch(0.76 0.20 55 / 45%)" },
  { border: "border-cyan/60",        text: "text-cyan",        bg: "bg-cyan",        shadow: "0 0 0 1px oklch(0.75 0.18 195), 0 0 18px oklch(0.75 0.18 195 / 45%)" },
  { border: "border-magenta/60",     text: "text-magenta",     bg: "bg-magenta",     shadow: "0 0 0 1px oklch(0.65 0.22 320), 0 0 18px oklch(0.65 0.22 320 / 45%)" },
  { border: "border-phosphor/60",    text: "text-phosphor",    bg: "bg-phosphor",    shadow: "0 0 0 1px oklch(0.78 0.22 145), 0 0 18px oklch(0.78 0.22 145 / 45%)" },
  { border: "border-destructive/60", text: "text-destructive", bg: "bg-destructive", shadow: "0 0 0 1px oklch(0.55 0.22 29), 0 0 18px oklch(0.55 0.22 29 / 45%)" },
  { border: "border-amber/60",       text: "text-amber",       bg: "bg-amber",       shadow: "0 0 0 1px oklch(0.76 0.20 55), 0 0 18px oklch(0.76 0.20 55 / 45%)" },
  { border: "border-cyan/60",        text: "text-cyan",        bg: "bg-cyan",        shadow: "0 0 0 1px oklch(0.75 0.18 195), 0 0 18px oklch(0.75 0.18 195 / 45%)" },
  { border: "border-magenta/60",     text: "text-magenta",     bg: "bg-magenta",     shadow: "0 0 0 1px oklch(0.65 0.22 320), 0 0 18px oklch(0.65 0.22 320 / 45%)" },
  { border: "border-phosphor/60",    text: "text-phosphor",    bg: "bg-phosphor",    shadow: "0 0 0 1px oklch(0.78 0.22 145), 0 0 18px oklch(0.78 0.22 145 / 45%)" },
  { border: "border-amber/60",       text: "text-amber",       bg: "bg-amber",       shadow: "0 0 0 1px oklch(0.76 0.20 55), 0 0 18px oklch(0.76 0.20 55 / 45%)" },
  { border: "border-cyan/60",        text: "text-cyan",        bg: "bg-cyan",        shadow: "0 0 0 1px oklch(0.75 0.18 195), 0 0 18px oklch(0.75 0.18 195 / 45%)" },
]

const PADS = [
  { id: 1,  label: "Keypress",   sublabel: "MECH CLICK",   key: "Q", type: "click"     },
  { id: 2,  label: "AI Phase",   sublabel: "PHASE DONE",   key: "W", type: "chime"     },
  { id: 3,  label: "YES Prompt", sublabel: "CONFIRM CUE",  key: "E", type: "yes"       },
  { id: 4,  label: "NO Prompt",  sublabel: "DENY CUE",     key: "R", type: "no"        },
  { id: 5,  label: "Output End", sublabel: "STREAM END",   key: "A", type: "bell"      },
  { id: 6,  label: "Error",      sublabel: "STDERR BUZZ",  key: "S", type: "error"     },
  { id: 7,  label: "Warning",    sublabel: "WARN BLIP",    key: "D", type: "warn"      },
  { id: 8,  label: "Build OK",   sublabel: "COMPILE WIN",  key: "F", type: "success"   },
  { id: 9,  label: "Deploy",     sublabel: "SHIP IT",      key: "Z", type: "deploy"    },
  { id: 10, label: "Test Pass",  sublabel: "SUITE GREEN",  key: "X", type: "pass"      },
  { id: 11, label: "Git Commit", sublabel: "SNAPSHOT",     key: "C", type: "commit"    },
  { id: 12, label: "AI Think",   sublabel: "REASONING",    key: "V", type: "think"     },
]

// Volume multiplier — 0.09 is ~50% of original 0.18
const BASE_VOL = 0.09

function playSound(type: string, ctx: AudioContext, volMult: number) {
  const now = ctx.currentTime
  const vol = BASE_VOL * volMult

  const masterGain = ctx.createGain()
  masterGain.gain.setValueAtTime(0, now)
  masterGain.gain.linearRampToValueAtTime(vol, now + 0.008)
  masterGain.connect(ctx.destination)

  switch (type) {
    case "click": {
      // Mechanical key click — short burst of shaped noise
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.09, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.010))
      }
      const src = ctx.createBufferSource()
      src.buffer = buf
      const hi = ctx.createBiquadFilter(); hi.type = "highpass"; hi.frequency.value = 1800
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 3200; bp.Q.value = 0.8
      src.connect(hi); hi.connect(bp); bp.connect(masterGain)
      src.start(now)
      masterGain.gain.linearRampToValueAtTime(0, now + 0.06)
      break
    }

    case "chime": {
      // Two-tone bell chime (pure sine harmonic)
      const freqs = [880, 1320]
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = f
        g.gain.setValueAtTime(0, now + idx * 0.04)
        g.gain.linearRampToValueAtTime(vol * 0.7, now + idx * 0.04 + 0.01)
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 1.1)
        osc.connect(g); g.connect(ctx.destination)
        osc.start(now + idx * 0.04)
        osc.stop(now + idx * 0.04 + 1.2)
      })
      masterGain.gain.setValueAtTime(0, now); masterGain.gain.linearRampToValueAtTime(0, now + 0.001)
      break
    }

    case "yes": {
      // Rising two-note happy ding
      const notes = [523, 784]
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = "triangle"
        osc.frequency.value = f
        g.gain.setValueAtTime(0, now + i * 0.1)
        g.gain.linearRampToValueAtTime(vol * 0.8, now + i * 0.1 + 0.015)
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6)
        osc.connect(g); g.connect(ctx.destination)
        osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.7)
      })
      masterGain.gain.setValueAtTime(0, now)
      break
    }

    case "no": {
      // Descending two-note rejection tone
      const notes = [440, 294]
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = "square"
        osc.frequency.value = f
        g.gain.setValueAtTime(0, now + i * 0.12)
        g.gain.linearRampToValueAtTime(vol * 0.55, now + i * 0.12 + 0.01)
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.28)
        osc.connect(g); g.connect(ctx.destination)
        osc.start(now + i * 0.12); osc.stop(now + i * 0.12 + 0.35)
      })
      masterGain.gain.setValueAtTime(0, now)
      break
    }

    case "bell": {
      // Rich completion bell — sine + overtone
      const partials = [784, 1568, 2352]
      partials.forEach((f, i) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = f
        const atVol = vol * (1 / (i + 1)) * 0.9
        g.gain.setValueAtTime(atVol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.6 - i * 0.2)
        osc.connect(g); g.connect(ctx.destination)
        osc.start(now); osc.stop(now + 1.7)
      })
      masterGain.gain.setValueAtTime(0, now)
      break
    }

    case "error": {
      // Descending saw buzz — harsh and obvious
      const osc = ctx.createOscillator()
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.linearRampToValueAtTime(110, now + 0.35)
      const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 900
      osc.connect(filt); filt.connect(masterGain)
      masterGain.gain.linearRampToValueAtTime(0, now + 0.38)
      osc.start(now); osc.stop(now + 0.42)
      break
    }

    case "warn": {
      // Staccato two-beep warning
      [0, 0.18].forEach((offset) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = "square"
        osc.frequency.value = 660
        g.gain.setValueAtTime(0, now + offset)
        g.gain.linearRampToValueAtTime(vol * 0.6, now + offset + 0.008)
        g.gain.linearRampToValueAtTime(0, now + offset + 0.12)
        osc.connect(g); g.connect(ctx.destination)
        osc.start(now + offset); osc.stop(now + offset + 0.14)
      })
      masterGain.gain.setValueAtTime(0, now)
      break
    }

    case "success": {
      // Cheerful 3-note ascending arpeggio
      const chord = [523, 659, 784]
      chord.forEach((f, i) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = "triangle"
        osc.frequency.value = f
        g.gain.setValueAtTime(0, now + i * 0.1)
        g.gain.linearRampToValueAtTime(vol * 0.75, now + i * 0.1 + 0.012)
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.65)
        osc.connect(g); g.connect(ctx.destination)
        osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.7)
      })
      masterGain.gain.setValueAtTime(0, now)
      break
    }

    case "deploy": {
      // Dramatic ascending sweep + final note hold
      const osc = ctx.createOscillator()
      osc.type = "triangle"
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.linearRampToValueAtTime(880, now + 0.25)
      osc.frequency.setValueAtTime(1047, now + 0.3)
      osc.connect(masterGain)
      masterGain.gain.linearRampToValueAtTime(vol * 0.9, now + 0.02)
      masterGain.gain.setValueAtTime(vol * 0.9, now + 0.28)
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75)
      osc.start(now); osc.stop(now + 0.8)
      break
    }

    case "pass": {
      // Double ping — light and satisfying
      [880, 1108].forEach((f, i) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = f
        g.gain.setValueAtTime(0, now + i * 0.08)
        g.gain.linearRampToValueAtTime(vol * 0.7, now + i * 0.08 + 0.01)
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.55)
        osc.connect(g); g.connect(ctx.destination)
        osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.6)
      })
      masterGain.gain.setValueAtTime(0, now)
      break
    }

    case "commit": {
      // Camera-shutter-like snap + low thud
      const noise = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate)
      const nd = noise.getChannelData(0)
      for (let i = 0; i < nd.length; i++) {
        nd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.018))
      }
      const nsrc = ctx.createBufferSource(); nsrc.buffer = noise
      const nf = ctx.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 800; nf.Q.value = 2
      nsrc.connect(nf); nf.connect(masterGain)
      nsrc.start(now)
      // Low thud
      const bass = ctx.createOscillator()
      const bg = ctx.createGain()
      bass.type = "sine"; bass.frequency.setValueAtTime(120, now + 0.02)
      bass.frequency.exponentialRampToValueAtTime(40, now + 0.15)
      bg.gain.setValueAtTime(vol, now + 0.02)
      bg.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
      bass.connect(bg); bg.connect(ctx.destination)
      bass.start(now + 0.02); bass.stop(now + 0.25)
      masterGain.gain.linearRampToValueAtTime(0, now + 0.08)
      break
    }

    case "think": {
      // Slowly pulsing ambient drone — LFO modulated
      const osc = ctx.createOscillator()
      osc.type = "sine"
      osc.frequency.value = 220
      const lfo = ctx.createOscillator()
      lfo.type = "sine"
      lfo.frequency.value = 3.5
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 18
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency)
      const tremolo = ctx.createOscillator()
      tremolo.type = "sine"; tremolo.frequency.value = 5
      const tremGain = ctx.createGain(); tremGain.gain.value = vol * 0.3
      tremolo.connect(tremGain); tremGain.connect(masterGain.gain)
      osc.connect(masterGain)
      masterGain.gain.linearRampToValueAtTime(vol * 0.55, now + 0.05)
      masterGain.gain.setValueAtTime(vol * 0.55, now + 0.7)
      masterGain.gain.linearRampToValueAtTime(0, now + 1.1)
      lfo.start(now); tremolo.start(now)
      osc.start(now); osc.stop(now + 1.15)
      lfo.stop(now + 1.15); tremolo.stop(now + 1.15)
      break
    }

    default: {
      const osc = ctx.createOscillator()
      osc.type = "triangle"; osc.frequency.value = 440
      osc.connect(masterGain)
      masterGain.gain.linearRampToValueAtTime(0, now + 0.3)
      osc.start(now); osc.stop(now + 0.35)
    }
  }
}

// Log colors per pad type
const LOG_COLORS: Record<string, string> = {
  click: "text-phosphor",
  chime: "text-cyan",
  yes: "text-phosphor",
  no: "text-amber",
  bell: "text-cyan",
  error: "text-destructive",
  warn: "text-amber",
  success: "text-phosphor",
  deploy: "text-magenta",
  pass: "text-cyan",
  commit: "text-amber",
  think: "text-magenta",
}

type PadState = { pressing: boolean }

// What the real AudioContext reports, shown in the stats panel
type EngineInfo = { state: string; sampleRate: number; latencyMs: number | null }

function readEngine(ctx: AudioContext): EngineInfo {
  const base = typeof ctx.baseLatency === "number" ? ctx.baseLatency : null
  const out = typeof ctx.outputLatency === "number" ? ctx.outputLatency : 0
  return {
    state: ctx.state,
    sampleRate: ctx.sampleRate,
    latencyMs: base === null ? null : (base + out) * 1000,
  }
}

// Keys typed into a text field shouldn't fire pads
function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  if (el.isContentEditable || el.tagName === "TEXTAREA" || el.tagName === "SELECT") return true
  return el.tagName === "INPUT" && (el as HTMLInputElement).type !== "range"
}

export function SoundboardSection() {
  const [padStates, setPadStates] = useState<Record<number, PadState>>({})
  const [volume, setVolume] = useState(70)
  const [log, setLog] = useState<{ text: string; color: string }[]>([])
  const [engine, setEngine] = useState<EngineInfo | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const ctx = new AudioContext()
      ctx.onstatechange = () => setEngine(readEngine(ctx))
      audioCtxRef.current = ctx
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  const triggerPad = useCallback(
    (pad: (typeof PADS)[0]) => {
      const ctx = getCtx()
      const volMult = volume / 100
      // At 0% the exponential tails would still sit at 0.001, so skip the graph and stay silent
      if (volMult > 0) playSound(pad.type, ctx, volMult)
      setEngine(readEngine(ctx))
      window.dispatchEvent(new CustomEvent("termtone:play", { detail: { type: pad.type } }))

      setPadStates((prev) => ({ ...prev, [pad.id]: { pressing: true } }))
      const color = LOG_COLORS[pad.type] || "text-phosphor"
      setLog((prev) => [
        {
          text: `[${new Date().toLocaleTimeString("en-US", { hour12: false })}] ${pad.sublabel} › ${pad.label}`,
          color,
        },
        ...prev.slice(0, 11),
      ])
      setTimeout(() => {
        setPadStates((prev) => ({ ...prev, [pad.id]: { pressing: false } }))
      }, 160)
    },
    [getCtx, volume]
  )

  // Keyboard shortcuts
  useEffect(() => {
    const map: Record<string, (typeof PADS)[0]> = {}
    PADS.forEach((p) => (map[p.key.toLowerCase()] = p))
    const handler = (e: KeyboardEvent) => {
      // Leave Ctrl+C, Cmd+R and friends to the browser
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      const pad = map[e.key.toLowerCase()]
      if (pad) triggerPad(pad)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [triggerPad])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0
  }, [log])

  return (
    <section id="soundboard" className="relative py-24 px-6 border-t border-border overflow-hidden">
      {/* Sparse sparks — fewer so they don't distract from the pads */}
      <FloatingSparks count={14} />
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px flex-1 bg-border max-w-12" />
          <span className="text-muted-foreground text-xs tracking-[0.3em] uppercase">
            Interactive Soundboard
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2
              className="leading-none chroma-hover"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
            >
              <span className="text-phosphor phosphor-glow">PRESS A PAD</span>
              <br />
              <span className="text-amber amber-glow">OR YOUR KEYS</span>
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground text-xs leading-relaxed">
              These are the 12 sounds the CLI plays. Here your browser builds each one live with Web
              Audio, no audio files. The CLI renders the same recipes to WAV files on your machine.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-xs tracking-widest">VOL</span>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-32 accent-primary h-1 bg-border rounded cursor-pointer"
              aria-label="Volume"
            />
            <span className="text-phosphor text-xs font-mono w-8">{volume}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Soundboard grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-4 gap-2">
              {PADS.map((pad, idx) => {
                const isActive = padStates[pad.id]?.pressing
                const theme = PAD_COLORS[idx % PAD_COLORS.length]
                return (
                  <button
                    key={pad.id}
                    type="button"
                    // One path for mouse, pen and touch. A tap used to fire touchstart and then
                    // the browser's follow-up mousedown, so every tap played twice.
                    onPointerDown={(e) => {
                      if (e.pointerType === "mouse" && e.button !== 0) return
                      triggerPad(pad)
                    }}
                    // Enter or Space on a focused pad. Pointer clicks have detail >= 1 and
                    // already played on pointerdown.
                    onClick={(e) => {
                      if (e.detail === 0) triggerPad(pad)
                    }}
                    aria-label={`${pad.label} sound pad`}
                    aria-keyshortcuts={pad.key}
                    className={`relative aspect-square border font-mono flex flex-col items-center justify-center gap-1 select-none touch-manipulation
                      transition-all duration-100 bg-card
                      ${theme.border}
                      ${isActive ? `${theme.text} scale-95` : `${theme.text} hover:bg-secondary opacity-75 hover:opacity-100`}
                    `}
                    style={
                      isActive
                        ? { boxShadow: theme.shadow, transform: "scale(0.95)" }
                        : undefined
                    }
                  >
                    {/* Icon letter */}
                    <span
                      className={`leading-none ${isActive ? "opacity-100" : "opacity-80"}`}
                      style={{ fontFamily: "var(--font-display)", fontSize: "1.9rem" }}
                    >
                      {pad.label.charAt(0)}
                    </span>
                    <span className="text-[9px] tracking-widest opacity-55 uppercase text-center px-1 leading-tight">
                      {pad.sublabel}
                    </span>
                    {/* Key hint */}
                    <span className="absolute top-1 right-1.5 text-[9px] opacity-30 font-mono">
                      {pad.key}
                    </span>
                    {/* Pad number */}
                    <span className="absolute bottom-1 left-1.5 text-[9px] opacity-20 font-mono">
                      {String(pad.id).padStart(2, "0")}
                    </span>
                    {/* Active flash overlay */}
                    {isActive && (
                      <div className="absolute inset-0 opacity-10 bg-current" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Keyboard hint row */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {["Q","W","E","R","A","S","D","F"].map((k) => (
                <span key={k} className="border border-border px-1.5 py-0.5 font-mono text-[10px]">{k}</span>
              ))}
              <span className="opacity-40">···</span>
              <span className="text-[10px] tracking-wide">Use keyboard keys to trigger pads</span>
            </div>

            {/* Sound legend */}
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1.5">
              {PADS.map((pad, idx) => {
                const theme = PAD_COLORS[idx % PAD_COLORS.length]
                return (
                  <div key={pad.id} className="flex items-center gap-2 text-[10px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.bg} opacity-80 shrink-0`} />
                    <span className={`${theme.text} opacity-70`}>{pad.key}</span>
                    <span className="text-muted-foreground">{pad.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live log panel */}
          <div className="border border-border bg-card flex flex-col">
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-phosphor pulse-glow" />
              <span className="text-xs text-muted-foreground tracking-widest uppercase">
                Audio Log
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground opacity-50">
                {log.length}/12
              </span>
            </div>
            <div
              ref={logRef}
              className="flex-1 p-3 overflow-y-auto font-mono text-[11px] min-h-48 max-h-64 space-y-1.5"
            >
              {log.length === 0 ? (
                <span className="text-muted-foreground opacity-40">
                  Waiting for trigger...
                  <span className="cursor-blink text-phosphor">▌</span>
                </span>
              ) : (
                log.map((entry, i) => (
                  <div
                    key={i}
                    className={`leading-relaxed transition-opacity duration-300 ${i === 0 ? `${entry.color} opacity-100` : "text-muted-foreground opacity-50"}`}
                  >
                    {i === 0 && <span className="opacity-60">›</span>} {entry.text}
                  </div>
                ))
              )}
            </div>

            {/* Audio engine stats, read from the live AudioContext once it exists */}
            <div className="border-t border-border p-3 space-y-2" data-testid="engine-stats">
              {[
                { label: "ACTIVE PADS", value: `${PADS.length} / ${PADS.length}`, color: "text-phosphor" },
                {
                  label: "AUDIO ENGINE",
                  value: engine ? `Web Audio · ${engine.state}` : "Web Audio · idle",
                  color: "text-cyan",
                },
                {
                  label: "SAMPLE RATE",
                  value: engine ? `${(engine.sampleRate / 1000).toFixed(1)} kHz` : "starts on first press",
                  color: "text-amber",
                },
                {
                  label: "OUTPUT LATENCY",
                  value: !engine
                    ? "starts on first press"
                    : engine.latencyMs === null
                      ? "not reported"
                      : `${engine.latencyMs.toFixed(1)} ms`,
                  color: "text-magenta",
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{label}</span>
                  <span className={color}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
