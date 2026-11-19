# Portfolio

A dark-themed personal portfolio with lightweight native scroll animations for [rifkiramadhani.my.id](https://rifkiramadhani.my.id).

**Stack:** Astro 7, Tailwind CSS, TypeScript, Bun

## Get started
This project uses [Bun](https://bun.sh) as its package manager and script runner. The Astro CLI runs on Node.js, which must be version 22.23.4 or newer (see [`.nvmrc`](.nvmrc)).
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

## CMS backend

The NestJS service is a separate package under `backend/`. Use Node.js 24 and Bun to run it locally. Register a GitHub OAuth app with the callback URL `http://127.0.0.1:3000/admin/auth/github/callback` and leave wildcard matching disabled. Set the app credentials in `backend/.env`.

```bash
cp .env.example backend/.env
cd backend
bun install --frozen-lockfile
bun run dev
```

Open `http://127.0.0.1:3000/admin/` to sign in. The backend accepts only `CMS_GITHUB_OWNER_ID`, the numeric account ID returned by GitHub. Sessions expire after eight hours or when the service restarts.

Check `/healthz` for readiness. Run `bun run test` from `backend/` to build and test the service with a simulated GitHub provider.

## Environment variables

Copy `.env.example` and adjust values for your target environment:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PUBLISHING_PROFILE` | Named publishing target: `apex` or `github-pages` | `apex` |
| `DOMAIN` | Domain name (used in deployment config) | — |
| `CMS_ORIGIN` | Origin used for CMS cookies, callback URL, and request origin checks | — |
| `CMS_GITHUB_CLIENT_ID` | Client ID of the GitHub OAuth app | — |
| `CMS_GITHUB_CLIENT_SECRET` | Client secret of the GitHub OAuth app | — |
| `CMS_GITHUB_OWNER_ID` | Numeric ID of the single GitHub account allowed to sign in | — |

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
3. Tests the CMS and publishes both Docker images to GHCR under the same commit SHA
4. SSHes into the server, runs `~/deploy-me.sh` for the portfolio, and updates the CMS if enabled

The container is served by nginx and routed through Traefik with TLS (Let's Encrypt). See [`docker-compose.yml`](docker-compose.yml) for Traefik labels and health check config.

### Enable the CMS in production

1. Register a GitHub OAuth app with the exact callback URL `https://rifkiramadhani.my.id/admin/auth/github/callback`. Keep wildcard matching disabled.
2. Confirm the VPS can pull `ghcr.io/rifkifajarramadhani/me-cms` and that the existing `~/deploy-me.sh` still deploys the portfolio on the shared `edge` network. The deploy job manages the CMS in its own `me-cms` Compose project.
3. On the VPS, create `~/.config/me-cms/.env` with file permissions `0600`. Set `CMS_GITHUB_CLIENT_ID`, `CMS_GITHUB_CLIENT_SECRET`, and `CMS_GITHUB_OWNER_ID` (`157324525` for the portfolio owner). Compose sets the production origin. The deploy job enables the `cms` profile when this file is readable.
4. After the next deploy, check the portfolio home page. Visit `/admin/`, sign in as the owner, and sign out. Use `docker ps --filter label=com.docker.compose.project=me-cms` on the VPS to check the CMS container's health.

To disable the CMS, move the VPS env file to a private backup path to prevent future deploys from starting the service. Stop the container with `docker stop me-cms-cms-1`. The portfolio has its own container and router.

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

Astro and the CMS share the color variables in [`src/styles/tokens.css`](src/styles/tokens.css). Tailwind theme bindings, typography, animation, and global styles live in [`src/styles/globals.css`](src/styles/globals.css).
