# Portfolio

A dark-themed personal portfolio with scroll animations for [rifkiramadhani.my.id](https://rifkiramadhani.my.id).

**Stack:** Astro 5, React 18, Tailwind CSS, Framer Motion, TypeScript, Bun

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

## Environment variables

Copy `.env.example` and adjust values for your target environment:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `SITE_URL` | Canonical site URL used for SEO and sitemap | `https://rifkifajarramadhani.github.io` |
| `BASE_PATH` | Astro base path | `/me` (GitHub Pages) |
| `DOMAIN` | Domain name (used in deployment config) | — |

For local development on a custom domain, use `BASE_PATH=/`. For GitHub Pages, keep `BASE_PATH=/me`.

## Docker

Build and run the production image locally:

```bash
docker build \
  --build-arg SITE_URL=https://rifkiramadhani.my.id \
  --build-arg BASE_PATH=/ \
  -t me .

docker run -p 8080:80 me
```

The site will be available at `http://localhost:8080`.

## Deployment

Production deploys automatically on push to `main` via [`.github/workflows/publish.yml`](.github/workflows/publish.yml):

1. Builds the Astro site with Bun and verifies SEO artifacts
2. Builds a Docker image and pushes it to GHCR (`ghcr.io/rifkifajarramadhani/me`)
3. SSHes into the server and runs the deploy script

The container is served by nginx and routed through Traefik with TLS (Let's Encrypt). See [`docker-compose.yml`](docker-compose.yml) for Traefik labels and health check config.

## Content customization

| What | File |
|------|------|
| Site metadata, name, social links | [`src/lib/site.ts`](src/lib/site.ts) |
| Work experience | [`src/data/experience.ts`](src/data/experience.ts) |
| Projects | [`src/data/projects.ts`](src/data/projects.ts) |
| Skills | [`src/data/skills.ts`](src/data/skills.ts) |
| Project preview images | `public/{project-name}/` |
| Favicon / OG image | `public/` |

### Social links

Edit `socialLinks` in [`src/lib/site.ts`](src/lib/site.ts). Social icons in the UI use [`@icons-pack/react-simple-icons`](https://simpleicons.org/).

### Project preview images

Place images in `public/` and reference them in [`src/data/projects.ts`](src/data/projects.ts):

```ts
previewImage: 'my-project.png'
```

Images are served with the Astro base path (`/me/` on GitHub Pages, `/` on a custom domain).

### Skills

In [`src/data/skills.ts`](src/data/skills.ts), each object is a skill field with a `field` name and `skills` array. Each skill has a `skill` label (tooltip text) and `icon` component.

## Styling

Colors, fonts, and breakpoints live in [`tailwind.config.ts`](tailwind.config.ts). Global styles and scrollbar theming are in [`src/styles/globals.css`](src/styles/globals.css).
