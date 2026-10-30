#!/usr/bin/env node
// termtone: sound cues for Claude Code and for any command you run.

import { spawn } from "node:child_process"
import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname } from "node:path"
import { createInterface } from "node:readline"
import { fileURLToPath } from "node:url"
import {
  CLAUDE_HOOKS,
  WAITING_NOTIFICATIONS,
  brokenHooks,
  claudeSettingsPath,
  formatLike,
  installedHooks,
  withTermtone,
  withoutTermtone,
} from "./claude.js"
import { EVENTS, EVENT_HELP, EventName, configPath, isEvent, isPad, loadConfig } from "./config.js"
import { diffLines, formatDiff } from "./diff.js"
import { log, logPath, tailLog } from "./log.js"
import { findPlayer, playFile } from "./player.js"
import { PadType } from "./recipes.js"
import { runCommand } from "./run.js"
import { PADS, soundFile } from "./sounds.js"

const VERSION: string = createRequire(import.meta.url)("../package.json").version
const SCRIPT = realpathSync(fileURLToPath(import.meta.url))
const color = process.stdout.isTTY && !process.env.NO_COLOR
const dim = (s: string) => (color ? `\x1b[2m${s}\x1b[0m` : s)

const HELP = `termtone ${VERSION}: sound cues for Claude Code and any command

Usage
  termtone run -- <command> [args]   run a command, then play "done" or "error" from its exit code
  termtone play <sound>              play one sound: a pad name, 1 to 12, or an event name
  termtone test                      play all 12 pads in order
  termtone list                      show the pads and which event plays which
  termtone install --claude          add TermTone's hooks to Claude Code's settings
      --working                      also tick quietly before each tool Claude uses
      --yes                          write without asking (you still see the diff)
      --settings <file>              a settings file other than ~/.claude/settings.json
  termtone uninstall --claude        take TermTone's hooks out again
  termtone status                    config, audio player and installed hooks
  termtone log [lines]               what the hooks and runs played, newest last
  termtone config                    print the config file and where it lives
`

function fail(message: string): never {
  process.stderr.write(`termtone: ${message}\n`)
  process.exit(1)
}

// A pad name, its number, its key on the site, or an event name
function resolveSound(name: string): { pad: PadType | null; via?: EventName } {
  const lower = name.toLowerCase()
  if (isPad(lower)) return { pad: lower }
  const byNumber = PADS.find((p) => String(p.id) === lower || p.key.toLowerCase() === lower)
  if (byNumber) return { pad: byNumber.type }
  if (isEvent(lower)) return { pad: loadConfig().config.events[lower], via: lower }
  fail(`no sound called "${name}". Try termtone list.`)
}

function padLabel(type: PadType) {
  return PADS.find((p) => p.type === type)!.label
}

async function play(name: string | undefined) {
  if (!name) fail("which sound? Try termtone play chime, or termtone list.")
  const { pad, via } = resolveSound(name)
  if (!pad) {
    console.log(`The "${via}" event is set to off in ${configPath()}`)
    return
  }
  const { config } = loadConfig()
  const result = await playFile(soundFile(pad, config.volume))
  if (result.code !== 0) fail(`couldn't play ${pad} with ${result.player}: ${result.stderr || `exit ${result.code}`}`)
  console.log(`${pad} (${padLabel(pad)})${via ? ` for "${via}"` : ""} ${dim(`${(result.ms / 1000).toFixed(2)} s, ${result.player}`)}`)
}

async function test() {
  const { config, problems } = loadConfig()
  problems.forEach((p) => console.log(`warning: ${p}`))
  console.log(`Playing all 12 pads at volume ${config.volume}\n`)
  for (const pad of PADS) {
    process.stdout.write(`  ${String(pad.id).padStart(2, "0")}  ${pad.key}  ${pad.type.padEnd(8)} ${pad.label.padEnd(11)} `)
    const result = await playFile(soundFile(pad.type, config.volume))
    if (result.code !== 0) {
      console.log("")
      fail(`couldn't play with ${result.player}: ${result.stderr || `exit ${result.code}`}`)
    }
    console.log(dim(`${(result.ms / 1000).toFixed(2)} s`))
  }
}

function list() {
  const { config, problems } = loadConfig()
  problems.forEach((p) => console.log(`warning: ${p}`))
  console.log("Pads (the same 12 as the soundboard on the site)\n")
  for (const pad of PADS) {
    console.log(`  ${String(pad.id).padStart(2, "0")}  ${pad.key}  ${pad.type.padEnd(8)} ${pad.label}`)
  }
  console.log(`\nEvents (${configPath()})\n`)
  for (const event of EVENTS) {
    const pad = config.events[event]
    console.log(`  ${event.padEnd(8)} ${(pad ?? "off").padEnd(8)} ${dim(EVENT_HELP[event])}`)
  }
}

// Hands the sound to a detached copy of termtone, so the caller can exit at
// once and the sound still plays to the end. It has to be Node in the middle:
// a detached process gets no console, and powershell.exe without one exits
// straight away without playing. Node doesn't mind, and the player it starts
// gets a hidden console of its own.
function playInBackground(event: EventName, tag: string) {
  const { config, problems } = loadConfig()
  problems.forEach((p) => log(`config: ${p}`))
  const pad = config.events[event]
  if (!pad) return log(`${tag} -> ${event} (off)`)
  const file = soundFile(pad, config.volume)
  const label = `${tag} -> ${event} (${pad})`
  const host = spawn(process.execPath, [SCRIPT, "_play", file, label], { detached: true, stdio: "ignore", windowsHide: true })
  host.on("error", (err) => log(`${label}: couldn't start the player: ${err.message}`))
  host.unref()
}

// The detached side of playInBackground. Logs whether the sound really played.
async function playAndLog(file: string, label: string) {
  try {
    const result = await playFile(file)
    log(`${label}: ${result.code === 0 ? "played" : `failed: ${result.stderr || `exit ${result.code}`}`} with ${result.player} in ${(result.ms / 1000).toFixed(2)} s`)
  } catch (err) {
    log(`${label}: ${(err as Error).message}`)
  }
}

async function run(argv: string[]) {
  const command = argv[0] === "--" ? argv.slice(1) : argv
  if (command.length === 0) fail("nothing to run. Usage: termtone run -- <command> [args]")
  const result = await runCommand(command)
  const tag = `run \`${command.join(" ")}\` exit ${result.code} after ${(result.ms / 1000).toFixed(1)} s`
  // A Ctrl+C means you're right there, so no sound
  if (result.interrupted) log(`${tag}, interrupted, no sound`)
  else playInBackground(result.code === 0 ? "done" : "error", tag)
  process.exitCode = result.code
}

function readStdin(timeoutMs: number): Promise<string> {
  if (process.stdin.isTTY) return Promise.resolve("")
  return new Promise((resolve) => {
    let data = ""
    const finish = () => {
      clearTimeout(timer)
      // destroy, not pause, so an open pipe can't keep the hook alive
      process.stdin.destroy()
      resolve(data)
    }
    const timer = setTimeout(finish, timeoutMs)
    process.stdin.setEncoding("utf8")
    process.stdin.on("data", (chunk) => (data += chunk))
    process.stdin.on("end", finish)
    process.stdin.on("error", finish)
  })
}

// Called by Claude Code. Prints nothing and always exits 0: on UserPromptSubmit
// any stdout would reach Claude as context, and a non-zero exit is reported.
async function hook(name: string | undefined) {
  try {
    const spec = CLAUDE_HOOKS.find((h) => h.hook === name)
    if (!spec) return log(`hook ${name}: not one of TermTone's, ignored`)
    let payload: { notification_type?: string; error?: string } = {}
    try {
      payload = JSON.parse((await readStdin(1000)) || "{}")
    } catch {
      // Play anyway: the event name alone says what happened
    }
    const detail = payload.notification_type ?? payload.error
    const tag = `hook ${spec.hook}${detail ? `[${detail}]` : ""}`
    if (spec.hook === "Notification" && detail && !WAITING_NOTIFICATIONS.includes(detail)) {
      return log(`${tag}: not waiting on you, no sound`)
    }
    playInBackground(spec.event, tag)
  } catch (err) {
    log(`hook ${name}: ${(err as Error).message}`)
  }
}

function ask(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    let answered = false
    rl.question(question, (answer) => {
      answered = true
      rl.close()
      resolve(/^y(es)?$/i.test(answer.trim()))
    })
    rl.on("close", () => {
      if (!answered) {
        process.stdout.write("\n")
        resolve(false)
      }
    })
  })
}

function readSettings(path: string): { original: string; settings: Record<string, unknown> } {
  const original = existsSync(path) ? readFileSync(path, "utf8") : ""
  if (!original.trim()) return { original, settings: {} }
  let settings: unknown
  try {
    settings = JSON.parse(original)
  } catch (err) {
    fail(`${path} isn't valid JSON (${(err as Error).message}). Nothing was changed.`)
  }
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    fail(`${path} doesn't hold a JSON object. Nothing was changed.`)
  }
  return { original, settings: settings as Record<string, unknown> }
}

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15)
}

// Shows the diff, asks, backs the file up, then writes it in one rename
async function writeSettings(path: string, original: string, text: string, yes: boolean): Promise<boolean> {
  console.log(`\nChanges to ${path}:\n`)
  console.log(formatDiff(diffLines(original, text), !!color))
  console.log("")
  if (!yes && !(await ask("Write these changes? [y/N] "))) {
    console.log("Nothing was changed.")
    return false
  }
  if (original) {
    const backup = `${path}.termtone-backup-${stamp()}`
    copyFileSync(path, backup)
    console.log(`Backed up the old file to ${backup}`)
  }
  mkdirSync(dirname(path), { recursive: true })
  const tmp = `${path}.termtone-${process.pid}.tmp`
  writeFileSync(tmp, text)
  renameSync(tmp, path)
  return true
}

function option(argv: string[], name: string): string | undefined {
  const at = argv.indexOf(name)
  if (at === -1) return undefined
  const value = argv[at + 1]
  if (!value || value.startsWith("--")) fail(`${name} needs a value`)
  return value
}

async function install(argv: string[]) {
  if (!argv.includes("--claude")) fail("install what? Claude Code is the one supported so far: termtone install --claude")
  const path = option(argv, "--settings") ?? claudeSettingsPath()
  const working = argv.includes("--working")
  const { original, settings } = readSettings(path)
  const script = SCRIPT
  const text = formatLike(original, withTermtone(settings, script, working))
  if (text === original) {
    console.log(`TermTone's hooks are already in ${path}. Nothing to change.`)
    return
  }
  const { config } = loadConfig()
  console.log("TermTone will play these sounds in Claude Code:\n")
  for (const spec of CLAUDE_HOOKS) {
    if (spec.optional && !working) continue
    console.log(`  ${spec.hook.padEnd(17)} -> ${spec.event.padEnd(8)} ${(config.events[spec.event] ?? "off").padEnd(7)} ${dim(EVENT_HELP[spec.event])}`)
  }
  if (!(await writeSettings(path, original, text, argv.includes("--yes")))) return
  console.log(`Hooks written. Start a new Claude Code session to hear them.`)
  console.log(dim(`Each hook runs ${script}\nChange sounds in ${configPath()}, or undo with termtone uninstall --claude`))
}

async function uninstall(argv: string[]) {
  if (!argv.includes("--claude")) fail("uninstall what? termtone uninstall --claude")
  const path = option(argv, "--settings") ?? claudeSettingsPath()
  const { original, settings } = readSettings(path)
  if (installedHooks(settings).length === 0) {
    console.log(`No TermTone hooks in ${path}. Nothing to change.`)
    return
  }
  const text = formatLike(original, withoutTermtone(settings))
  if (await writeSettings(path, original, text, argv.includes("--yes"))) console.log("TermTone's hooks are out.")
}

function status() {
  const { config, problems } = loadConfig()
  const player = findPlayer("x.wav")
  const settingsFile = claudeSettingsPath()
  let hooks = "not installed"
  try {
    const settings = JSON.parse(readFileSync(settingsFile, "utf8"))
    const found = installedHooks(settings)
    if (found.length) hooks = `hooks on ${found.join(", ")}`
    const broken = brokenHooks(settings, existsSync)
    if (broken.length) {
      problems.push(`the ${broken.join(", ")} hooks point at a node or termtone that isn't there any more. Run termtone install --claude again.`)
    }
  } catch {
    hooks = existsSync(settingsFile) ? "settings file isn't valid JSON" : "no settings file"
  }
  const rows: [string, string][] = [
    ["Config", configPath()],
    ["Volume", String(config.volume)],
    ["Events", EVENTS.map((e) => `${e} ${config.events[e] ?? "off"}`).join(", ")],
    ["Player", player ? `${player.name} (${player.command})` : "none found"],
    ["Claude", `${settingsFile}: ${hooks}`],
    ["Log", logPath()],
  ]
  console.log(`termtone ${VERSION}\n`)
  rows.forEach(([k, v]) => console.log(`  ${k.padEnd(7)} ${v}`))
  problems.forEach((p) => console.log(`\nwarning: ${p}`))
}

async function main(argv: string[]) {
  const [command, ...rest] = argv
  switch (command) {
    case "run":
      return run(rest)
    case "play":
      return play(rest[0])
    case "test":
      return test()
    case "list":
      return list()
    case "install":
      return install(rest)
    case "uninstall":
      return uninstall(rest)
    case "status":
      return status()
    case "hook":
      return hook(rest[0])
    case "_play":
      return playAndLog(rest[0], rest[1] ?? "play")
    case "log": {
      const lines = tailLog(Number(rest[0]) || 20)
      console.log(lines.length ? lines.join("\n") : `Nothing logged yet (${logPath()})`)
      return
    }
    case "config": {
      loadConfig()
      console.log(`${configPath()}\n\n${readFileSync(configPath(), "utf8")}`)
      return
    }
    case "--version":
    case "-v":
      console.log(VERSION)
      return
    case undefined:
    case "help":
    case "--help":
    case "-h":
      process.stdout.write(HELP)
      return
    default:
      fail(`unknown command "${command}". Try termtone help.`)
  }
}

main(process.argv.slice(2)).catch((err: Error) => {
  // hook() catches its own errors. Anything else is reported.
  if (process.argv[2] !== "hook") fail(err.message)
})
