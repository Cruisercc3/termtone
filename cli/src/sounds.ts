// Renders a pad to ~/.termtone/sounds/<version>-vol<volume>/<pad>.wav the first
// time it's needed, so later plays only start the OS player.

import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { termtoneHome } from "./config.js"
import { PadType, renderPad } from "./recipes.js"
import { SAMPLE_RATE } from "./synth.js"
import { encodeWav } from "./wav.js"

// Bump when a recipe or the renderer changes, so old files get rendered again
const RENDER_VERSION = "r1"

export const PADS: { id: number; type: PadType; label: string; key: string }[] = [
  { id: 1, type: "click", label: "Keypress", key: "Q" },
  { id: 2, type: "chime", label: "AI Phase", key: "W" },
  { id: 3, type: "yes", label: "YES Prompt", key: "E" },
  { id: 4, type: "no", label: "NO Prompt", key: "R" },
  { id: 5, type: "bell", label: "Output End", key: "A" },
  { id: 6, type: "error", label: "Error", key: "S" },
  { id: 7, type: "warn", label: "Warning", key: "D" },
  { id: 8, type: "success", label: "Build OK", key: "F" },
  { id: 9, type: "deploy", label: "Deploy", key: "Z" },
  { id: 10, type: "pass", label: "Test Pass", key: "X" },
  { id: 11, type: "commit", label: "Git Commit", key: "C" },
  { id: 12, type: "think", label: "AI Think", key: "V" },
]

export function soundsDir(volume: number) {
  return join(termtoneHome(), "sounds", `${RENDER_VERSION}-vol${volume}`)
}

export function soundFile(type: PadType, volume: number): string {
  const dir = soundsDir(volume)
  const file = join(dir, `${type}.wav`)
  if (existsSync(file)) return file
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
    pruneOtherRenders(dir)
  }
  // Write then rename, so two hooks firing at once never read half a file
  const tmp = `${file}.${process.pid}.tmp`
  writeFileSync(tmp, encodeWav(renderPad(type, volume), SAMPLE_RATE))
  renameSync(tmp, file)
  return file
}

function pruneOtherRenders(keep: string) {
  const root = join(termtoneHome(), "sounds")
  for (const name of readdirSync(root)) {
    const path = join(root, name)
    if (path !== keep) rmSync(path, { recursive: true, force: true })
  }
}
