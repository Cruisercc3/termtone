// Adds and removes TermTone's hooks in a Claude Code settings file without
// touching anything else in it. Claude Code's hooks are the signal: it says
// when a turn ends or it needs you, so nothing has to guess from the output.

import { homedir } from "node:os"
import { join } from "node:path"
import { EventName } from "./config.js"

export type HookSpec = { hook: string; event: EventName; optional?: boolean }

export const CLAUDE_HOOKS: HookSpec[] = [
  { hook: "UserPromptSubmit", event: "start" },
  { hook: "PreToolUse", event: "working", optional: true },
  { hook: "Notification", event: "waiting" },
  { hook: "Stop", event: "done" },
  { hook: "StopFailure", event: "error" },
]

// Notification also fires for things like a finished login. Only these mean
// Claude Code is waiting on you.
export const WAITING_NOTIFICATIONS = [
  "permission_prompt",
  "idle_prompt",
  "elicitation_dialog",
  "elicitation_url_dialog",
  "agent_needs_input",
]

export function claudeSettingsPath() {
  return join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude"), "settings.json")
}

type HookCommand = { type: string; command?: string; args?: unknown[]; [key: string]: unknown }
type MatcherGroup = { matcher?: string; hooks?: HookCommand[]; [key: string]: unknown }
type Settings = { hooks?: Record<string, MatcherGroup[]>; [key: string]: unknown }

// Exec form: Claude Code runs node directly with these args and no shell, so a
// path like C:\Program Files\nodejs\node.exe needs no quoting on any OS.
// async means Claude Code never waits for a sound.
export function hookCommand(hook: string, script: string): HookCommand {
  return { type: "command", command: process.execPath, args: [script, "hook", hook], async: true }
}

export function isTermtoneHook(h: unknown): boolean {
  const cmd = h as HookCommand
  return (
    !!cmd &&
    Array.isArray(cmd.args) &&
    cmd.args.length >= 2 &&
    /termtone/i.test(String(cmd.args[0])) &&
    cmd.args[1] === "hook"
  )
}

// Every event that has a TermTone hook in it
export function installedHooks(settings: Settings): string[] {
  return Object.entries(settings.hooks ?? {})
    .filter(([, groups]) => Array.isArray(groups) && groups.some((g) => g?.hooks?.some(isTermtoneHook)))
    .map(([hook]) => hook)
}

// Hooks whose node or script is gone, say after an nvm switch or a move
export function brokenHooks(settings: Settings, exists: (path: string) => boolean): string[] {
  const broken: string[] = []
  for (const [hook, groups] of Object.entries(settings.hooks ?? {})) {
    if (!Array.isArray(groups)) continue
    for (const cmd of groups.flatMap((g) => g?.hooks ?? []).filter(isTermtoneHook)) {
      if (!exists(String(cmd.command)) || !exists(String(cmd.args![0]))) broken.push(hook)
    }
  }
  return broken
}

// Removes only TermTone's own entries, and only empties what that leaves empty
export function withoutTermtone(settings: Settings): Settings {
  const next: Settings = structuredClone(settings)
  if (!next.hooks || typeof next.hooks !== "object") return next
  for (const [hook, groups] of Object.entries(next.hooks)) {
    if (!Array.isArray(groups)) continue
    let changed = false
    const kept: MatcherGroup[] = []
    for (const group of groups) {
      if (!Array.isArray(group?.hooks) || !group.hooks.some(isTermtoneHook)) {
        kept.push(group)
        continue
      }
      changed = true
      const rest = group.hooks.filter((h) => !isTermtoneHook(h))
      if (rest.length > 0) kept.push({ ...group, hooks: rest })
    }
    if (!changed) continue
    if (kept.length > 0) next.hooks[hook] = kept
    else delete next.hooks[hook]
  }
  if (Object.keys(next.hooks).length === 0 && installedHooks(settings).length > 0) delete next.hooks
  return next
}

// Idempotent: old TermTone entries go first, then one fresh group per event is
// appended after whatever hooks are already there.
export function withTermtone(settings: Settings, script: string, working: boolean): Settings {
  const next = withoutTermtone(settings)
  next.hooks ??= {}
  for (const spec of CLAUDE_HOOKS) {
    if (spec.optional && !working) continue
    next.hooks[spec.hook] ??= []
    next.hooks[spec.hook].push({ hooks: [hookCommand(spec.hook, script)] })
  }
  return next
}

// Writes JSON back in the file's own indent and line endings, so the diff
// shows only what changed
export function formatLike(original: string, value: unknown): string {
  const indent = original.match(/\n([ \t]+)"/)?.[1] ?? "  "
  const eol = original.includes("\r\n") ? "\r\n" : "\n"
  const trailing = original === "" || /\r?\n$/.test(original) ? eol : ""
  return JSON.stringify(value, null, indent).replace(/\n/g, eol) + trailing
}
