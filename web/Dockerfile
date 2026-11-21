FROM oven/bun:1.4.4 AS bun

FROM bun AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
COPY api/package.json ./api/
COPY web/package.json ./web/
RUN bun install --frozen-lockfile --filter me-web

FROM dependencies AS development
COPY shared ./shared
COPY web/astro.config.mjs web/tsconfig.json ./web/
COPY web/src ./web/src
COPY web/public ./web/public
CMD ["bun", "run", "--cwd", "web", "dev", "--host", "0.0.0.0", "--port", "4321"]

FROM development AS build
ARG PUBLISHING_PROFILE=apex
ENV PUBLISHING_PROFILE=${PUBLISHING_PROFILE}
RUN bun run --cwd web build

FROM bun AS server-dependencies
WORKDIR /app
COPY package.json bun.lock ./
COPY api/package.json ./api/
COPY web/package.json ./web/
RUN bun install --frozen-lockfile --production --filter me-web

# On-demand blog pages (apex profile only). Static assets stay with nginx.
FROM bun AS server
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
WORKDIR /app/web
COPY --from=server-dependencies /app/node_modules /app/node_modules
COPY --from=server-dependencies /app/web/node_modules ./node_modules
COPY --from=build /app/web/dist/server ./dist/server
COPY --from=build /app/web/dist/client ./dist/client
USER bun
EXPOSE 4321
CMD ["bun", "dist/server/entry.mjs"]

# The static site. Last, so it stays the default build target.
FROM nginx:1.30-alpine AS static

COPY --from=build /app/web/dist/client /usr/share/nginx/html
COPY web/docker/nginx/me.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
