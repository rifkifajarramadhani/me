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

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx/me.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
