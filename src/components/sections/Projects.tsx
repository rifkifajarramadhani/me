import PROJECTS from '@/data/projects'
import Reveal from '@/components/Reveal'
import SectionHeading from '@/components/SectionHeading'
import { withBase } from '@/lib/with-base'
import { cn } from '@/lib/utils'

function ProjectLinks({ repoUrl, liveLink }: { repoUrl: string; liveLink: string }) {
  return (
    <div className="flex items-center gap-3 font-mono text-xs">
      {repoUrl && repoUrl !== '#' && (
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Repository"
          className="text-ink-subtle transition-colors hover:text-primary"
        >
          <span className="text-prompt">[</span>repo<span className="text-prompt">]</span>
        </a>
      )}
      {liveLink && (
        <a
          href={liveLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Live site"
          className="text-ink-subtle transition-colors hover:text-primary"
        >
          <span className="text-prompt">[</span>live<span className="text-prompt">]</span>
        </a>
      )}
    </div>
  )
}

export default function Projects() {
  const featured = PROJECTS.filter((p) => p.featured)
  const others = PROJECTS.filter((p) => !p.featured)

  return (
    <section id="work" className="mx-auto max-w-4xl px-6 py-24">
      <Reveal>
        <SectionHeading command="ls projects/" kicker="work" />
      </Reveal>

      <div className="flex flex-col gap-16">
        {featured.map((project, id) => (
          <Reveal key={project.name}>
            <div className="grid items-start gap-6 md:grid-cols-12">
              <div className={cn('md:col-span-7', id % 2 === 1 && 'md:order-2')}>
                <a
                  href={project.liveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden border border-hairline-strong"
                >
                  <img
                    src={withBase(project.previewImage)}
                    alt={project.name}
                    loading="lazy"
                    className="aspect-video w-full object-cover object-top transition-opacity duration-300 group-hover:opacity-90"
                  />
                </a>
                {project.tags && (
                  <ul className="mt-4 flex flex-wrap gap-2 font-mono text-xs text-ink-subtle">
                    {project.tags.map((tag) => (
                      <li key={tag}>
                        <span className="text-prompt">[</span>
                        {tag}
                        <span className="text-prompt">]</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className={cn('md:col-span-5', id % 2 === 1 && 'md:order-1')}>
                <p className="mb-2 font-mono text-xs text-primary">
                  <span className="text-prompt">[</span>featured<span className="text-prompt">]</span>
                </p>
                <h3 className="mb-4 text-xl font-semibold text-ink">{project.name}</h3>
                <div className="panel p-5 text-sm leading-[1.7] text-ink-muted">
                  {project.description}
                </div>
                <div className="mt-4">
                  <ProjectLinks repoUrl={project.repoUrl} liveLink={project.liveLink} />
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {others.length > 0 && (
        <div className="mt-20 grid gap-4 sm:grid-cols-2">
          {others.map((project, id) => (
            <Reveal key={project.name} delay={0.05 * id}>
              <div className="group panel flex h-full flex-col p-5 transition-colors hover:border-primary">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-tertiary">
                    <span className="text-prompt">[+]</span> {project.name}
                  </span>
                  <ProjectLinks repoUrl={project.repoUrl} liveLink={project.liveLink} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-ink transition-colors group-hover:text-primary">
                  {project.name}
                </h3>
                <p className="line-clamp-4 text-sm leading-[1.7] text-ink-muted">
                  {project.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  )
}
