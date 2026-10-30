"use client"

import { useEffect, useRef } from "react"

// Sparse multicolor floating sparks — drawn on canvas for performance
const SPARK_COLORS = [
  "oklch(0.78 0.22 145)",  // phosphor green
  "oklch(0.76 0.20 55)",   // amber orange
  "oklch(0.75 0.18 195)",  // cyan
  "oklch(0.65 0.22 320)",  // magenta
  "oklch(0.78 0.22 145)",  // phosphor green (weighted more)
  "oklch(0.78 0.22 145)",  // phosphor green (weighted more)
  "oklch(0.76 0.20 55)",   // amber (weighted more)
]

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  life: number
  maxLife: number
}

function randomSpark(w: number, h: number): Spark {
  const maxLife = 180 + Math.random() * 220
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -(0.12 + Math.random() * 0.28),
    size: 1 + Math.random() * 2,
    color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
    alpha: 0,
    life: 0,
    maxLife,
  }
}

export function FloatingSparks({ count = 28 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let w = canvas.offsetWidth
    let h = canvas.offsetHeight
    canvas.width = w
    canvas.height = h

    const sparks: Spark[] = Array.from({ length: count }, () => {
      const s = randomSpark(w, h)
      // stagger initial life so they don't all appear at once
      s.life = Math.random() * s.maxLife
      return s
    })

    let rafId: number

    function draw() {
      ctx!.clearRect(0, 0, w, h)

      for (const s of sparks) {
        s.life++
        if (s.life >= s.maxLife) {
          const ns = randomSpark(w, h)
          Object.assign(s, ns)
          continue
        }

        // Fade in, hold, fade out
        const progress = s.life / s.maxLife
        if (progress < 0.15) {
          s.alpha = progress / 0.15
        } else if (progress > 0.75) {
          s.alpha = 1 - (progress - 0.75) / 0.25
        } else {
          s.alpha = 1
        }

        s.x += s.vx
        s.y += s.vy

        // Draw glowing dot
        ctx!.save()
        ctx!.globalAlpha = s.alpha * 0.65
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx!.fillStyle = s.color
        ctx!.shadowColor = s.color
        ctx!.shadowBlur = s.size * 6
        ctx!.fill()
        ctx!.restore()
      }

      rafId = requestAnimationFrame(draw)
    }

    draw()

    const resize = () => {
      w = canvas.offsetWidth
      h = canvas.offsetHeight
      canvas.width = w
      canvas.height = h
    }
    window.addEventListener("resize", resize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", resize)
    }
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
}
