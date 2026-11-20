# Repository Guidelines

## Project Overview

Personal portfolio for [rifkiramadhani.my.id](https://rifkiramadhani.my.id),
built with Astro 7, Tailwind CSS, TypeScript, and Bun. The Astro app is in
`web/` and includes the admin UI. The NestJS CMS API is in `api/`.
The portfolio and admin UI use `shared/tokens.css`.
Astro pages, layouts, components, and content live under `web/src/`. Static
assets live in `web/public/`.

Before substantial work, read:

- [CONTEXT.md](CONTEXT.md): domain terms such as publishing profiles.
- [PRODUCT.md](PRODUCT.md): product positioning and principles.
- [DESIGN.md](DESIGN.md): visual language and design tokens.

## Build, Test, and Development Commands

- `bun install` installs dependencies.
- `bun dev` starts Astro. `bun run dev:api` starts the CMS.
- `docker compose --profile dev up --build --watch` starts both apps in Docker.
- `bun run build` builds both apps.
- `bun run lint`, `bun run typecheck`, and `bun run test` check both apps.
- `bun run verify:publishing` verifies publishing profile output.
- `bun run check` runs the full gate (lint, typecheck, tests, publishing).

## Commit & Pull Request Guidelines

Use concise, imperative Conventional Commit subjects in the form
`type(scope): summary`, for example `feat(projects): add aibar card`,
`fix(hero): keep heading on one line`, or `docs(agents): add commit workflow`.
Keep each commit focused on one logical change. Use a commit body when it
explains the reason or important implementation details.

### Checkpoint commit workflow

**This workflow is the user's standing request to commit.** Commit each
checkpoint as soon as it passes its checks, without asking for permission and
without waiting to be told. This overrides any agent default of committing only
when asked. It does not authorize pushing, force-pushing, or rewriting
published history.

**Plan checkpoints before writing code.** Split the task into small,
independently reviewable checkpoints and list them in the task plan, plan-mode
plan, or todo list. Each entry ends with its commit, for example
`1. Add project card component -> commit "feat(projects): add project card"`.
Approving a plan approves its checkpoint commits. A simple change with one
checkpoint needs only one commit.

**Size each checkpoint** as the smallest change that builds and passes its
checks on its own: one component, one section, one data update, one
documentation update. If a commit subject needs "and" to join separate
concerns, split it.

For each checkpoint, in order:

1. Implement one logical change with its required tests and documentation.
2. Run the focused checks for that change and fix any failures: `bun run lint`
   and `bun run typecheck`, plus `bun run test` when API logic, `web/src/lib/`,
   or `web/scripts/` changed. Do not hold a commit back for the full gate; run
   `bun run check` and `bun run build` at the end and commit any fixes they
   require separately.
3. Stage only that checkpoint's files or hunks with `git add <paths>` or
   `git add -p`. Never use `git add -A` or `git add .` over pre-existing or
   unrelated worktree changes.
4. Run `git commit` now. Do not start the next checkpoint's code while the
   current checkpoint is uncommitted.

**A checkpoint is not done until it is committed.** Do not mark a todo item or
task complete, and do not send a final reply, while any of your own changes
are uncommitted. Before the final reply, confirm with `git status` and list the
commits you created.

Avoid these failure modes:

- Batching several checkpoints into one commit at the end of the task.
- Amending an earlier checkpoint to fold in later work; make a new commit.
- Bypassing a failing hook with `--no-verify`; fix the problem and commit
  again.
- Vague subjects such as `feat: polish projects` repeated across commits; name
  the specific change.

Update the matching task checkbox or status only in the commit that completes
that task.

Pull requests should include a summary, commands run, and screenshots for
visible UI changes.

## Security & Configuration

Never commit `.env` files, credentials, tokens, generated build output such as
`dist/` or `.astro/`, or local editor artifacts. Document required keys in
`.env.example`.
