import Reveal from '@/components/Reveal'
import SectionHeading from '@/components/SectionHeading'

const techList = [
  'TypeScript',
  'Golang',
  'PHP',
  'React',
  'Vue',
  'Node.js',
  'NestJS',
  'PostgreSQL',
]

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-4xl px-6 py-24">
      <Reveal>
        <SectionHeading command="cat about.md" kicker="about" />
      </Reveal>

      <div className="grid gap-10 md:grid-cols-3">
        <Reveal className="panel space-y-4 p-6 text-ink-muted md:col-span-2">
          <p className="leading-[1.7]">
            Hello! I'm Rifki, a passionate full-stack web developer based in
            Indonesia with 6 years of experience crafting innovative and
            efficient web applications. I enjoy building products end-to-end —
            from designing clean, scalable back-end architectures to shipping
            polished, responsive front-ends.
          </p>
          <p className="leading-[1.7]">
            My work spans e-commerce platforms, POS systems, fintech, and
            content-heavy sites, where I focus on performance, maintainability,
            and a seamless user experience. I care about clean code, thoughtful
            APIs, and collaborating closely with cross-functional teams.
          </p>
          <p>Here are a few technologies I've been working with recently:</p>
          <ul className="grid max-w-md grid-cols-2 gap-2 font-mono text-sm">
            {techList.map((tech) => (
              <li key={tech} className="flex items-center gap-2">
                <span className="text-prompt">[+]</span>
                {tech}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.15} className="flex justify-center md:justify-end">
          <div className="panel flex h-56 w-56 items-center justify-center">
            <span className="font-mono text-5xl text-ink-tertiary">
              <span className="text-prompt">{'{'}</span>
              <span className="text-primary"> </span>
              <span className="text-prompt">{'}'}</span>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
