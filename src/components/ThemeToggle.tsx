import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="font-mono text-sm text-ink-subtle transition-colors hover:text-primary"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="text-prompt">[</span>
      {dark ? ' light ' : ' dark '}
      <span className="text-prompt">]</span>
    </button>
  )
}
