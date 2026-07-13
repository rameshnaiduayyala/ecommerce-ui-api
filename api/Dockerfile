# Stage 1: Build & Dependencies
FROM node:22-alpine AS builder

WORKDIR /app

# Install build essentials for native modules (like bcrypt or sharp, though sharp uses prebuilds)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies including devDependencies for Prisma generation
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Stage 2: Production Run
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY . .

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
