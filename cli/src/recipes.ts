// The twelve pad recipes from playSound() in components/soundboard-section.tsx,
// ported to the offline context in synth.ts. Each case keeps the site's
// notes, timings and gains, so a pad sounds the same here as in the browser.
// The only change is Math.random() becoming ctx.random(), which is seeded.

import { OfflineContext } from "./synth.js"

export const PAD_TYPES = [
  "click",
  "chime",
  "yes",
  "no",
  "bell",
  "error",
  "warn",
  "success",
  "deploy",
  "pass",
  "commit",
  "think",
] as const

export type PadType = (typeof PAD_TYPES)[number]

// Same as the site: 0.09 is about half of the original 0.18
export const BASE_VOL = 0.09

export function playSound(type: PadType, ctx: OfflineContext, volMult: number) {
  const now = ctx.currentTime
  const vol = BASE_VOL * volMult

  const masterGain = ctx.createGain()
  masterGain.gain.setValueAtTime(0, now)
  masterGain.gain.linearRampToValueAtTime(vol, now + 0.008)
  masterGain.connect(ctx.destination)

  switch (type) {
    case "click": {
      // Mechanical key click, a short burst of shaped noise
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.09, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (ctx.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.010))
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
      // Rich completion bell, sine plus overtones
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
      // Descending saw buzz, harsh and obvious
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
      // Ascending sweep, then a held final note
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
      // Double ping, light and satisfying
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
      // Camera-shutter-like snap and a low thud
      const noise = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate)
      const nd = noise.getChannelData(0)
      for (let i = 0; i < nd.length; i++) {
        nd[i] = (ctx.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.018))
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
      // Slowly pulsing drone, LFO modulated
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
  }
}

export function renderPad(type: PadType, volume: number): Float32Array {
  const ctx = new OfflineContext()
  playSound(type, ctx, volume / 100)
  const samples = ctx.render()
  // Like the site at 0%: the exponential tails would still end at 0.001, so stay silent
  if (volume <= 0) samples.fill(0)
  return samples
}
