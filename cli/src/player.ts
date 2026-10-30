// Plays a WAV with whatever the OS already has: PowerShell's SoundPlayer on
// Windows, afplay on macOS, paplay or aplay on Linux. No native modules.

import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { delimiter, join } from "node:path"

export type Player = { name: string; command: string; args: string[] }

function onPath(name: string): string | null {
  for (const dir of (process.env.PATH ?? "").split(delimiter)) {
    if (!dir) continue
    const full = join(dir, name)
    if (existsSync(full)) return full
  }
  return null
}

export function findPlayer(file: string): Player | null {
  if (process.platform === "win32") {
    const builtIn = join(process.env.SystemRoot ?? "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
    const script = `(New-Object System.Media.SoundPlayer '${file.replace(/'/g, "''")}').PlaySync()`
    return {
      name: "PowerShell SoundPlayer",
      command: existsSync(builtIn) ? builtIn : "powershell.exe",
      // An encoded command sidesteps every quoting rule between Node, Windows and PowerShell
      args: ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")],
    }
  }
  if (process.platform === "darwin") {
    const afplay = existsSync("/usr/bin/afplay") ? "/usr/bin/afplay" : onPath("afplay")
    return afplay ? { name: "afplay", command: afplay, args: [file] } : null
  }
  const paplay = onPath("paplay")
  if (paplay) return { name: "paplay", command: paplay, args: [file] }
  const aplay = onPath("aplay")
  if (aplay) return { name: "aplay", command: aplay, args: ["-q", file] }
  return null
}

export type PlayResult = { player: string; code: number | null; ms: number; stderr: string }

// Waits until the sound has finished. Every player here blocks for the length
// of the sound, so the time taken is also a check that it really played.
export function playFile(file: string): Promise<PlayResult> {
  const player = findPlayer(file)
  if (!player) {
    return Promise.resolve({ player: "none", code: null, ms: 0, stderr: "no audio player found (looked for paplay and aplay)" })
  }
  const started = Date.now()
  const child = spawn(player.command, player.args, { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] })
  let stderr = ""
  child.stderr?.on("data", (chunk) => (stderr += chunk))
  return new Promise((resolve) => {
    child.on("error", (err) => resolve({ player: player.name, code: null, ms: Date.now() - started, stderr: err.message }))
    child.on("close", (code) => resolve({ player: player.name, code, ms: Date.now() - started, stderr: stderr.trim() }))
  })
}
