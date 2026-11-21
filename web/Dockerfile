FROM oven/bun:1.4.4 AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
COPY api/package.json ./api/
COPY web/package.json ./web/
RUN bun install --frozen-lockfile --filter me-web

FROM dependencies AS development
COPY shared/tokens.css ./shared/
COPY web/astro.config.mjs web/tsconfig.json ./web/
COPY web/src ./web/src
COPY web/public ./web/public
CMD ["bun", "run", "--cwd", "web", "dev", "--host", "0.0.0.0", "--port", "4321"]

FROM development AS build
ARG PUBLISHING_PROFILE=apex
ENV PUBLISHING_PROFILE=${PUBLISHING_PROFILE}
RUN bun run --cwd web build

FROM nginx:1.30-alpine

COPY --from=build /app/web/dist/client /usr/share/nginx/html
COPY web/docker/nginx/me.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
