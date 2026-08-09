# Portfolio

A dark-themed personal portfolio with lightweight native scroll animations for [rifkiramadhani.my.id](https://rifkiramadhani.my.id).

**Stack:** Astro 5, Tailwind CSS, TypeScript, Bun

## Get started

This project uses [Bun](https://bun.sh) as its JavaScript runtime and package manager.

### Installation

```bash
bun install
```

### Development

```bash
bun dev
```

### Build

```bash
bun run build
```

### Preview production build

```bash
bun preview
```

### Lint

```bash
bun run lint
```

### Check

Run linting, TypeScript, module tests, and artifact verification for both publishing profiles:

```bash
bun run check
```

## Environment variables

Copy `.env.example` and adjust values for your target environment:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PUBLISHING_PROFILE` | Named publishing target: `apex` or `github-pages` | `apex` |
| `DOMAIN` | Domain name (used in deployment config) | — |

An omitted `PUBLISHING_PROFILE` builds the apex site at `https://rifkiramadhani.my.id/`. Use `PUBLISHING_PROFILE=github-pages` to verify compatibility with `https://rifkifajarramadhani.github.io/me/`. Unknown names fail during Astro configuration.

GitHub Pages is a build-compatibility target only; this repository does not deploy it.

## Docker

Build and run the production image locally:

```bash
docker build \
  --build-arg PUBLISHING_PROFILE=apex \
  -t me .

docker run -p 8080:80 me
```

The site will be available at `http://localhost:8080`.

## Deployment

Production deploys automatically on push to `main` via [`.github/workflows/publish.yml`](.github/workflows/publish.yml):

1. Checks the code and verifies apex and GitHub Pages publishing artifacts
2. Builds the explicit apex Astro artifact
3. Builds a Docker image and pushes it to GHCR (`ghcr.io/rifkifajarramadhani/me`)
4. SSHes into the server and runs the deploy script

The container is served by nginx and routed through Traefik with TLS (Let's Encrypt). See [`docker-compose.yml`](docker-compose.yml) for Traefik labels and health check config.

## Content customization

| What | File |
|------|------|
| Professional identity, SEO copy, social links | [`src/lib/site.ts`](src/lib/site.ts) |
| Publishing profiles, URLs, and generated artifacts | [`src/lib/site-publishing.ts`](src/lib/site-publishing.ts) |
| Work experience | [`src/data/experience.ts`](src/data/experience.ts) |
| Projects | [`src/data/projects.ts`](src/data/projects.ts) |
| Skills | [`src/data/skills.ts`](src/data/skills.ts) |
| Project preview images | `public/{project-name}/` |
| Favicon / OG image | `public/` |

### Social links

Edit `socialLinks` in [`src/lib/site.ts`](src/lib/site.ts). Skill icons in the UI use [`simple-icons`](https://simpleicons.org/).

### Project preview images

Place images in `public/` and reference them in [`src/data/projects.ts`](src/data/projects.ts):

```ts
previewImage: 'my-project.png'
```

Images are served through the selected publishing profile (`/me/` on GitHub Pages, `/` on the apex domain).

### Skills

In [`src/data/skills.ts`](src/data/skills.ts), each object is a skill field with a `field` name and `skills` array. Each skill has a `skill` label (tooltip text) and `icon` component.

## Styling

Colors, fonts, and breakpoints live in [`tailwind.config.ts`](tailwind.config.ts). Global styles and scrollbar theming are in [`src/styles/globals.css`](src/styles/globals.css).
