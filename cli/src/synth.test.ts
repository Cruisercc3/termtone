import assert from "node:assert/strict"
import { test } from "node:test"
import { PAD_TYPES, renderPad } from "./recipes.js"
import { Param, SAMPLE_RATE } from "./synth.js"
import { encodeWav } from "./wav.js"

test("a linear ramp runs from the previous event", () => {
  const p = new Param(1)
  p.setValueAtTime(0, 0)
  p.linearRampToValueAtTime(10, 1)
  assert.equal(p.automationAt(0.5), 5)
  assert.equal(p.automationAt(2), 10)
})

test("an exponential ramp is geometric, and holds when it starts from 0", () => {
  const p = new Param(1)
  p.setValueAtTime(1, 0)
  p.exponentialRampToValueAtTime(0.01, 1)
  assert.ok(Math.abs(p.automationAt(0.5) - 0.1) < 1e-12)
  const q = new Param(1)
  q.setValueAtTime(0, 0)
  q.exponentialRampToValueAtTime(0.001, 1)
  assert.equal(q.automationAt(0.5), 0)
  assert.equal(q.automationAt(1), 0.001)
})

test("before any event a param reads its intrinsic value", () => {
  const p = new Param(440)
  p.setValueAtTime(120, 0.5)
  assert.equal(p.automationAt(0.25), 440)
  assert.equal(p.automationAt(0.75), 120)
})

test("every pad renders a short, audible, unclipped sound", () => {
  for (const type of PAD_TYPES) {
    const samples = renderPad(type, 70)
    const seconds = samples.length / SAMPLE_RATE
    let peak = 0
    for (const s of samples) {
      assert.ok(Number.isFinite(s), `${type} has a non-finite sample`)
      peak = Math.max(peak, Math.abs(s))
    }
    assert.ok(seconds > 0.05 && seconds < 2, `${type} lasts ${seconds} s`)
    assert.ok(peak > 0.01 && peak < 0.2, `${type} peaks at ${peak}`)
  }
})

test("volume 0 is silent and noise renders the same every time", () => {
  assert.ok(renderPad("bell", 0).every((s) => s === 0))
  assert.deepEqual(renderPad("click", 70), renderPad("click", 70))
})

test("the WAV header describes 16-bit mono PCM", () => {
  const wav = encodeWav(new Float32Array([0, 1, -1]), SAMPLE_RATE)
  assert.equal(wav.toString("ascii", 0, 4), "RIFF")
  assert.equal(wav.readUInt32LE(4), wav.length - 8)
  assert.equal(wav.readUInt16LE(22), 1)
  assert.equal(wav.readUInt32LE(24), SAMPLE_RATE)
  assert.equal(wav.readUInt16LE(34), 16)
  assert.equal(wav.readUInt32LE(40), 6)
  assert.equal(wav.readInt16LE(46), 32767)
  assert.equal(wav.readInt16LE(48), -32767)
})
