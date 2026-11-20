import { spawn } from 'node:child_process'
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
} from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PublishingProfileName } from '../src/lib/site-publishing'

interface ExpectedBuild {
  profile: PublishingProfileName
  base: '/' | '/me/'
  homeUrl: string
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const obsoleteDomain = 'rifkifajarramadhani.github.io/portfolio'
const expectedBuilds: ExpectedBuild[] = [
  {
    profile: 'apex',
    base: '/',
    homeUrl: 'https://rifkiramadhani.my.id/',
  },
  {
    profile: 'github-pages',
    base: '/me/',
    homeUrl: 'https://rifkifajarramadhani.github.io/me/',
  },
]

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function assertIncludes(content: string, expected: string, artifact: string) {
  assert(
    content.includes(expected),
    `${artifact} is missing expected content: ${expected}`,
  )
}

async function build(profile: PublishingProfileName, outDir: string) {
  await new Promise<void>((resolveBuild, rejectBuild) => {
    const child = spawn(
      process.execPath,
      ['run', 'build', '--outDir', outDir],
      {
        cwd: projectRoot,
        env: { ...process.env, PUBLISHING_PROFILE: profile },
        stdio: 'inherit',
      },
    )

    child.on('error', rejectBuild)
    child.on('exit', (code) => {
      if (code === 0) resolveBuild()
      else rejectBuild(new Error(`${profile} build exited with code ${code}`))
    })
  })
}

async function readRequired(path: string) {
  assert((await stat(path)).isFile(), `Missing artifact: ${path}`)
  return readFile(path, 'utf8')
}

async function verifyNoObsoleteDomain(path: string): Promise<void> {
  const entry = await stat(path)
  if (entry.isFile()) {
    const content = await readFile(path)
    assert(
      !content.includes(obsoleteDomain),
      `Obsolete domain found in ${path}`,
    )
    return
  }

  const children = await readdir(path)
  await Promise.all(
    children.map((child) => verifyNoObsoleteDomain(join(path, child))),
  )
}

async function verifyAdmin(outDir: string, profile: PublishingProfileName) {
  if (profile === 'github-pages') {
    assert(
      !(await readdir(outDir)).includes('admin'),
      'GitHub Pages contains admin pages',
    )
    return
  }

  for (const [file, title] of [
    ['admin/index.html', 'Portfolio admin'],
    ['admin/login/index.html', 'Admin sign-in'],
  ]) {
    const html = await readRequired(join(outDir, file))
    assertIncludes(html, `<title>${title}</title>`, file)
    assertIncludes(html, '<meta name="robots" content="noindex">', file)
    const stylesheet = html.match(
      /<link rel="stylesheet" href="\/(_astro\/[^"]+\.css)">/,
    )?.[1]
    const script = html.match(
      /<script type="module" src="\/(_astro\/[^"]+\.js)">/,
    )?.[1]
    assert(stylesheet && script, `${file} is missing its external CSS or JavaScript`)
    assertIncludes(await readRequired(join(outDir, stylesheet)), '--canvas:', stylesheet)
    assertIncludes(await readRequired(join(outDir, script)), '/admin/session', script)
  }
}

async function verifyBuild(outDir: string, expected: ExpectedBuild) {
  const { base, homeUrl, profile } = expected
  const asset = (path: string) => `${base}${path}`
  const canonical404 = `${homeUrl}404/`
  const sitemapUrl = `${homeUrl}sitemap-index.xml`

  const home = await readRequired(join(outDir, 'index.html'))
  const notFound = await readRequired(join(outDir, '404.html'))
  const sitemapIndex = await readRequired(join(outDir, 'sitemap-index.xml'))
  const sitemap = await readRequired(join(outDir, 'sitemap-0.xml'))
  const robots = await readRequired(join(outDir, 'robots.txt'))
  const manifestText = await readRequired(join(outDir, 'site.webmanifest'))
  const manifest = JSON.parse(manifestText) as {
    name?: string
    start_url?: string
    scope?: string
    icons?: Array<{ src?: string }>
  }

  await stat(join(outDir, 'favicon-96x96.png'))
  const favicon = await readFile(join(outDir, 'favicon-96x96.png'))
  assert(
    favicon.readUInt32BE(16) === 96 && favicon.readUInt32BE(20) === 96,
    `${profile} favicon is not 96x96`,
  )

  assertIncludes(
    home,
    '<title>Rifki Fajar Ramadhani | Full-Stack Engineer in Indonesia</title>',
    `${profile} homepage`,
  )
  assertIncludes(
    home,
    `<link rel="canonical" href="${homeUrl}">`,
    `${profile} homepage`,
  )
  assertIncludes(
    home,
    `<meta property="og:url" content="${homeUrl}">`,
    `${profile} homepage`,
  )
  assertIncludes(
    home,
    `<meta property="og:image" content="${homeUrl}og-image.png">`,
    `${profile} homepage`,
  )
  assertIncludes(
    home,
    `<meta name="twitter:image" content="${homeUrl}twitter-image.png">`,
    `${profile} homepage`,
  )
  assertIncludes(
    home,
    `<link rel="icon" type="image/png" sizes="96x96" href="${asset('favicon-96x96.png')}">`,
    `${profile} homepage`,
  )
  assertIncludes(home, `href="${asset('resume.pdf')}"`, `${profile} homepage`)
  assertIncludes(home, `src="${asset('typefn/1.png')}"`, `${profile} homepage`)
  assertIncludes(
    home,
    `<link rel="sitemap" type="application/xml" href="${asset('sitemap-index.xml')}">`,
    `${profile} homepage`,
  )
  assertIncludes(
    home,
    '<meta property="og:site_name" content="Rifki Fajar Ramadhani">',
    `${profile} homepage`,
  )
  assertIncludes(
    home,
    `"@id":"${homeUrl}#person"`,
    `${profile} structured data`,
  )
  assertIncludes(
    home,
    `"@id":"${homeUrl}#website"`,
    `${profile} structured data`,
  )
  assertIncludes(
    home,
    '"alternateName":["Rifki","rifkiramadhani.my.id"]',
    `${profile} structured data`,
  )
  assert(
    (home.match(/<h1(?:\s|>)/g) ?? []).length === 1,
    `${profile} homepage must contain exactly one h1`,
  )
  assert(
    /<h1[^>]*>\s*Rifki Fajar Ramadhani\s*<\/h1>/.test(home),
    `${profile} homepage has the wrong h1 identity`,
  )

  assertIncludes(
    notFound,
    `<link rel="canonical" href="${canonical404}">`,
    `${profile} 404 page`,
  )
  assertIncludes(
    notFound,
    '<meta name="robots" content="noindex">',
    `${profile} 404 page`,
  )
  assertIncludes(notFound, `href="${base}"`, `${profile} 404 page`)

  assertIncludes(sitemapIndex, `${homeUrl}sitemap-0.xml`, `${profile} sitemap index`)
  assertIncludes(sitemap, `<loc>${homeUrl}</loc>`, `${profile} sitemap`)
  assertIncludes(sitemap, '<changefreq>monthly</changefreq>', `${profile} sitemap`)
  assert(!sitemap.includes('/404'), `${profile} sitemap contains the 404 page`)
  assert(!sitemap.includes('/admin'), `${profile} sitemap contains admin pages`)

  assert(
    robots === `User-agent: *\nAllow: ${base}\n\nSitemap: ${sitemapUrl}\n`,
    `${profile} robots.txt has unexpected content`,
  )
  assert(manifest.name === 'Rifki Fajar Ramadhani', `${profile} manifest name is wrong`)
  assert(manifest.start_url === base, `${profile} manifest start_url is wrong`)
  assert(manifest.scope === base, `${profile} manifest scope is wrong`)
  assert(
    manifest.icons?.every(({ src }) => src?.startsWith(base)),
    `${profile} manifest icon escaped its publishing base`,
  )

  await verifyAdmin(outDir, profile)
  await verifyNoObsoleteDomain(outDir)
}

// Astro moves build assets with rename(), which fails across filesystems, so
// the output must live on the same device as the project, not the OS tmpdir.
const temporaryParent = join(projectRoot, '.astro')
await mkdir(temporaryParent, { recursive: true })
const temporaryRoot = await mkdtemp(join(temporaryParent, 'site-publishing-'))

try {
  for (const expected of expectedBuilds) {
    const outDir = join(temporaryRoot, expected.profile)
    await build(expected.profile, outDir)
    await verifyBuild(outDir, expected)
    console.log(`Verified ${expected.profile} publishing artifacts.`)
  }

  await verifyNoObsoleteDomain(resolve(projectRoot, 'resume'))
  await verifyNoObsoleteDomain(resolve(projectRoot, 'public', 'resume.pdf'))
} finally {
  await rm(temporaryRoot, { recursive: true, force: true })
}
