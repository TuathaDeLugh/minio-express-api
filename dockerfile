# Stage 1: Builder
FROM node:20 AS builder

WORKDIR /usr/src/app

# Install all dependencies (including devDeps)
COPY package*.json ./
RUN npm install

# Copy the source
COPY . .

# Build TypeScript -> dist/
RUN npm run build

# Stage 2: Runtime
FROM node:20 AS runtime

WORKDIR /usr/src/app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy build artifacts
COPY --from=builder /usr/src/app/dist ./dist

# Expose app port
EXPOSE 4000

# Start server
CMD ["node", "dist/server.js"]
