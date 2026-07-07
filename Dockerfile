FROM oven/bun:1.3.10 AS build

WORKDIR /app

ARG SITE_URL
ARG BASE_PATH

ENV SITE_URL=${SITE_URL}
ENV BASE_PATH=${BASE_PATH}

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM caddy:2-alpine

COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443
