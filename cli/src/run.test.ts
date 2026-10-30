import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { escapeCmdArgument, launchFor, runCommand, whichWindows } from "./run.js"

const windows = process.platform === "win32"

test("arguments are quoted and caret-escaped for cmd.exe", () => {
  assert.equal(escapeCmdArgument("hello", false), '^"hello^"')
  assert.equal(escapeCmdArgument("a&b", false), '^"a^&b^"')
  assert.equal(escapeCmdArgument('say "hi"', false), '^"say^ \\^"hi\\^"^"')
  assert.equal(escapeCmdArgument("dir\\", false), '^"dir\\\\^"')
  assert.equal(escapeCmdArgument("a&b", true), '^^^"a^^^&b^^^"')
})

test("a .exe runs directly and a .cmd goes through cmd.exe", () => {
  const dir = mkdtempSync(join(tmpdir(), "termtone-which-"))
  writeFileSync(join(dir, "tool.exe"), "")
  writeFileSync(join(dir, "shim.cmd"), "")
  const env = { PATH: dir, PATHEXT: ".COM;.EXE;.BAT;.CMD", ComSpec: "C:\\Windows\\system32\\cmd.exe" }
  // PATHEXT is upper case and Windows file names aren't case-sensitive
  assert.equal(whichWindows("tool", env, dir)?.toLowerCase(), join(dir, "tool.exe").toLowerCase())
  const exe = launchFor(["tool", "a b"], "win32", env)
  assert.equal(exe.file.toLowerCase(), join(dir, "tool.exe").toLowerCase())
  assert.deepEqual(exe.args, ["a b"])
  const cmd = launchFor(["shim", "a b"], "win32", env)
  assert.equal(cmd.file, env.ComSpec)
  assert.deepEqual(cmd.args.slice(0, 3), ["/d", "/s", "/c"])
  assert.equal(cmd.options.windowsVerbatimArguments, true)
  assert.deepEqual(launchFor(["ls", "-l"], "linux", env).args, ["-l"])
})

test("the exit code comes back as it was", async () => {
  assert.equal((await runCommand([process.execPath, "-e", "process.exit(3)"])).code, 3)
  assert.equal((await runCommand([process.execPath, "-e", ""])).code, 0)
  const missing = await runCommand(["termtone-no-such-command-xyz"])
  assert.notEqual(missing.code, 0)
})

test("tricky arguments survive an npm-style .cmd shim", { skip: !windows }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "termtone-shim-"))
  const bin = join(dir, "node_modules", ".bin")
  mkdirSync(bin, { recursive: true })
  const out = join(dir, "args.json")
  writeFileSync(join(dir, "echo.js"), `require("fs").writeFileSync(${JSON.stringify(out)}, JSON.stringify(process.argv.slice(2)))`)
  writeFileSync(join(bin, "echoargs.cmd"), `@"${process.execPath}" "%~dp0\\..\\..\\echo.js" %*\r\n`)
  const args = ["a b", 'say "hi"', "x&y", "pipe|this", "50%", "caret^", "trailing\\", "(paren)", "<angle>", ""]
  const result = await runCommand([join(bin, "echoargs.cmd"), ...args])
  assert.equal(result.code, 0)
  assert.deepEqual(JSON.parse(readFileSync(out, "utf8")), args)
})

test("a failing .cmd file reports its exit code", { skip: !windows }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "termtone-exit-"))
  writeFileSync(join(dir, "fail.cmd"), "@exit /b 4\r\n")
  assert.equal((await runCommand([join(dir, "fail.cmd")])).code, 4)
})
