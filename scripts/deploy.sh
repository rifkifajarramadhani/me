#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf '%s\n' "$*" >&2
  exit 1
}

if [[ $# -ne 1 || ! $1 =~ ^[0-9a-f]{40}$ ]]; then
  fail "Usage: $0 <40-character commit SHA>"
fi

repo=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
export IMAGE_TAG=$1
export CMS_ENV_FILE="$HOME/.config/me-cms/.env"
[[ -f "$CMS_ENV_FILE" && -r "$CMS_ENV_FILE" ]] ||
  fail "Missing or unreadable CMS credentials file: $CMS_ENV_FILE"

umask 077
exec 9>"${CMS_ENV_FILE%/*}/deploy.lock"
flock 9

# The previous web deploy could use a project name derived from its checkout path.
web_projects=$(docker ps --all \
  --filter label=com.docker.compose.service=web \
  --filter label=com.docker.compose.oneoff=False \
  --filter label=traefik.http.routers.me.rule \
  --format '{{.Label "com.docker.compose.project"}}' | sort -u)
[[ "$web_projects" != *$'\n'* ]] || fail 'Found multiple portfolio web Compose projects.'
project=${web_projects:-me}

compose() {
  docker compose --env-file /dev/null --project-name "$project" \
    --file "$repo/docker-compose.yml" --profile prod "$@"
}

compose config --quiet 2>/dev/null ||
  fail 'Could not load the production Compose configuration. Check the CMS credentials file syntax.'
compose pull --policy always web api

# Reuse the selected image's config validator, including when rolling back to an
# image built by the legacy CMS workflow. Keep the one-off container off Traefik.
compose run --rm --no-deps --pull never -T --label traefik.enable=false \
  --entrypoint node api -e 'require("reflect-metadata"); new (require("./dist/admin/cms-config").CmsConfig)()'

previous_api=$(compose ps --status running --quiet api)
legacy_running=$(docker ps --quiet \
  --filter label=com.docker.compose.project=me-cms \
  --filter label=com.docker.compose.service=cms \
  --filter label=com.docker.compose.oneoff=False)
legacy=()
if [[ -n "$legacy_running" ]]; then
  mapfile -t legacy <<< "$legacy_running"
  if ! docker stop "${legacy[@]}"; then
    docker start "${legacy[@]}" || true
    fail 'Could not stop the legacy CMS.'
  fi
fi

compose up --detach --no-build --pull never --wait --wait-timeout 120 web api || {
  status=$?
  if [[ -z "$previous_api" ]] || (( ${#legacy[@]} )); then
    compose stop api || printf 'Could not stop the new API.\n' >&2
  fi
  if (( ${#legacy[@]} )); then
    docker start "${legacy[@]}" || printf 'Could not restart the legacy CMS.\n' >&2
  fi
  printf 'Deployment of %s failed in Compose project %s.\n' "$IMAGE_TAG" "$project" >&2
  exit "$status"
}
