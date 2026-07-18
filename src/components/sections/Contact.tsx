import Reveal from '@/components/Reveal'
import CommandHeading from '@/components/CommandHeading'
import { socialLinks } from '@/lib/site'

const socials = [
  { href: socialLinks.email, label: 'email' },
  { href: socialLinks.github, label: 'github' },
  { href: socialLinks.linkedin, label: 'linkedin' },
]

export default function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-2xl px-6 py-32 text-center">
      <Reveal>
        <p className="mb-2 font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink-subtle">
          <span className="text-prompt">[</span>
          contact
          <span className="text-prompt">]</span>
        </p>
        <CommandHeading command="./contact.sh" className="mb-6 text-left sm:text-center" />
        <p className="mx-auto max-w-lg text-left leading-[1.7] text-ink-muted sm:text-center">
          I'm currently open to new opportunities and collaborations. Whether
          you have a question, a project in mind, or just want to say hi, my
          inbox is always open — I'll do my best to get back to you!
        </p>
        <a
          href={socialLinks.email}
          className="mt-10 inline-block border border-hairline-strong px-6 py-3 font-mono text-sm text-ink-subtle transition-colors hover:border-primary hover:text-primary"
        >
          <span className="text-prompt">[</span> say hello <span className="text-prompt">]</span>
        </a>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
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
      </Reveal>
    </section>
  )
}
