# CLAUDE.md

This file provides guidance for Claude Code (claude.ai/code) when working in
this repository.

## What this is

Personal portfolio for [rifkiramadhani.my.id](https://rifkiramadhani.my.id),
built with Astro 7, Tailwind CSS, TypeScript, and Bun. Read
[AGENTS.md](AGENTS.md) for repository-wide engineering rules, plus
[CONTEXT.md](CONTEXT.md), [PRODUCT.md](PRODUCT.md), and [DESIGN.md](DESIGN.md)
before substantial work.

## Commands

`bun dev` starts the dev server, `bun run build` builds, and `bun run check`
runs the full gate (lint, typecheck, tests, publishing verification).

## Commit conventions

Commits use concise, imperative Conventional Commit subjects in the form
`type(scope): summary`, with one logical change per commit.

Follow the full
[checkpoint commit workflow](AGENTS.md#checkpoint-commit-workflow). Its
load-bearing rules:

- **This workflow is the user's standing request to commit.** Commit each
  checkpoint as soon as its focused checks pass, without asking and without
  waiting to be told. Never push or force-push unless asked.
- List the checkpoints before writing code, each ending with its commit
  subject, in the plan or todo list. Approving the plan approves those commits.
- Stage only that checkpoint's files or hunks, run `git commit`, and only then
  start the next checkpoint. Never batch checkpoints into one commit at the end.
- A checkpoint is not done until it is committed. Do not mark work complete or
  send a final reply while your own changes are uncommitted; confirm with
  `git status` and list the commits you created.

Update the matching task checkbox or status only in the commit that completes
that task.
