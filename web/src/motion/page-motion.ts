interface PageMotion {
  readonly visible: boolean
  readonly reducedMotion: boolean
}

type MotionListener = (motion: PageMotion, previous?: PageMotion) => void

const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
const listeners = new Set<MotionListener>()
let pageShown = true

function readMotion(): PageMotion {
  return {
    visible: pageShown && document.visibilityState === 'visible',
    reducedMotion: preference.matches,
  }
}

let motion = readMotion()

function syncMotion() {
  const next = readMotion()
  if (
    next.visible === motion.visible &&
    next.reducedMotion === motion.reducedMotion
  ) {
    return
  }

  const previous = motion
  motion = next
  for (const listener of listeners) listener(motion, previous)
}

document.addEventListener('visibilitychange', syncMotion)
preference.addEventListener('change', syncMotion)
window.addEventListener('pagehide', () => {
  pageShown = false
  syncMotion()
})
window.addEventListener('pageshow', () => {
  pageShown = true
  syncMotion()
})

export function observePageMotion(listener: MotionListener) {
  listeners.add(listener)
  listener(motion)
}
