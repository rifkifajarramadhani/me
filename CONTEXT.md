# Domain Context

## Publishing profile

A publishing profile is a named, build-time policy that owns the public origin, base path, document URL rules, publishing artifact content, and path resolution for one deployment target. `PUBLISHING_PROFILE` selects it; omitting the variable selects `apex`, and an unknown name fails during Astro configuration.

## Apex profile

The `apex` publishing profile targets `https://rifkiramadhani.my.id/` with `/` as its base path. It is the default and the production profile used by Docker and CI deployment artifacts.

## GitHub Pages profile

The `github-pages` publishing profile targets `https://rifkifajarramadhani.github.io/me/` with `/me` as its base path. It is retained for build compatibility and verification only; it does not have a deployment workflow in this repository.
