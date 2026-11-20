FROM oven/bun:1.4.4 AS bun
FROM bun AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
COPY api/package.json ./api/
COPY web/package.json ./web/

FROM dependencies AS development
RUN bun install --frozen-lockfile --filter me-cms
COPY api/tsconfig.json ./api/
COPY api/src ./api/src
RUN bun run --cwd api build
ENV HOST=0.0.0.0
CMD ["bun", "api/dist/main.js"]

FROM dependencies AS production-dependencies
RUN bun install --frozen-lockfile --production --filter me-cms

FROM bun AS production
ENV NODE_ENV=production HOST=0.0.0.0
WORKDIR /app/api
COPY --from=production-dependencies /app/node_modules /app/node_modules
COPY --from=production-dependencies /app/api/node_modules ./node_modules
COPY --from=development /app/api/dist ./dist
USER bun
EXPOSE 3000
CMD ["bun", "dist/main.js"]
