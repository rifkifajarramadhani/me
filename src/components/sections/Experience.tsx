import PAST_ROLES from '@/data/experience'
import Reveal from '@/components/Reveal'
import SectionHeading from '@/components/SectionHeading'

export default function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-4xl px-6 py-24">
      <Reveal>
        <SectionHeading command="git log --experience" kicker="experience" />
      </Reveal>

      <div className="relative pl-8 md:pl-10">
        <div className="flex flex-col gap-10">
          {PAST_ROLES.map((role, id) => {
            const isCurrent = role.endDate.toLowerCase() === 'present'
            return (
              <Reveal key={`${role.company}-${id}`} delay={0.05 * id}>
                <div className="relative panel p-5">
                  <span className="absolute -left-[2.05rem] top-6 font-mono text-xs text-primary md:-left-[2.55rem]">
                    {isCurrent ? '[ ]' : '[x]'}
                  </span>
                  <p className="mb-1 font-mono text-xs text-prompt">
                    {role.startDate} — {role.endDate}
                  </p>
                  <h3 className="text-lg font-semibold text-ink">
                    {role.role}{' '}
                    <span className="text-primary">@ {role.company}</span>
                  </h3>
                  <p className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-tertiary">
                    {role.country}
                  </p>
                  <p className="mt-3 leading-[1.7] text-ink-muted">{role.description}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
