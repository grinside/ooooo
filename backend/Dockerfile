# Multi-stage build for production-optimized Node.js application
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application source
COPY . .

# Stage 2: Production stage
FROM node:20-alpine AS production

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    dumb-init \
    curl \
    tzdata

# Copy dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=nodejs:nodejs . .

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/uploads /app/tmp && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Default command (can be overridden)
CMD ["node", "src/index.js"]

# Labels for metadata
LABEL maintainer="Max IT TV <admin@maxittv.com>" \
      version="1.0.0" \
      description="Max IT TV Affiliation System - Backend API" \
      org.opencontainers.image.source="https://github.com/maxittv/affiliation-system" \
      org.opencontainers.image.vendor="Max IT TV" \
      org.opencontainers.image.title="Max IT TV Affiliation Backend" \
      org.opencontainers.image.description="Backend API for Max IT TV Affiliation System"
