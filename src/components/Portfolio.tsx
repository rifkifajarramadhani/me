import Nav from '@/components/Nav'
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Skills from '@/components/sections/Skills'
import Experience from '@/components/sections/Experience'
import Projects from '@/components/sections/Projects'
import Contact from '@/components/sections/Contact'
import { shortName } from '@/lib/site'

export default function Portfolio() {
  const year = new Date().getFullYear()

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <Contact />
      </main>
      <footer className="hidden h-9 items-stretch border-t border-hairline bg-surface-1 font-mono text-xs text-ink-tertiary md:flex">
        <span className="flex h-full items-center bg-primary px-3 font-bold text-primary-foreground">
          NORMAL
        </span>
        <div className="flex flex-1 items-center justify-between px-4">
          <span className="text-ink-subtle">
            ~/{shortName.toLowerCase()}
          </span>
          <span className="flex items-center gap-4">
            <span>© {year}</span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-success" />
              operational
            </span>
          </span>
        </div>
      </footer>
      <footer className="border-t border-hairline bg-surface-1 py-4 text-center font-mono text-xs text-ink-tertiary md:hidden">
        <span className="text-ink-subtle">~/{shortName.toLowerCase()}</span>
        <span className="mx-2 text-prompt">·</span>
        <span>© {year}</span>
      </footer>
    </>
  )
}
