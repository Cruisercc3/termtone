// ~/.termtone/termtone.log, one line per sound. Hooks print nothing, so this
// is the only way to see what they did.

import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { termtoneHome } from "./config.js"

const MAX_BYTES = 256 * 1024

export function logPath() {
  return join(termtoneHome(), "termtone.log")
}

export function log(line: string) {
  try {
    mkdirSync(termtoneHome(), { recursive: true })
    const path = logPath()
    if (existsSync(path) && statSync(path).size > MAX_BYTES) {
      // Keep the newer half
      const text = readFileSync(path, "utf8")
      writeFileSync(path, text.slice(text.indexOf("\n", text.length / 2) + 1))
    }
    appendFileSync(path, `${new Date().toISOString()} ${line}\n`)
  } catch {
    // A sound tool should never fail because its log couldn't be written
  }
}

export function tailLog(lines: number): string[] {
  if (!existsSync(logPath())) return []
  return readFileSync(logPath(), "utf8").trimEnd().split("\n").slice(-lines)
}
