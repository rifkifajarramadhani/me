# Domain Context

## Publishing profile

A publishing profile is a named, build-time policy that owns the public origin, base path, document URL rules, publishing artifact content, and path resolution for one deployment target. `PUBLISHING_PROFILE` selects it; omitting the variable selects `apex`, and an unknown name fails during Astro configuration.

## Apex profile

The `apex` publishing profile targets `https://rifkiramadhani.my.id/` with `/` as its base path. It is the default and the production profile used by Docker and CI deployment artifacts.

## GitHub Pages profile

The `github-pages` publishing profile targets `https://rifkifajarramadhani.github.io/me/` with `/me` as its base path. It is retained for build compatibility and verification only; it does not have a deployment workflow in this repository.

## Post

A post is one blog article written in the admin editor. Its content is stored as Tiptap JSON, validated against the StarterKit schema, and rendered to HTML by the CMS on every save. The public blog prints only that server-rendered HTML.

## Post status

A post status is `draft`, `scheduled`, `published`, or `archived`. Drafts and archived posts are hidden from the blog; published posts are listed newest first. Allowed transitions are fixed in `api/src/posts/post-status.ts`, and only drafts and archived posts can be deleted.

## Scheduled post

A scheduled post has a future publish time and becomes published once that time passes. No job rewrites it: reads treat a due scheduled post as published, and its stored status settles to `published` on its next write.

## Slug lock

A post's slug becomes read-only once the post has been public, even if it later returns to draft, so published links keep working.
