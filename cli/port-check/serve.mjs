// Serves a page that renders every pad twice, once with the site's own playSound()
// in the browser's OfflineAudioContext and once with the CLI's renderer, and
// compares them. Run `npm run port-check`, then open the address in Chrome.

import { readFileSync } from "node:fs"
import { createServer } from "node:http"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { PAD_TYPES, renderPad } from "../dist/recipes.js"

const here = dirname(fileURLToPath(import.meta.url))
const page = readFileSync(join(here, "page.html"), "utf8")

// playSound() and BASE_VOL straight out of the component, minus the type annotation
const component = readFileSync(join(here, "..", "..", "components", "soundboard-section.tsx"), "utf8")
const playSound = component
  .slice(component.indexOf("const BASE_VOL"), component.indexOf("// Log colors per pad type"))
  .replace("function playSound(type: string, ctx: AudioContext, volMult: number)", "function playSound(type, ctx, volMult)")

createServer((req, res) => {
  const path = new URL(req.url, "http://localhost").pathname
  if (path === "/") return res.writeHead(200, { "content-type": "text/html" }).end(page)
  if (path === "/playSound.js") return res.writeHead(200, { "content-type": "text/javascript" }).end(playSound)
  const pad = path.match(/^\/pads\/(\w+)\.f32$/)?.[1]
  if (PAD_TYPES.includes(pad)) {
    const samples = renderPad(pad, 100)
    return res.writeHead(200).end(Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength))
  }
  res.writeHead(404).end()
}).listen(4819, "127.0.0.1", () => console.log("Open http://127.0.0.1:4819 in Chrome"))
