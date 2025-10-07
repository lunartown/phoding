FROM node:22 AS base
WORKDIR /app

# Show tool versions
RUN corepack enable && npm -v && node -v

# Install system dependencies required by Prisma (OpenSSL 3.x)
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Install gateway dependencies, generate Prisma client, then build
COPY gateway/package*.json gateway/
COPY gateway/prisma ./gateway/prisma
RUN cd gateway && npm ci && npx prisma generate
COPY gateway ./gateway
RUN cd gateway && npm run build

# Copy workspace source and install deps AFTER copy so node_modules remain
COPY workspace ./workspace
RUN cd workspace && npm install --production=false

# Runtime image
FROM node:22
WORKDIR /app
ENV NODE_ENV=production

# Install runtime dependencies (OpenSSL for Prisma)
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Copy built gateway and installed node_modules (gateway + workspace)
COPY --from=base /app/gateway /app/gateway
COPY --from=base /app/workspace /app/workspace

# Expose gateway port
EXPOSE 3002

# Default envs can be overridden by docker-compose env_file
ENV PORT=3002

WORKDIR /app/gateway
CMD ["npm", "run", "start:prod"]
