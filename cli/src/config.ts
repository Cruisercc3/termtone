// ~/.termtone/config.json maps events to pads. TERMTONE_HOME moves the folder.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { PAD_TYPES, PadType } from "./recipes.js"

export const EVENTS = ["start", "working", "waiting", "done", "error"] as const
export type EventName = (typeof EVENTS)[number]

export const EVENT_HELP: Record<EventName, string> = {
  start: "you send Claude Code a prompt",
  working: "Claude Code is about to use a tool (only with install --working)",
  waiting: "Claude Code needs you: a permission prompt, or idle waiting for input",
  done: "Claude Code finishes its turn, or a command run through termtone exits 0",
  error: "Claude Code's turn ends on an API error, or a command exits non-zero",
}

export type Config = {
  volume: number
  events: Record<EventName, PadType | null>
}

export const DEFAULT_CONFIG: Config = {
  volume: 70,
  events: {
    start: "think",
    working: "click",
    waiting: "yes",
    done: "chime",
    error: "error",
  },
}

export function termtoneHome() {
  return process.env.TERMTONE_HOME || join(homedir(), ".termtone")
}

export function configPath() {
  return join(termtoneHome(), "config.json")
}

export function isPad(name: unknown): name is PadType {
  return typeof name === "string" && (PAD_TYPES as readonly string[]).includes(name)
}

export function isEvent(name: unknown): name is EventName {
  return typeof name === "string" && (EVENTS as readonly string[]).includes(name)
}

// Creates the file with the defaults on first use. A bad value falls back to its
// default and is reported, so one typo never silences every sound.
export function loadConfig(): { config: Config; problems: string[] } {
  const path = configPath()
  if (!existsSync(path)) {
    mkdirSync(termtoneHome(), { recursive: true })
    writeFileSync(path, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n")
    return { config: structuredClone(DEFAULT_CONFIG), problems: [] }
  }
  const problems: string[] = []
  let raw: any
  try {
    raw = JSON.parse(readFileSync(path, "utf8"))
  } catch (err) {
    problems.push(`${path} is not valid JSON (${(err as Error).message}), using the defaults`)
    return { config: structuredClone(DEFAULT_CONFIG), problems }
  }
  const config = structuredClone(DEFAULT_CONFIG)
  if (raw.volume !== undefined) {
    if (typeof raw.volume === "number" && raw.volume >= 0 && raw.volume <= 400) config.volume = Math.round(raw.volume)
    else problems.push(`volume should be a number from 0 to 400, got ${JSON.stringify(raw.volume)}`)
  }
  for (const event of EVENTS) {
    const value = raw.events?.[event]
    if (value === undefined) continue
    if (value === null || value === "off") config.events[event] = null
    else if (isPad(value)) config.events[event] = value
    else problems.push(`events.${event} should be a pad name or "off", got ${JSON.stringify(value)}`)
  }
  return { config, problems }
}
