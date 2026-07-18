import { useEffect, useState } from 'react'
import { withBase } from '@/lib/with-base'
import { shortName } from '@/lib/site'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/ThemeToggle'

const links = [
  { href: '#about', label: 'about' },
  { href: '#skills', label: 'skills' },
  { href: '#experience', label: 'experience' },
  { href: '#work', label: 'work' },
  { href: '#contact', label: 'contact' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled || open
          ? 'border-b border-hairline bg-surface-1/20 shadow-lg shadow-black/5 backdrop-blur-lg'
          : 'border-b border-transparent bg-transparent backdrop-blur-none',
      )}
    >
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <a
          href="#hero"
          className="font-mono text-sm font-bold text-ink transition-colors hover:text-primary"
          aria-label="Home"
        >
          <span className="text-prompt">[</span>
          {shortName.toLowerCase()}
          <span className="text-prompt">]</span>
        </a>

        <ul className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-mono text-sm text-ink-subtle transition-colors hover:text-primary"
              >
                <span className="text-prompt">~/</span>
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={withBase('resume.pdf')}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-hairline-strong px-3 py-1.5 font-mono text-sm text-ink-subtle transition-colors hover:border-primary hover:text-primary"
            >
              <span className="text-prompt">~/</span>resume.pdf
            </a>
          </li>
          <li>
            <ThemeToggle />
          </li>
        </ul>

        <div className="flex items-center gap-4 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="text-ink-subtle hover:text-primary"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <span className="font-mono text-sm">
              <span className="text-prompt">[</span>
              {open ? ' x ' : ' menu '}
              <span className="text-prompt">]</span>
            </span>
          </button>
        </div>
      </nav>

      {open && (
        <ul className="flex flex-col gap-1 border-t border-hairline bg-surface-1/95 px-6 py-4 backdrop-blur-lg md:hidden">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block py-2 font-mono text-sm text-ink-subtle transition-colors hover:text-primary"
              >
                <span className="text-prompt">~/</span>
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={withBase('resume.pdf')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-2 inline-block border border-hairline-strong px-3 py-1.5 font-mono text-sm text-ink-subtle hover:border-primary hover:text-primary"
            >
              <span className="text-prompt">~/</span>resume.pdf
            </a>
          </li>
        </ul>
      )}
    </header>
  )
}
