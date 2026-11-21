import { describe, expect, test } from 'bun:test'
import {
  complete,
  projectSlug,
  runCommand,
  type ShellContext,
  type ShellData,
} from './terminal-shell'

const data: ShellData = {
  name: 'Ada Example',
  jobTitle: 'Full-Stack Engineer',
  resumeUrl: '/resume.pdf',
  links: {
    github: 'https://github.com/ada',
    linkedin: 'https://www.linkedin.com/in/ada/',
    email: 'mailto:ada@example.com',
  },
  projects: [
    {
      slug: 'typefn',
      name: 'Typefn',
      description: 'A typing trainer.',
      tags: ['Go', 'PostgreSQL'],
      liveLink: 'https://typefn.dev/',
      repoUrl: 'https://github.com/ada/typefn',
    },
    {
      slug: 'museum-macan',
      name: 'Museum MACAN',
      description: 'A museum site.',
      tags: [],
    },
  ],
  experience: [
    {
      company: 'Lima Bean',
      country: 'South Africa',
      role: 'Full-Stack Engineer',
      startDate: 'May 2024',
      endDate: 'Present',
    },
  ],
  skills: [{ field: 'Back-End', skills: ['Go', 'PostgreSQL'] }],
}

const context = (overrides: Partial<ShellContext> = {}): ShellContext => ({
  data,
  history: [],
  theme: 'dark',
  ...overrides,
})

const run = (input: string, overrides?: Partial<ShellContext>) =>
  runCommand(input, context(overrides))
const texts = (input: string) => run(input).lines.map((line) => line.text)

describe('runCommand', () => {
  test('ignores blank input', () => {
    expect(run('   ')).toEqual({ lines: [] })
  })

  test('help lists every public command and the key hints', () => {
    const output = texts('help').join('\n')
    for (const name of ['whoami', 'ls', 'cat', 'open', 'contact', 'theme', 'exit']) {
      expect(output).toContain(name)
    }
    expect(output).not.toContain('sudo')
    expect(output).toContain('Esc exits')
  })

  test('whoami answers from site data', () => {
    expect(texts('whoami')).toEqual(['Ada Example', 'Full-Stack Engineer'])
  })

  test('ls lists the root, projects, skills, and experience', () => {
    expect(texts('ls')[0]).toContain('projects/')
    expect(texts('ls projects')[0]).toStartWith('typefn')
    expect(texts('ls projects/')).toHaveLength(2)
    expect(texts('ls skills')).toEqual(['back-end/', '  Go  PostgreSQL'])
    expect(texts('ls experience')).toEqual(['lima-bean/'])
    expect(run('ls secrets').lines[0].kind).toBe('err')
  })

  test('cat prints experience, projects, and contact', () => {
    expect(texts('cat experience')).toEqual([
      'Full-Stack Engineer · Lima Bean',
      '  May 2024 – Present · South Africa',
    ])
    const project = run('cat typefn').lines
    expect(project.map((line) => line.text)).toContain('A typing trainer.')
    expect(project.filter((line) => line.kind === 'link')).toHaveLength(2)
    expect(texts('cat Museum MACAN')).toEqual(['Museum MACAN', 'A museum site.'])
    expect(texts('cat Museum')).toEqual(['cat: Museum: No such file or directory'])
    expect(texts('cat museum-macan')).toEqual(['Museum MACAN', 'A museum site.'])
    expect(run('cat contact.txt').lines.map((line) => line.href)).toEqual([
      data.links.email,
      data.links.github,
      data.links.linkedin,
    ])
    expect(run('cat resume.pdf').lines[0].kind).toBe('err')
    expect(run('cat').lines[0].kind).toBe('err')
  })

  test('open resolves named targets and project live links', () => {
    expect(run('open resume').effect).toEqual({ type: 'open', href: '/resume.pdf' })
    expect(run('open github').effect).toEqual({ type: 'open', href: data.links.github })
    expect(run('open typefn').effect).toEqual({
      type: 'open',
      href: 'https://typefn.dev/',
    })
    expect(run('open museum-macan').effect).toBeUndefined()
    const repoOnly = { ...data.projects[0], slug: 'aibar', liveLink: undefined }
    const withRepoOnly = { ...data, projects: [repoOnly] }
    expect(runCommand('open aibar', context({ data: withRepoOnly })).effect).toEqual({
      type: 'open',
      href: 'https://github.com/ada/typefn',
    })
    expect(run('open').lines[0].kind).toBe('err')
  })

  test('theme toggles or sets an explicit theme', () => {
    expect(run('theme').effect).toEqual({ type: 'theme', theme: 'light' })
    expect(run('theme', { theme: 'light' }).effect).toEqual({
      type: 'theme',
      theme: 'dark',
    })
    expect(run('theme dark').effect).toEqual({ type: 'theme', theme: 'dark' })
    expect(run('theme neon').effect).toBeUndefined()
  })

  test('history numbers previous commands', () => {
    expect(run('history', { history: ['ls', 'whoami'] }).lines.map((l) => l.text)).toEqual([
      '   1  ls',
      '   2  whoami',
    ])
  })

  test('clear and exit only return effects', () => {
    expect(run('clear')).toEqual({ lines: [], effect: { type: 'clear' } })
    expect(run('exit')).toEqual({ lines: [], effect: { type: 'exit' } })
  })

  test('sudo hire-me opens email; other sudo is refused', () => {
    expect(run('sudo hire-me').effect).toEqual({ type: 'open', href: data.links.email })
    expect(run('sudo rm -rf /').lines[0].kind).toBe('err')
  })

  test('hidden extras and unknown commands', () => {
    expect(texts('pwd')).toEqual(['~/portfolio'])
    expect(texts('echo  hello   world')).toEqual(['hello world'])
    expect(run('rm -rf /').lines[0].kind).toBe('err')
    expect(texts('vim')).toEqual(['command not found: vim — try `help`'])
  })
})

describe('complete', () => {
  test('completes command names, including sudo but not other extras', () => {
    expect(complete('th', data)).toEqual(['theme'])
    expect(complete('su', data)).toEqual(['sudo'])
    expect(complete('r', data)).toEqual([])
    expect(complete('', data)).toContain('help')
  })

  test('completes arguments per command', () => {
    expect(complete('ls p', data)).toEqual(['ls projects'])
    expect(complete('open t', data)).toEqual(['open typefn'])
    expect(complete('cat m', data)).toEqual(['cat museum-macan'])
    expect(complete('theme ', data)).toEqual(['theme light', 'theme dark'])
    expect(complete('whoami x', data)).toEqual([])
    expect(complete('open a b', data)).toEqual([])
  })
})

test('projectSlug normalises project names', () => {
  expect(projectSlug('Museum MACAN')).toBe('museum-macan')
  expect(projectSlug("Sportsman's Warehouse!")).toBe('sportsman-s-warehouse')
})
