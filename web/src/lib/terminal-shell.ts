/**
 * The portfolio's tiny shell: parses one input line and answers from
 * repository-backed data only. Pure, so the DOM layer stays thin.
 */

export interface ShellProject {
  slug: string
  name: string
  description: string
  tags: string[]
  liveLink?: string
  repoUrl?: string
}

export interface ShellRole {
  company: string
  country: string
  role: string
  startDate: string
  endDate: string
}

export interface ShellData {
  name: string
  jobTitle: string
  resumeUrl: string
  links: { github: string; linkedin: string; email: string }
  projects: ShellProject[]
  experience: ShellRole[]
  skills: { field: string; skills: string[] }[]
}

export type ShellTheme = 'light' | 'dark'

export interface ShellLine {
  kind: 'out' | 'muted' | 'accent' | 'err' | 'link'
  text: string
  href?: string
}

export type ShellEffect =
  | { type: 'clear' }
  | { type: 'exit' }
  | { type: 'theme'; theme: ShellTheme }
  | { type: 'open'; href: string }

export interface ShellResult {
  lines: ShellLine[]
  effect?: ShellEffect
}

export interface ShellContext {
  data: ShellData
  history: readonly string[]
  theme: ShellTheme
}

const out = (text: string): ShellLine => ({ kind: 'out', text })
const muted = (text: string): ShellLine => ({ kind: 'muted', text })
const accent = (text: string): ShellLine => ({ kind: 'accent', text })
const err = (text: string): ShellLine => ({ kind: 'err', text })
const link = (text: string, href: string): ShellLine => ({ kind: 'link', text, href })

const COMMANDS: Record<string, string> = {
  help: 'list commands',
  whoami: 'who runs this machine',
  ls: 'list projects, skills, or experience',
  cat: 'print experience, a project, or contact.txt',
  open: 'open resume, github, linkedin, email, or a project',
  contact: 'ways to reach me',
  theme: 'switch theme: theme [light|dark]',
  history: 'commands you have run',
  clear: 'clear the screen',
  exit: 'leave the shell (Esc works too)',
}

/** Hidden from `help`, but Tab completes it for people who go looking. */
const DISCOVERABLE_COMMANDS = ['sudo']

const LS_TARGETS = ['projects', 'skills', 'experience']

export function projectSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function findProject(data: ShellData, target: string) {
  const slug = projectSlug(target)
  return data.projects.find((project) => project.slug === slug)
}

function openTargets(data: ShellData): Record<string, string> {
  return {
    resume: data.resumeUrl,
    github: data.links.github,
    linkedin: data.links.linkedin,
    email: data.links.email,
  }
}

function argumentCandidates(command: string, data: ShellData): string[] {
  const slugs = data.projects.map((project) => project.slug)
  switch (command) {
    case 'ls':
      return LS_TARGETS
    case 'cat':
      return ['experience', 'contact.txt', 'resume.pdf', ...slugs]
    case 'open':
      return [...Object.keys(openTargets(data)), ...slugs]
    case 'theme':
      return ['light', 'dark']
    case 'sudo':
      return ['hire-me']
    default:
      return []
  }
}

function help(): ShellResult {
  const width = Math.max(...Object.keys(COMMANDS).map((name) => name.length))
  return {
    lines: [
      ...Object.entries(COMMANDS).map(([name, about]) =>
        out(`  ${name.padEnd(width)}  ${about}`),
      ),
      muted('Tab completes · ↑/↓ recalls history · Esc exits'),
    ],
  }
}

function contact(data: ShellData): ShellLine[] {
  return [
    link(`email     ${data.links.email.replace(/^mailto:/, '')}`, data.links.email),
    link(`github    ${data.links.github.replace(/^https:\/\//, '')}`, data.links.github),
    link(
      `linkedin  ${data.links.linkedin.replace(/^https:\/\/(www\.)?/, '')}`,
      data.links.linkedin,
    ),
  ]
}

function ls(data: ShellData, target?: string): ShellResult {
  if (!target) {
    return { lines: [out('projects/  skills/  experience/  contact.txt  resume.pdf')] }
  }
  switch (target.replace(/\/$/, '')) {
    case 'projects':
      return {
        lines: data.projects.map((project) =>
          out(`${project.slug.padEnd(24)} ${project.tags.join(', ')}`),
        ),
      }
    case 'skills':
      return {
        lines: data.skills.flatMap(({ field, skills }) => [
          accent(`${field.toLowerCase()}/`),
          out(`  ${skills.join('  ')}`),
        ]),
      }
    case 'experience':
      return {
        lines: data.experience.map((role) => out(`${projectSlug(role.company)}/`)),
      }
    default:
      return { lines: [err(`ls: cannot access '${target}': No such file or directory`)] }
  }
}

function catProject(project: ShellProject): ShellLine[] {
  const lines = [accent(project.name), out(project.description)]
  if (project.tags.length) lines.push(muted(`stack: ${project.tags.join(', ')}`))
  if (project.liveLink) lines.push(link(`live: ${project.liveLink}`, project.liveLink))
  if (project.repoUrl) lines.push(link(`repo: ${project.repoUrl}`, project.repoUrl))
  return lines
}

function cat(data: ShellData, target?: string): ShellResult {
  if (!target) return { lines: [err('cat: missing operand — try `ls`')] }
  if (target === 'experience' || target === 'experience/') {
    return {
      lines: data.experience.flatMap((role) => [
        accent(`${role.role} · ${role.company}`),
        muted(`  ${role.startDate} – ${role.endDate} · ${role.country}`),
      ]),
    }
  }
  if (target === 'contact.txt') return { lines: contact(data) }
  if (target === 'resume.pdf') {
    return { lines: [err('cat: resume.pdf: binary file — try `open resume`')] }
  }
  const project = findProject(data, target)
  if (project) return { lines: catProject(project) }
  return { lines: [err(`cat: ${target}: No such file or directory`)] }
}

function open(data: ShellData, target?: string): ShellResult {
  if (!target) return { lines: [err('open: missing target — try `open resume`')] }
  const known = openTargets(data)[target]
  const project = findProject(data, target)
  const href = known ?? project?.liveLink ?? project?.repoUrl
  if (!href) return { lines: [err(`open: ${target}: nothing to open`)] }
  return { lines: [link(`opening ${href}`, href)], effect: { type: 'open', href } }
}

const isTheme = (value: string): value is ShellTheme =>
  value === 'light' || value === 'dark'

function theme(current: ShellTheme, target?: string): ShellResult {
  if (target === undefined) return setTheme(current === 'dark' ? 'light' : 'dark')
  if (isTheme(target)) return setTheme(target)
  return { lines: [err(`theme: unknown theme '${target}' — use light or dark`)] }
}


function setTheme(next: ShellTheme): ShellResult {
  return { lines: [muted(`theme set to ${next}`)], effect: { type: 'theme', theme: next } }
}

function sudo(data: ShellData, args: string[]): ShellResult {
  if (args[0] === 'hire-me') {
    return {
      lines: [
        muted('[sudo] password for recruiter: ********'),
        accent('✓ permission granted. opening a conversation…'),
        link(data.links.email.replace(/^mailto:/, ''), data.links.email),
      ],
      effect: { type: 'open', href: data.links.email },
    }
  }
  return {
    lines: [err('visitor is not in the sudoers file. This incident will be reported.')],
  }
}

export function runCommand(input: string, context: ShellContext): ShellResult {
  const [command, ...args] = input.trim().split(/\s+/).filter(Boolean)
  const { data } = context
  if (!command) return { lines: [] }
  // Lets `cat Museum MACAN` find a project by its display name.
  const target = args.length ? args.join(' ') : undefined

  switch (command) {
    case 'help':
      return help()
    case 'whoami':
      return { lines: [accent(data.name), out(data.jobTitle)] }
    case 'ls':
      return ls(data, args[0])
    case 'cat':
      return cat(data, target)
    case 'open':
      return open(data, target)
    case 'contact':
      return { lines: contact(data) }
    case 'theme':
      return theme(context.theme, args[0])
    case 'history':
      return {
        lines: context.history.map((entry, index) =>
          out(`${String(index + 1).padStart(4)}  ${entry}`),
        ),
      }
    case 'clear':
      return { lines: [], effect: { type: 'clear' } }
    case 'exit':
      return { lines: [], effect: { type: 'exit' } }
    case 'pwd':
      return { lines: [out('~/portfolio')] }
    case 'echo':
      return { lines: [out(args.join(' '))] }
    case 'sudo':
      return sudo(data, args)
    case 'rm':
      return { lines: [err('rm: nice try. This portfolio is append-only.')] }
    default:
      return { lines: [err(`command not found: ${command} — try \`help\``)] }
  }
}

/** Every input line that completes `input`, for Tab completion. */
export function complete(input: string, data: ShellData): string[] {
  const tokens = input.trimStart().split(/\s+/)
  if (tokens.length === 1) {
    const partial = tokens[0]
    return [...Object.keys(COMMANDS), ...DISCOVERABLE_COMMANDS]
      .filter((name) => name.startsWith(partial))
      .sort()
  }
  if (tokens.length === 2) {
    const [command, partial] = tokens
    return argumentCandidates(command, data)
      .filter((candidate) => candidate.startsWith(partial))
      .map((candidate) => `${command} ${candidate}`)
  }
  return []
}
