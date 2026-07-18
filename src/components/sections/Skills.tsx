import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SKILLS from '@/data/skills'
import Reveal from '@/components/Reveal'
import SectionHeading from '@/components/SectionHeading'
import { cn } from '@/lib/utils'

export default function Skills() {
  const [active, setActive] = useState(0)
  const current = SKILLS[active]

  return (
    <section id="skills" className="mx-auto max-w-4xl px-6 py-24">
      <Reveal>
        <SectionHeading command="ls skills/" kicker="skills" />
      </Reveal>

      <Reveal>
        <div className="mb-8 flex flex-wrap gap-2 font-mono text-sm">
          {SKILLS.map((group, id) => (
            <button
              key={group.field}
              type="button"
              onClick={() => setActive(id)}
              className={cn(
                'border-b-2 px-2 py-1 transition-colors',
                active === id
                  ? 'border-primary text-primary before:content-["[_"] after:content-["_]"]'
                  : 'border-transparent text-ink-subtle hover:text-ink',
              )}
            >
              {group.field}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.field}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
          >
            {current.skills.map(({ skill, icon: Icon }) => (
              <div
                key={skill}
                className="group flex flex-col items-center gap-3 border border-hairline bg-surface-1 p-5 transition-colors hover:border-primary"
              >
                <Icon
                  className="h-8 w-8 text-ink-subtle transition-colors group-hover:text-primary"
                  title=""
                />
                <span className="text-xs text-ink-subtle">{skill}</span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </Reveal>
    </section>
  )
}
