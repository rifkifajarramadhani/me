import PAST_ROLES from '@/data/experience'
import Reveal from '@/components/Reveal'
import SectionHeading from '@/components/SectionHeading'

export default function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-4xl px-6 py-24">
      <Reveal>
        <SectionHeading num="03" title="Where I've Worked" />
      </Reveal>

      <div className="relative pl-8 md:pl-10">
        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent-1 via-accent-2 to-transparent opacity-30" />

        <div className="flex flex-col gap-12">
          {PAST_ROLES.map((role, id) => (
            <Reveal key={`${role.company}-${id}`} delay={0.05 * id}>
              <div className="relative">
                <span className="absolute -left-[2.05rem] top-1.5 h-3 w-3 rounded-full border-2 border-accent-1 bg-bg md:-left-[2.55rem]" />
                <p className="mb-1 font-mono text-sm text-accent-1">
                  {role.startDate} — {role.endDate}
                </p>
                <h3 className="text-xl font-semibold text-text-primary">
                  {role.role}{' '}
                  <span className="text-accent-2">@ {role.company}</span>
                </h3>
                <p className="mt-1 font-mono text-xs uppercase tracking-wider text-text-secondary/70">
                  {role.country}
                </p>
                <p className="mt-2 leading-relaxed text-text-secondary">
                  {role.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
