FROM node:22-alpine AS base
WORKDIR /app
COPY frontend/package*.json frontend/
RUN corepack enable && npm -v && node -v && cd frontend && npm ci

COPY frontend ./frontend
# Inject runtime gateway URL for Next build
# If deploy/frontend.env exists, Next.js will read .env.production at build time
COPY deploy/frontend.env frontend/.env.production
RUN cd frontend && npm run build

FROM node:22-alpine
WORKDIR /app/frontend
ENV NODE_ENV=production
COPY --from=base /app/frontend/.next ./.next
COPY --from=base /app/frontend/package*.json ./
COPY --from=base /app/frontend/next.config.ts ./next.config.ts
COPY --from=base /app/frontend/public ./public

RUN npm ci --omit=dev

EXPOSE 3001
ENV PORT=3001
CMD ["npm", "run", "start"]
