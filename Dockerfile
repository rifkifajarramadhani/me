FROM oven/bun:1.4.4 AS build

WORKDIR /app

ARG PUBLISHING_PROFILE=apex

ENV PUBLISHING_PROFILE=${PUBLISHING_PROFILE}

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM nginx:1.30-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx/me.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
