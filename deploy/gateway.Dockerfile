FROM node:22-alpine AS base
WORKDIR /app

# Copy monorepo pieces needed by gateway and workspace preview
COPY gateway/package*.json gateway/
COPY workspace/package*.json workspace/

RUN corepack enable && npm -v && node -v

# Install deps for gateway and workspace (workspace dev server is spawned by gateway)
RUN cd gateway && npm ci && cd .. \
 && cd workspace && npm ci && cd ..

# Build gateway
COPY gateway ./gateway
RUN cd gateway && npm run build

# Copy workspace sources (so gateway can spawn vite dev)
COPY workspace ./workspace

# Runtime image
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy built gateway and installed node_modules (gateway + workspace)
COPY --from=base /app/gateway /app/gateway
COPY --from=base /app/workspace /app/workspace

# Expose gateway port
EXPOSE 3002

# Default envs can be overridden by docker-compose env_file
ENV PORT=3002

WORKDIR /app/gateway
CMD ["npm", "run", "start:prod"]

