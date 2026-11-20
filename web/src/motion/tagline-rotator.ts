import { observePageMotion } from './page-motion'

export function mountTaglineRotator(rotator: HTMLElement) {
  const tagline = rotator.querySelector<HTMLElement>('[data-tagline]')
  const taglines: string[] = JSON.parse(rotator.dataset.taglines ?? '[]')
  if (!tagline || taglines.length < 2) return

  let index = 0
  let intervalId: number | undefined
  let transitionId: number | undefined
  let frameId: number | undefined

  const stop = () => {
    window.clearInterval(intervalId)
    window.clearTimeout(transitionId)
    if (frameId !== undefined) window.cancelAnimationFrame(frameId)
    intervalId = undefined
    transitionId = undefined
    frameId = undefined
    tagline.classList.remove('is-leaving', 'is-entering')
  }

  const rotate = () => {
    tagline.classList.add('is-leaving')
    transitionId = window.setTimeout(() => {
      index = (index + 1) % taglines.length
      tagline.textContent = `"${taglines[index]}"`
      tagline.classList.remove('is-leaving')
      tagline.classList.add('is-entering')
      frameId = window.requestAnimationFrame(() => {
        tagline.classList.remove('is-entering')
        frameId = undefined
      })
      transitionId = undefined
    }, 300)
  }

  observePageMotion(({ visible, reducedMotion }) => {
    if (visible && !reducedMotion) {
      intervalId ??= window.setInterval(rotate, 3500)
    } else {
      stop()
    }
  })
}
