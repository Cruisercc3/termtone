import assert from "node:assert/strict"
import { test } from "node:test"
import { brokenHooks, formatLike, installedHooks, isTermtoneHook, withTermtone, withoutTermtone } from "./claude.js"
import { diffLines } from "./diff.js"

const SCRIPT = "C:/Users/me/AppData/Roaming/npm/node_modules/termtone/dist/termtone.js"

const someoneElses = {
  permissions: { defaultMode: "auto" },
  hooks: {
    Stop: [{ hooks: [{ type: "command", command: "say done" }] }],
    PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "./check.sh" }] }],
  },
}

test("installs exec-form async hooks for four events, five with --working", () => {
  const settings = withTermtone({}, SCRIPT, false)
  assert.deepEqual(Object.keys(settings.hooks!), ["UserPromptSubmit", "Notification", "Stop", "StopFailure"])
  const stop = settings.hooks!.Stop[0].hooks![0]
  assert.equal(stop.command, process.execPath)
  assert.deepEqual(stop.args, [SCRIPT, "hook", "Stop"])
  assert.equal(stop.async, true)
  assert.ok(isTermtoneHook(stop))
  assert.ok(withTermtone({}, SCRIPT, true).hooks!.PreToolUse)
})

test("keeps every other hook and setting, in place, and appends after them", () => {
  const settings = withTermtone(someoneElses, SCRIPT, true)
  assert.deepEqual(settings.permissions, someoneElses.permissions)
  assert.deepEqual(settings.hooks!.Stop[0], someoneElses.hooks.Stop[0])
  assert.deepEqual(settings.hooks!.PreToolUse[0], someoneElses.hooks.PreToolUse[0])
  assert.equal(settings.hooks!.Stop.length, 2)
  assert.equal(settings.hooks!.PreToolUse.length, 2)
})

test("installing twice changes nothing the second time", () => {
  const once = withTermtone(someoneElses, SCRIPT, false)
  assert.deepEqual(withTermtone(once, SCRIPT, false), once)
})

test("uninstalling gives back exactly what was there", () => {
  for (const before of [{}, { theme: "dark" }, someoneElses]) {
    assert.deepEqual(withoutTermtone(withTermtone(before, SCRIPT, true)), before)
  }
})

test("uninstalling a group shared with another tool keeps the other tool's hook", () => {
  const shared = {
    hooks: {
      Stop: [{ hooks: [{ type: "command", command: "say done" }, { type: "command", command: "node", args: [SCRIPT, "hook", "Stop"] }] }],
    },
  }
  assert.deepEqual(installedHooks(shared), ["Stop"])
  assert.deepEqual(withoutTermtone(shared), { hooks: { Stop: [{ hooks: [{ type: "command", command: "say done" }] }] } })
})

test("a hook whose node or script has gone is reported", () => {
  const settings = withTermtone(someoneElses, SCRIPT, false)
  assert.deepEqual(brokenHooks(settings, () => true), [])
  assert.deepEqual(brokenHooks(settings, (p) => p !== SCRIPT).sort(), ["Notification", "Stop", "StopFailure", "UserPromptSubmit"])
})

test("the file is written back in its own format, so the diff shows only the hooks", () => {
  const original = '{\n  "permissions": {\n    "defaultMode": "auto"\n  },\n  "model": "x"\n}\n'
  assert.equal(formatLike(original, JSON.parse(original)), original)
  const crlf = original.replace(/\n/g, "\r\n")
  assert.equal(formatLike(crlf, JSON.parse(crlf)), crlf)
  const after = formatLike(original, withTermtone(JSON.parse(original), SCRIPT, false))
  const removed = diffLines(original, after).filter((l) => l.op === "-")
  assert.deepEqual(removed.map((l) => l.text), ['  "model": "x"'])
})
