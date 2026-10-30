// 16-bit PCM mono WAV, the one format every OS player here reads.

export function encodeWav(samples: Float32Array, sampleRate: number): Buffer {
  const dataBytes = samples.length * 2
  const buf = Buffer.alloc(44 + dataBytes)
  buf.write("RIFF", 0, "ascii")
  buf.writeUInt32LE(36 + dataBytes, 4)
  buf.write("WAVE", 8, "ascii")
  buf.write("fmt ", 12, "ascii")
  buf.writeUInt32LE(16, 16) // fmt chunk size
  buf.writeUInt16LE(1, 20) // PCM
  buf.writeUInt16LE(1, 22) // mono
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(sampleRate * 2, 28) // byte rate
  buf.writeUInt16LE(2, 32) // block align
  buf.writeUInt16LE(16, 34) // bits per sample
  buf.write("data", 36, "ascii")
  buf.writeUInt32LE(dataBytes, 40)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2)
  }
  return buf
}
