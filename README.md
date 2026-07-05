# Portfolio

A neobrutalism-styled Astro + Tailwind portfolio.

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

The site is configured for GitHub Pages with `base: '/me'`. Preview uses the same base path.

## Config

- Update site metadata in [`src/layouts/Layout.astro`](src/layouts/Layout.astro)
- Update home page content in [`src/pages/index.astro`](src/pages/index.astro)
- Update the favicon in `public/`

## Content config

### Links on the home page

Edit [`src/components/Links.tsx`](src/components/Links.tsx). Each link has an `icon` (from `@icons-pack/react-simple-icons`) and `href`. Visit [simpleicons.org](https://simpleicons.org/) for available icons.

### Updating the rest of the content

Edit files in [`src/data/`](src/data/).

### Project preview images

Place images in `public/` and reference them in [`src/data/projects.ts`](src/data/projects.ts):

```ts
previewImage: 'my-project.png'
```

Images are served with the Astro base path (`/me/` on GitHub Pages).

### Skills

In [`src/data/skills.ts`](src/data/skills.ts), each object is a skill field with a `field` name and `skills` array. Each skill has a `skill` label (tooltip text) and `icon` component.

## Styling

To change styling, visit the [neobrutalism styling docs](https://neobrutalism-components.vercel.app/docs/styling) and copy the desired tokens into [`tailwind.config.ts`](tailwind.config.ts).
