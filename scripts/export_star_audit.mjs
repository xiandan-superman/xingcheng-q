import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Window } from 'happy-dom'
import { createServer } from 'vite'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { Resvg } from '@resvg/resvg-js'

const out = fileURLToPath(new URL('../.playwright-cli/star-audit/', import.meta.url))
mkdirSync(out, { recursive: true })

const states = [
  ['idle', 1], ['thinking', 1.1], ['wink', 0.8], ['wide', 0.8], ['alert', 0.75],
  ['notify', 0.9], ['exclaim', 0.8], ['sleep', 0.45], ['egg', 0.8], ['hexagon', 0.8],
  ['play', 0.9], ['orbit', 1.2], ['burst', 0.45], ['comet', 1.15], ['swirl', 0.5]
]

const win = new Window({ url: 'http://localhost/' })
Object.defineProperty(globalThis, 'window', { value: win, configurable: true })
Object.defineProperty(globalThis, 'document', { value: win.document, configurable: true })
Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true })
Object.defineProperty(globalThis, 'localStorage', { value: win.localStorage, configurable: true })

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { default: BloubBot } = await server.ssrLoadModule('/src/components/BloubBot.vue')
  for (const [state, frozenAt] of states) {
    let svg = await renderToString(createSSRApp({
      render: () => h(BloubBot, {
        size: 512,
        color: 'xingcheng',
        shape: 'cercle',
        expression: 'neutre',
        state,
        frozenAt,
        paper: '#fff8ee'
      })
    }))
    svg = svg
      .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
      .replace(' viewbox=', ' viewBox=')
      .replace(/(<svg[^>]+>)/, '$1<rect x="-158" y="-158" width="316" height="316" fill="#fff8ee"/>')
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: 512 } }).render().asPng()
    writeFileSync(`${out}/${state}.png`, png)
  }
} finally {
  await server.close()
  await win.close()
}
