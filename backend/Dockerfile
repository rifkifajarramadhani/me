FROM oven/bun:1.4.4 AS bun
FROM node:24-bookworm-slim AS dependencies

COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app/backend
COPY backend/package.json backend/bun.lock ./

FROM dependencies AS build
RUN bun install --frozen-lockfile
COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY src/styles/tokens.css /app/src/styles/tokens.css
RUN bun run build

FROM dependencies AS production-dependencies
RUN bun install --frozen-lockfile --production

FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0
WORKDIR /app
COPY --from=production-dependencies /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
