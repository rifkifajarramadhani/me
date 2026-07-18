import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { name, jobTitle, socialLinks } from '@/lib/site'

const taglines = ['build things for the web.', 'build digital experiences.']

const socials = [
  { href: socialLinks.github, label: 'github' },
  { href: socialLinks.email, label: 'email' },
  { href: socialLinks.linkedin, label: 'linkedin' },
]

function PromptLine({ command, children }: { command: string; children?: ReactNode }) {
  return (
    <p className="font-mono text-sm leading-relaxed sm:text-base">
      <span className="mr-[0.4ch] text-prompt">$</span>
      <span className="text-ink-subtle">{command}</span>
      {children && (
        <>
          {' '}
          <span className="text-ink">{children}</span>
        </>
      )}
    </p>
  )
}

export default function Hero() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % taglines.length), 3500)
    return () => clearInterval(id)
  }, [])

  return (
    <section
      id="hero"
      className="relative mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 pt-20"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="terminal-window"
      >
        <div className="terminal-titlebar">
          <div className="flex items-center gap-1.5">
            <span className="size-[0.62rem] rounded-full bg-danger" />
            <span className="size-[0.62rem] rounded-full bg-warning" />
            <span className="size-[0.62rem] rounded-full bg-success" />
          </div>
          <span className="font-mono text-xs text-ink-tertiary">~/portfolio</span>
        </div>

        <div className="space-y-3 p-6 sm:p-8">
          <div className="font-mono text-sm leading-relaxed sm:text-base">
            <span className="mr-[0.4ch] text-prompt">$</span>
            <span className="text-ink-subtle">whoami</span>{' '}
            <h1 className="inline font-mono text-xl font-semibold tracking-[-0.02em] text-ink sm:text-2xl">
              {name}
            </h1>
          </div>
          <PromptLine command="cat role.txt">{jobTitle}</PromptLine>

          <div className="flex flex-wrap items-baseline gap-x-2 font-mono text-sm sm:text-base">
            <span className="text-prompt">$</span>
            <span className="text-ink-subtle">echo</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={i}
                className="text-primary"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                &quot;{taglines[i]}&quot;
              </motion.span>
            </AnimatePresence>
            <span className="inline-block h-[1.05em] w-[0.55ch] translate-y-[0.12em] animate-command-caret bg-primary motion-reduce:animate-none" />
          </div>

          <p className="max-w-xl pt-2 font-mono text-sm leading-[1.7] text-ink-muted">
            Full-stack software engineer based in Indonesia, building web applications
            since 2018 with TypeScript, Golang, PHP, React, Vue, and Tailwind CSS.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <a
              href="#work"
              className="border border-hairline-strong px-4 py-2 font-mono text-sm text-ink-subtle transition-colors hover:border-primary hover:text-primary"
            >
              <span className="text-prompt">[</span> view work <span className="text-prompt">]</span>
            </a>
            <div className="flex flex-wrap items-center gap-3">
              {socials.map(({ href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="font-mono text-sm text-ink-subtle transition-colors hover:text-primary"
                >
                  <span className="text-prompt">[</span> {label} <span className="text-prompt">]</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <a
        href="#about"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-xs text-ink-tertiary transition-colors hover:text-primary"
        aria-label="Scroll to about"
      >
        <span className="text-prompt">[</span> scroll <span className="text-prompt">]</span>
      </a>
    </section>
  )
}
