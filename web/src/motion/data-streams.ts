import { observePageMotion } from './page-motion'

type Stream = {
  x: number
  y: number
  speed: number
  tail: number
  stopAt: number
  // Seconds left to fade once the head stops; null while still running.
  fade: number | null
}
type Scan = { x: number; y: number; length: number; age: number }

export function mountDataStreams(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const COLUMN = 56 // rem, matches the content column cap
  const FRAME_MS = 1000 / 30
  const FADE_S = 0.9
  const SCAN_DRAW = 0.45
  const SCAN_HOLD = 0.7
  const SCAN_FADE = 0.9

  const wide = window.matchMedia('(min-width: 80rem)')

  let motion = { visible: false, reducedMotion: false }
  let initialized = false
  let streams: Stream[] = []
  let scans: Scan[] = []
  let field: HTMLCanvasElement | null = null
  let color = '63, 185, 80'
  let alpha = { tick: 0.13, tail: 0.46, head: 0.7, scan: 0.36 }
  let dpr = 1
  let width = 0
  let height = 0
  let cell = 9.6
  let row = 24
  let marginLeft = 0
  let frame: number | undefined
  let last = 0
  let nextStream = 0
  let nextScan = 0

  const rand = (min: number, max: number) => min + Math.random() * (max - min)
  const maxStreams = () => Math.max(6, Math.min(28, Math.round(width / 52)))

  const readTheme = () => {
    const root = document.documentElement
    const hex = getComputedStyle(root).getPropertyValue('--primary').trim()
    const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex)
    if (match)
      color = match
        .slice(1)
        .map((part) => parseInt(part, 16))
        .join(', ')
    // Paper needs a touch more alpha for the same presence as Carbon.
    alpha = root.classList.contains('dark')
      ? { tick: 0.13, tail: 0.46, head: 0.7, scan: 0.36 }
      : { tick: 0.16, tail: 0.42, head: 0.68, scan: 0.34 }
  }

  // Measure the real monospace cell so strokes sit on the text grid.
  const measure = () => {
    const probe = document.createElement('span')
    probe.textContent = '0'.repeat(20)
    probe.style.cssText =
      'position:absolute;visibility:hidden;font:400 1rem/1.5 var(--font-mono);white-space:pre'
    document.body.append(probe)
    const box = probe.getBoundingClientRect()
    probe.remove()
    if (box.width > 0) cell = box.width / 20
    if (box.height > 0) row = box.height
  }

  const snapX = (x: number) => Math.round(x / cell) * cell + 0.5
  const snapY = (y: number) => Math.round(y / row) * row + 0.5

  // Pick a column, thinning out over the terminal session in the left
  // margin on wide screens and avoiding columns already streaming.
  const pickColumn = () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const x = snapX(rand(0, width))
      if (wide.matches && x < marginLeft && Math.random() < 0.75) continue
      if (streams.some((stream) => Math.abs(stream.x - x) < cell * 2)) continue
      return x
    }
    return null
  }

  const makeStream = (seeded: boolean): Stream | null => {
    const x = pickColumn()
    if (x === null) return null
    const tail = rand(120, 340)
    // Some streams stop mid-screen, like truncated output.
    const stopAt =
      Math.random() < 0.45 ? rand(height * 0.35, height * 0.9) : height + tail
    return {
      x,
      y: seeded ? rand(0, stopAt) : rand(-tail, height * 0.4),
      speed: rand(60, 160),
      tail,
      stopAt,
      fade: null,
    }
  }

  const paintField = () => {
    field = document.createElement('canvas')
    field.width = canvas.width
    field.height = canvas.height
    const f = field.getContext('2d')
    if (!f) return
    f.setTransform(dpr, 0, 0, dpr, 0, 0)
    f.fillStyle = `rgba(${color}, ${alpha.tick})`
    const stepX = cell * 4
    const stepY = row * 2
    for (let y = stepY; y < height; y += stepY)
      for (let x = stepX; x < width; x += stepX)
        f.fillRect(Math.round(x), Math.round(y), 1, 1)

    // Reduced motion: a few frozen, already-faded strokes for texture.
    if (motion.reducedMotion) {
      f.lineWidth = 1
      for (let i = 0; i < Math.round(maxStreams() / 2); i += 1) {
        const stream = makeStream(true)
        if (!stream) continue
        const head = Math.min(stream.y, stream.stopAt)
        const gradient = f.createLinearGradient(0, head - stream.tail, 0, head)
        gradient.addColorStop(0, `rgba(${color}, 0)`)
        gradient.addColorStop(1, `rgba(${color}, ${alpha.tail * 0.6})`)
        f.strokeStyle = gradient
        f.beginPath()
        f.moveTo(stream.x, head - stream.tail)
        f.lineTo(stream.x, head)
        f.stroke()
      }
    }
  }

  const draw = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (field) ctx.drawImage(field, 0, 0)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineWidth = 1

    for (const stream of streams) {
      const head = Math.min(stream.y, stream.stopAt)
      const fade = stream.fade === null ? 1 : stream.fade / FADE_S
      if (fade <= 0) continue
      const top = head - stream.tail
      const gradient = ctx.createLinearGradient(0, top, 0, head)
      gradient.addColorStop(0, `rgba(${color}, 0)`)
      gradient.addColorStop(1, `rgba(${color}, ${alpha.tail * fade})`)
      ctx.strokeStyle = gradient
      ctx.beginPath()
      ctx.moveTo(stream.x, Math.max(0, top))
      ctx.lineTo(stream.x, head)
      ctx.stroke()

      // The head steps a whole row at a time, like a caret on new lines.
      const caretY = Math.floor(head / row) * row
      ctx.fillStyle = `rgba(${color}, ${alpha.head * fade})`
      ctx.fillRect(Math.round(stream.x - 1), caretY + row - 6, 2, 6)
    }

    for (const scan of scans) {
      const drawn = Math.min(1, scan.age / SCAN_DRAW)
      const gone = scan.age - SCAN_DRAW - SCAN_HOLD
      const fade = gone > 0 ? Math.max(0, 1 - gone / SCAN_FADE) : 1
      ctx.strokeStyle = `rgba(${color}, ${alpha.scan * fade})`
      ctx.beginPath()
      ctx.moveTo(scan.x, scan.y)
      ctx.lineTo(scan.x + scan.length * (1 - (1 - drawn) ** 3), scan.y)
      ctx.stroke()
    }
  }

  const spawnScan = () => {
    const length = Math.round(rand(6, 22)) * cell
    let x = snapX(rand(0, Math.max(0, width - length)))
    if (wide.matches && x < marginLeft) x = snapX(rand(width - marginLeft, width - length))
    scans.push({ x, y: snapY(rand(row * 4, height - row * 2)), length, age: 0 })
  }

  const tick = (now: number) => {
    frame = window.requestAnimationFrame(tick)
    if (now - last < FRAME_MS) return
    const dt = last ? Math.min(100, now - last) / 1000 : 0
    last = now

    if (now >= nextStream && streams.length < maxStreams()) {
      const stream = makeStream(false)
      if (stream) streams.push(stream)
      nextStream = now + rand(120, 500)
    }
    if (now >= nextScan && scans.length < 4) {
      spawnScan()
      nextScan = now + rand(900, 2600)
    }

    for (const stream of streams) {
      if (stream.fade === null) {
        stream.y += stream.speed * dt
        if (stream.y >= stream.stopAt) stream.fade = FADE_S
      } else stream.fade -= dt
    }
    streams = streams.filter(
      (stream) =>
        (stream.fade === null || stream.fade > 0) &&
        stream.y - stream.tail < height,
    )
    for (const scan of scans) scan.age += dt
    scans = scans.filter((scan) => scan.age < SCAN_DRAW + SCAN_HOLD + SCAN_FADE)

    draw()
  }

  const stop = () => {
    if (frame) window.cancelAnimationFrame(frame)
    frame = undefined
    last = 0
  }

  const start = () => {
    if (frame) return
    nextScan = performance.now() + 1200
    frame = window.requestAnimationFrame(tick)
  }

  const sync = () => {
    if (motion.visible && !motion.reducedMotion) start()
    else stop()
    if (motion.reducedMotion) {
      streams = []
      scans = []
      paintField()
      draw()
    }
  }

  const layout = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = document.documentElement.clientWidth
    height = window.innerHeight
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    marginLeft = Math.max(0, (width - COLUMN * rem) / 2)
    measure()
    readTheme()
    // Start mid-flow so the field never opens empty.
    streams = []
    scans = []
    if (!motion.reducedMotion)
      for (let i = 0; i < Math.round(maxStreams() * 0.75); i += 1) {
        const stream = makeStream(true)
        if (stream) streams.push(stream)
      }
    paintField()
    draw()
    sync()
  }

  let resizeTimer: number | undefined
  let lastWidth = 0
  window.addEventListener('resize', () => {
    // Mobile URL bars change the height while scrolling; only re-route
    // when the width changes or the height grows past the canvas.
    if (document.documentElement.clientWidth === lastWidth && window.innerHeight <= height)
      return
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      lastWidth = document.documentElement.clientWidth
      layout()
    }, 150)
  })

  new MutationObserver(() => {
    readTheme()
    paintField()
    draw()
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  observePageMotion((next, previous) => {
    motion = next
    if (!initialized) return
    if (next.reducedMotion !== previous?.reducedMotion) layout()
    else sync()
  })

  Promise.resolve(document.fonts?.ready).then(() => {
    lastWidth = document.documentElement.clientWidth
    initialized = true
    layout()
    canvas.dataset.ready = ''
  })
}
