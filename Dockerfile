# Multi-stage build for Paris Security Pulse (Fullstack)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace and package manifests
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install

# Copy source code
COPY client/ ./client/
COPY server/ ./server/

# Build client and server
RUN npm run build --workspace=client
RUN npm run build --workspace=server

# Production image (non-root USER node for security hardening)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Ensure node user owns the working directory
RUN chown -R node:node /app

COPY --chown=node:node package*.json ./
COPY --chown=node:node server/package*.json ./server/

RUN npm install --omit=dev --workspace=server

COPY --chown=node:node --from=builder /app/server/dist ./server/dist
COPY --chown=node:node --from=builder /app/client/dist ./client/dist

# Switch to non-privileged user node
USER node

EXPOSE 4000

CMD ["node", "server/dist/server.js"]
