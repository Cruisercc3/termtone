// A small offline stand-in for the Web Audio nodes the soundboard uses.
// The recipes in recipes.ts are written against this API so they read almost
// line for line like playSound() in components/soundboard-section.tsx, and
// render to a plain sample array in Node with no audio device.

export const SAMPLE_RATE = 44100

type Automation = { time: number; value: number; kind: "set" | "linear" | "exp" }

// Anything that can be connected into a node or an AudioParam.
interface Sink {
  inputs: Source[]
}

// Every node caches its output per sample index, so a node pulled twice in the
// same sample returns the same value and its state advances once.
abstract class Source {
  private lastIndex = -1
  private lastValue = 0

  connect<T extends Sink>(dest: T): T {
    dest.inputs.push(this)
    return dest
  }

  pull(i: number): number {
    if (i !== this.lastIndex) {
      this.lastValue = this.process(i)
      this.lastIndex = i
    }
    return this.lastValue
  }

  protected abstract process(i: number): number
}

function sumInputs(inputs: Source[], i: number): number {
  let sum = 0
  for (const input of inputs) sum += input.pull(i)
  return sum
}

// AudioParam with the three automation calls the recipes use. Events at the
// same time keep the order they were scheduled in, as the Web Audio spec says.
export class Param implements Sink {
  readonly inputs: Source[] = []
  private events: Automation[] = []

  constructor(private intrinsic: number) {}

  get value() {
    return this.intrinsic
  }
  set value(v: number) {
    this.intrinsic = v
  }

  setValueAtTime(value: number, time: number) {
    this.insert({ time, value, kind: "set" })
  }
  linearRampToValueAtTime(value: number, time: number) {
    this.insert({ time, value, kind: "linear" })
  }
  exponentialRampToValueAtTime(value: number, time: number) {
    this.insert({ time, value, kind: "exp" })
  }

  private insert(event: Automation) {
    let at = this.events.length
    while (at > 0 && this.events[at - 1].time > event.time) at--
    this.events.splice(at, 0, event)
  }

  automationAt(t: number): number {
    const events = this.events
    let k = 0
    while (k < events.length && events[k].time <= t) k++
    // With nothing scheduled before t, a ramp starts from the intrinsic value at
    // the time it was scheduled, which is 0 for an offline render.
    const prev = k > 0 ? events[k - 1] : { time: 0, value: this.intrinsic }
    const next = events[k]
    if (!next || next.kind === "set") return prev.value
    const span = next.time - prev.time
    const f = span <= 0 ? 1 : (t - prev.time) / span
    if (next.kind === "linear") return prev.value + (next.value - prev.value) * f
    // The spec holds the old value when an exponential ramp starts at 0 or crosses zero
    if (prev.value * next.value <= 0) return prev.value
    return prev.value * Math.pow(next.value / prev.value, f)
  }

  valueAt(i: number): number {
    return this.automationAt(i / SAMPLE_RATE) + sumInputs(this.inputs, i)
  }
}

export class GainNode extends Source implements Sink {
  readonly inputs: Source[] = []
  readonly gain = new Param(1)

  protected process(i: number) {
    return sumInputs(this.inputs, i) * this.gain.valueAt(i)
  }
}

export type OscillatorType = "sine" | "square" | "sawtooth" | "triangle"

// Chrome scales its band-limited square and saw tables so the Gibbs overshoot
// peaks at 1, which leaves them at 0.845 of a plain wave's level (measured in
// Chrome 152 for both). Without this the no, warn and error pads are 38% louder.
const BAND_LIMIT_SCALE = 0.845

// PolyBLEP smooths the jump in a square or saw wave, standing in for the
// band-limited wavetables a browser uses so the high notes don't alias.
function polyBlep(t: number, dt: number): number {
  if (t < dt) {
    t /= dt
    return t + t - t * t - 1
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt
    return t * t + t + t + 1
  }
  return 0
}

export class OscillatorNode extends Source {
  type: OscillatorType = "sine"
  readonly frequency = new Param(440)
  private startAt = Infinity
  private stopAt = Infinity
  private phase = 0

  constructor(private onSchedule: (end: number) => void) {
    super()
  }

  start(time: number) {
    this.startAt = time
    this.phase = 0
  }
  stop(time: number) {
    this.stopAt = time
    this.onSchedule(time)
  }

  protected process(i: number) {
    const t = i / SAMPLE_RATE
    // Read the frequency every sample so anything modulating it keeps advancing
    const freq = this.frequency.valueAt(i)
    if (t < this.startAt || t >= this.stopAt) return 0
    const dt = Math.abs(freq) / SAMPLE_RATE
    const p = this.phase
    let out: number
    switch (this.type) {
      case "sine":
        out = Math.sin(2 * Math.PI * p)
        break
      case "square": {
        // Starts at 0 and goes positive, like the browser's square wave
        const half = (p + 0.5) % 1
        out = BAND_LIMIT_SCALE * ((p < 0.5 ? 1 : -1) + polyBlep(p, dt) - polyBlep(half, dt))
        break
      }
      case "sawtooth": {
        const shifted = (p + 0.5) % 1
        out = BAND_LIMIT_SCALE * (2 * shifted - 1 - polyBlep(shifted, dt))
        break
      }
      case "triangle":
        out = p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4
        break
    }
    this.phase = (p + freq / SAMPLE_RATE) % 1
    if (this.phase < 0) this.phase += 1
    return out
  }
}

export type BiquadType = "lowpass" | "highpass" | "bandpass"

// The Web Audio spec's biquad formulas. Lowpass and highpass read Q in dB,
// bandpass reads it as a plain ratio.
export class BiquadFilterNode extends Source implements Sink {
  readonly inputs: Source[] = []
  type: BiquadType = "lowpass"
  readonly frequency = new Param(350)
  readonly Q = new Param(1)
  private x1 = 0
  private x2 = 0
  private y1 = 0
  private y2 = 0

  protected process(i: number) {
    const x = sumInputs(this.inputs, i)
    const w0 = (2 * Math.PI * this.frequency.valueAt(i)) / SAMPLE_RATE
    const q = this.Q.valueAt(i)
    const cos = Math.cos(w0)
    const sin = Math.sin(w0)
    let b0: number, b1: number, b2: number, alpha: number
    if (this.type === "bandpass") {
      alpha = sin / (2 * q)
      b0 = alpha
      b1 = 0
      b2 = -alpha
    } else {
      alpha = sin / (2 * Math.pow(10, q / 20))
      const lp = this.type === "lowpass"
      b0 = lp ? (1 - cos) / 2 : (1 + cos) / 2
      b1 = lp ? 1 - cos : -(1 + cos)
      b2 = b0
    }
    const a0 = 1 + alpha
    const a1 = -2 * cos
    const a2 = 1 - alpha
    const y = (b0 * x + b1 * this.x1 + b2 * this.x2 - a1 * this.y1 - a2 * this.y2) / a0
    this.x2 = this.x1
    this.x1 = x
    this.y2 = this.y1
    this.y1 = y
    return y
  }
}

export class AudioBuffer {
  private readonly data: Float32Array
  constructor(readonly length: number) {
    this.data = new Float32Array(length)
  }
  getChannelData(_channel: number) {
    return this.data
  }
}

export class AudioBufferSourceNode extends Source {
  buffer: AudioBuffer | null = null
  private startSample = Infinity

  constructor(private onSchedule: (end: number) => void) {
    super()
  }

  start(time: number) {
    this.startSample = Math.round(time * SAMPLE_RATE)
    if (this.buffer) this.onSchedule(time + this.buffer.length / SAMPLE_RATE)
  }

  protected process(i: number) {
    if (!this.buffer) return 0
    const at = i - this.startSample
    return at >= 0 && at < this.buffer.length ? this.buffer.getChannelData(0)[at] : 0
  }
}

class Destination implements Sink {
  readonly inputs: Source[] = []
}

// mulberry32, so a noise burst renders the same way every time
function seededRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class OfflineContext {
  readonly sampleRate = SAMPLE_RATE
  readonly currentTime = 0
  readonly destination = new Destination()
  readonly random: () => number
  private end = 0

  constructor(seed = 1) {
    this.random = seededRandom(seed)
  }

  private schedule = (time: number) => {
    this.end = Math.max(this.end, time)
  }

  createGain() {
    return new GainNode()
  }
  createOscillator() {
    return new OscillatorNode(this.schedule)
  }
  createBiquadFilter() {
    return new BiquadFilterNode()
  }
  createBufferSource() {
    return new AudioBufferSourceNode(this.schedule)
  }
  createBuffer(_channels: number, length: number, _sampleRate: number) {
    return new AudioBuffer(Math.floor(length))
  }

  // Renders until the last source stops, plus a short tail for the filters to ring out
  render(tailSeconds = 0.02): Float32Array {
    const length = Math.ceil((this.end + tailSeconds) * SAMPLE_RATE)
    const out = new Float32Array(length)
    for (let i = 0; i < length; i++) out[i] = sumInputs(this.destination.inputs, i)
    return out
  }
}
