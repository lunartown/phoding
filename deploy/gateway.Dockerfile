FROM node:22-alpine AS base
WORKDIR /app

# Show tool versions
RUN corepack enable && npm -v && node -v

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
