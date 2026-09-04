import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Window } from 'happy-dom'
import { createServer } from 'vite'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { Resvg } from '@resvg/resvg-js'

const out = fileURLToPath(new URL('../.playwright-cli/', import.meta.url))
mkdirSync(out, { recursive: true })

const samples = [
  ['rest', [['idle', 3]]],
  ['invite', [['wide', 1.8], ['wink', 1.2], ['idle', 1.4]]],
  ['loading', [['thinking', 2.6], ['idle', 1.2]]],
  ['submitting', [['play', 2.1], ['idle', 1.4]]],
  ['correct', [['wink', 1.6], ['idle', 1.4]]],
  ['needs-review', [['wide', 1.2], ['thinking', 2.6], ['idle', 1.2]]],
  ['attention', [['alert', 2.4], ['idle', 1.4]]],
  ['empty', [['sleep', 2.4], ['idle', 1.4]]],
  ['offline', [['comet', 2.4], ['thinking', 2.6], ['idle', 1.4]]],
  ['notification', [['notify', 2.2], ['idle', 1.4]]],
  ['transition', [['comet', 2.4], ['idle', 1.4]]],
  ['daily-complete', [['play', 2], ['orbit', 3.4], ['burst', 2.4], ['idle', 1.6]]],
  ['milestone', [['orbit', 3.4], ['burst', 2.6], ['idle', 1.5]]],
  ['waiting-access', [['idle', 3.2]]]
]

const only = process.argv.find((arg) => arg.startsWith('--only='))
  ?.slice('--only='.length)
  .split(',')
  .filter(Boolean)

const emotions = [
  ['calm', 'neutre'], ['focus', 'attentif'], ['curious', 'curieux'],
  ['happy', 'heureux'], ['excited', 'excite'], ['laughing', 'hilare'],
  ['proud', 'fier'], ['confused', 'confus'], ['sad', 'triste'],
  ['sleepy', 'somnolent'], ['gentle-reminder', 'surpris']
]

const win = new Window({ url: 'http://localhost/' })
Object.defineProperty(globalThis, 'window', { value: win, configurable: true })
Object.defineProperty(globalThis, 'document', { value: win.document, configurable: true })
Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true })
Object.defineProperty(globalThis, 'localStorage', { value: win.localStorage, configurable: true })

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

const png = (svg, width) => new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng()

function standalone(html, size, background = false) {
  let svg = html
    .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
    .replace(' viewbox=', ' viewBox=')
  if (background) {
    svg = svg.replace(/(<svg[^>]+>)/, '$1<rect x="-158" y="-158" width="316" height="316" fill="#fff8ee"/>')
  }
  return svg.replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`)
}

function at(blocks, t) {
  let offset = 0
  for (const [state, duration] of blocks) {
    if (t < offset + duration) return { state, local: t - offset }
    offset += duration
  }
  const [state, duration] = blocks.at(-1)
  return { state, local: duration }
}

try {
  const { default: BloubBot } = await server.ssrLoadModule('/src/components/BloubBot.vue')
  const render = async (props, background = false) => standalone(
    await renderToString(createSSRApp({ render: () => h(BloubBot, props) })),
    props.size,
    background
  )

  for (const [id, expression] of emotions) {
    const base = { size: 1024, color: 'xingcheng', shape: 'cercle', expression, state: 'idle', frozenAt: 1, paper: '#fff8ee' }
    const svg = await render(base)
    const svgPath = join(out, `xingcheng-q-emotion-${id}.svg`)
    writeFileSync(svgPath, svg)
    writeFileSync(join(out, `xingcheng-q-emotion-${id}.png`), png(svg, 1024))
  }

  const smallSvg = await render({ size: 128, color: 'xingcheng', shape: 'cercle', expression: 'neutre', state: 'idle', frozenAt: 1, paper: '#fff8ee' })
  writeFileSync(join(out, 'xingcheng-q-avatar-small.svg'), smallSvg)
  writeFileSync(join(out, 'xingcheng-q-avatar-small.png'), png(smallSvg, 128))

  if (process.argv.includes('--small-only')) process.exitCode = 0

  const selectedSamples = only ? samples.filter(([id]) => only.includes(id)) : samples
  for (const [id, raw] of process.argv.includes('--small-only') ? [] : selectedSamples) {
    const blocks = raw.map(([state, duration]) => ({ state, duration }))
    const duration = raw.reduce((sum, item) => sum + item[1], 0)
    const dir = mkdtempSync(join(tmpdir(), `xingcheng-${id}-`))
    const frames = Math.ceil(duration * 30)
    for (let i = 0; i < frames; i++) {
      const t = Math.min(duration - 1 / 30, i / 30)
      const pos = at(raw, t)
      const svg = await render({
        size: 512,
        color: 'xingcheng',
        shape: 'cercle',
        expression: 'neutre',
        state: pos.state,
        cycle: blocks,
        cycleAt: t,
        frozenAt: pos.local,
        paper: '#fff8ee'
      }, true)
      writeFileSync(join(dir, `${String(i).padStart(5, '0')}.png`), png(svg, 512))
    }
    const mp4 = join(out, `xingcheng-q-${id}.mp4`)
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', '30', '-i', join(dir, '%05d.png'), '-vf', 'scale=512:512:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-movflags', '+faststart', mp4])
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp4, '-filter_complex', '[0:v]fps=20,scale=320:320:flags=lanczos,split[a][b];[a]palettegen=max_colors=255[p];[b][p]paletteuse=dither=sierra2_4a', '-loop', '0', join(out, `xingcheng-q-${id}.gif`)])
    rmSync(dir, { recursive: true, force: true })
    process.stdout.write(`${id}\n`)
  }
} finally {
  await server.close()
  await win.close()
}
