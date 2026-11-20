# Portfolio

A dark-themed personal portfolio with lightweight native scroll animations for [rifkiramadhani.my.id](https://rifkiramadhani.my.id).

Astro and Tailwind CSS serve the portfolio and admin UI from `web/`. The
NestJS API in `api/` handles CMS authentication and sessions. Both apps use
TypeScript and install through the root Bun workspace.

## Get started
Use [Bun](https://bun.sh) 1.4.4 or later as the JavaScript runtime. Run the
following commands from the repository root.

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

Run linting, TypeScript checks, web tests, API integration tests, and artifact verification for both publishing profiles.

```bash
bun run check
```

## CMS admin

Register a local GitHub OAuth app with the callback URL
`http://127.0.0.1:4321/admin/auth/github/callback` and leave wildcard matching
disabled. Set the app credentials in the root `.env`.

```bash
cp .env.example .env
bun run dev:api
```

Run `bun dev` in a second terminal. Open `http://127.0.0.1:4321/admin/` to
sign in. Astro serves the admin pages and proxies authentication and session
requests to NestJS. NestJS accepts only `CMS_GITHUB_OWNER_ID`, the numeric
account ID returned by GitHub. Sessions expire after eight hours or when the
API restarts.

Check `/healthz` for readiness. Run `bun run --cwd api test` to build and test the service with a simulated GitHub provider.

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
| `CMS_API_TARGET` | Internal API origin for the Astro development proxy | `http://127.0.0.1:3000` |
| `GITHUB_CONTRIBUTIONS_TOKEN` | Optional fine-grained GitHub token with public repository read access for the commit calendar | — |

An omitted `PUBLISHING_PROFILE` builds the apex site at `https://rifkiramadhani.my.id/`. Use `PUBLISHING_PROFILE=github-pages` to verify compatibility with `https://rifkifajarramadhani.github.io/me/`. Unknown names fail during Astro configuration.

GitHub Pages is a build-compatibility target only; this repository does not deploy it.

### GitHub commit activity

To enable the heatmap on the apex portfolio, create a fine-grained GitHub
personal access token with **Public repositories** access and leave additional
permissions unset. Add it as `GITHUB_CONTRIBUTIONS_TOKEN` in the root `.env`
for local development or the project's `.env` on the VPS, then restart the API.
The API caches commit totals for an hour and can serve the last successful
response for up to 24 hours. The cache starts empty after an API restart.
The portfolio links to the GitHub profile when commit data is unavailable.

## Docker

### Development with Compose

Copy `.env.example` to the root `.env` and fill in the local GitHub OAuth
credentials described above. From the repository root, run this with Docker
Compose 2.24 or newer.

```bash
docker compose --profile dev up --build --watch
```

Open Astro at `http://127.0.0.1:4321/` and the CMS at
`http://127.0.0.1:4321/admin/`. The dev container mounts `web/src`, `web/public`,
and `shared` from your checkout so Astro updates the browser when you save a
frontend edit. Frontend live reload also works with
`docker compose --profile dev up -d --build`.

Compose Watch rebuilds the API when its source changes, restarts Astro for web
config changes, and rebuilds images after dependency changes. Both services use
the project's default Docker network. Restart the command after editing `.env`.

### Build production images locally

Build and run the production web image locally.

```bash
docker build -f web/Dockerfile \
  --build-arg PUBLISHING_PROFILE=apex \
  -t me .

docker run -p 8080:80 me
```

The site will be available at `http://localhost:8080`. Build the CMS image from the same workspace with `docker build -f api/Dockerfile -t me-cms .`.

## Deployment

On pushes to `main`, the [GitHub Actions workflow](.github/workflows/publish.yml)
runs the root checks and builds, publishes both GHCR images with the same commit
SHA, then sends the Compose file and [deploy script](scripts/deploy.sh) to the
VPS over SSH.

The script uses the `prod` profile in [`docker-compose.yml`](docker-compose.yml).
It reuses the portfolio web container's Compose project name, or uses `me` on a
fresh VPS. It pulls both SHA-tagged images and runs the API's configuration
check before stopping any running services. It then stops the legacy `cms`
service in the `me-cms` project, if active, and waits for both new health checks.
If startup fails during migration, the script stops the new API and restarts the
legacy CMS if it was running.

### First production deploy

1. Confirm that the GitHub Actions secrets `SSH_HOST`, `SSH_USER`, and `SSH_KEY`
   connect to the VPS. The SSH user needs Docker access, Compose 2.24 or newer,
   Bash, and `flock`. Confirm that it can pull both
   `ghcr.io/rifkifajarramadhani/me` and `ghcr.io/rifkifajarramadhani/me-cms`.
2. Confirm that Traefik is running on the external Docker network `edge` with
   the `websecure` entry point and the `letsencrypt` certificate resolver.
3. Register a GitHub OAuth app with the exact callback URL
   `https://rifkiramadhani.my.id/admin/auth/github/callback` and keep wildcard
   matching disabled. Put the production `CMS_GITHUB_CLIENT_ID`,
   `CMS_GITHUB_CLIENT_SECRET`, and `CMS_GITHUB_OWNER_ID` (`157324525` for the
   portfolio owner) in the project root's `.env` on the VPS. Compose sets
   the production origin. Keep the file readable by the SSH user with mode
   `0600`. The workflow uses `~/me/.env` by default. If your project directory
   is elsewhere, set the GitHub Actions repository variable `ME_PROJECT_DIR`
   to its absolute path on the VPS.
4. After deployment, confirm both containers are healthy with
   `docker ps --filter label=com.docker.compose.project=<project>`.
   Open the portfolio home page, then visit `/admin/` and sign in and out as the
   owner to verify the production OAuth app.

### Roll back by SHA

Use a known-good commit SHA published for both images. On the VPS, run the
following from the project root that contains the production `.env` and has
the target commit available. Extract the Compose file and deploy script from
the same commit as the image tags so the runtime and health checks match.

```bash
(
  set -euo pipefail
  sha=REPLACE_WITH_COMMIT_SHA
  deploy_dir=$(mktemp -d)
  trap 'rm -rf "$deploy_dir"' EXIT
  git archive "$sha" docker-compose.yml scripts/deploy.sh | tar -xf - -C "$deploy_dir"
  ME_PROJECT_DIR="$PWD" "$deploy_dir/scripts/deploy.sh" "$sha"
)
```

The script uses the same VPS credentials for the rollback and waits for both
services to pass their health checks. Verify the home page and owner sign-in
again after rollback.

## Content customization

| What | File |
|------|------|
| Professional identity, SEO copy, social links | [`web/src/lib/site.ts`](web/src/lib/site.ts) |
| Publishing profiles, URLs, and generated artifacts | [`web/src/lib/site-publishing.ts`](web/src/lib/site-publishing.ts) |
| Work experience | [`web/src/data/experience.ts`](web/src/data/experience.ts) |
| Projects | [`web/src/data/projects.ts`](web/src/data/projects.ts) |
| Skills | [`web/src/data/skills.ts`](web/src/data/skills.ts) |
| Project preview images | `web/public/{project-name}/` |
| Favicon / OG image | `web/public/` |

### Social links

Edit `socialLinks` in [`web/src/lib/site.ts`](web/src/lib/site.ts). Skill icons in the UI use [`simple-icons`](https://simpleicons.org/).

### Project preview images

Place images in `web/public/` and reference them in [`web/src/data/projects.ts`](web/src/data/projects.ts):

```ts
previewImage: 'my-project.png'
```

Images are served through the selected publishing profile (`/me/` on GitHub Pages, `/` on the apex domain).

### Skills

In [`web/src/data/skills.ts`](web/src/data/skills.ts), each object is a skill field with a `field` name and `skills` array. Each skill has a `skill` label (tooltip text) and `icon` component.

## Styling

The portfolio and admin UI use the color variables in [`shared/tokens.css`](shared/tokens.css). Portfolio styles live in [`web/src/styles/globals.css`](web/src/styles/globals.css) and admin styles live in [`web/src/admin/admin.css`](web/src/admin/admin.css).
