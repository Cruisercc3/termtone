// Runs a command exactly as typed and reports how it ended. On Windows, npm,
// yarn and friends are .cmd files that can only start through cmd.exe, so
// those go through cmd with each argument escaped for it.

import { spawn, SpawnOptions } from "node:child_process"
import { existsSync, statSync } from "node:fs"
import { delimiter, extname, join, normalize } from "node:path"

export type Launch = { file: string; args: string[]; options: SpawnOptions }

function isFile(path: string) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

// Where Windows would find `name`, trying each PATHEXT extension
export function whichWindows(name: string, env = process.env, cwd = process.cwd()): string | null {
  const exts = (env.PATHEXT || ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean)
  const candidates = extname(name) ? [name, ...exts.map((e) => name + e)] : exts.map((e) => name + e)
  const hasDir = /[\\/]/.test(name)
  const dirs = hasDir ? [""] : [cwd, ...(env.PATH || env.Path || "").split(delimiter).filter(Boolean)]
  for (const dir of dirs) {
    for (const candidate of candidates) {
      const full = dir ? join(dir, candidate) : candidate
      if (existsSync(full) && isFile(full)) return full
    }
  }
  return null
}

// cmd.exe treats these as syntax, so each gets a caret in front of it
const CMD_META = /([()\][%!^"`<>&|;, *?])/g

export function escapeCmdArgument(arg: string, doubleEscape: boolean): string {
  // Backslashes before a quote are doubled and the quote escaped, then trailing
  // backslashes are doubled because a closing quote follows them
  let out = arg.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\*)$/, "$1$1")
  out = `"${out}"`.replace(CMD_META, "^$1")
  // npm's .cmd shims pass their arguments through cmd a second time
  return doubleEscape ? out.replace(CMD_META, "^$1") : out
}

export function launchFor(argv: string[], platform = process.platform, env = process.env): Launch {
  const [name, ...args] = argv
  const options: SpawnOptions = { stdio: "inherit" }
  if (platform !== "win32") return { file: name, args, options }
  const resolved = whichWindows(name, env)
  if (resolved && /\.(exe|com)$/i.test(resolved)) return { file: resolved, args, options }
  // A .cmd or .bat file, or a cmd builtin such as `dir` or `exit`
  const doubleEscape = !!resolved && /node_modules[\\/]\.bin[\\/][^\\/]+\.cmd$/i.test(resolved)
  const line = [normalize(name).replace(CMD_META, "^$1"), ...args.map((a) => escapeCmdArgument(a, doubleEscape))].join(" ")
  return {
    file: env.ComSpec || env.COMSPEC || "cmd.exe",
    args: ["/d", "/s", "/c", `"${line}"`],
    options: { ...options, windowsVerbatimArguments: true },
  }
}

export type RunResult = { code: number; interrupted: boolean; notFound: boolean; ms: number }

// STATUS_CONTROL_C_EXIT, which Windows reports for a Ctrl+C, unsigned and signed
const WINDOWS_INTERRUPTS = [0xc000013a, 0xc000013a - 0x100000000]

export function runCommand(argv: string[]): Promise<RunResult> {
  const started = Date.now()
  const launch = launchFor(argv)
  return new Promise((resolve) => {
    // Ctrl+C reaches the child too. Stay alive so its exit code is the one reported.
    const ignore = () => {}
    process.on("SIGINT", ignore)
    process.on("SIGTERM", ignore)
    const done = (result: Omit<RunResult, "ms">) => {
      process.off("SIGINT", ignore)
      process.off("SIGTERM", ignore)
      resolve({ ...result, ms: Date.now() - started })
    }
    const child = spawn(launch.file, launch.args, launch.options)
    child.on("error", (err: NodeJS.ErrnoException) => {
      process.stderr.write(`termtone: couldn't start ${argv[0]}: ${err.message}\n`)
      done({ code: err.code === "ENOENT" ? 127 : 126, interrupted: false, notFound: err.code === "ENOENT" })
    })
    child.on("exit", (code, signal) => {
      if (signal) {
        const signals: Record<string, number> = { SIGINT: 2, SIGTERM: 15, SIGKILL: 9, SIGHUP: 1 }
        done({ code: 128 + (signals[signal] ?? 1), interrupted: signal === "SIGINT", notFound: false })
        return
      }
      const exit = code ?? 1
      done({ code: exit, interrupted: exit === 130 || WINDOWS_INTERRUPTS.includes(exit), notFound: false })
    })
  })
}
