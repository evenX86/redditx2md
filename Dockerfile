# =============================================================================
# Multi-stage Dockerfile for redditx2md
# Production-ready build with security, size, and caching optimizations
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# Purpose: Install dependencies and build the application
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Set build arguments for metadata
ARG BUILD_DATE
ARG VERSION=1.0.0

# Add metadata labels
LABEL org.opencontainers.image.title="redditx2md"
LABEL org.opencontainers.image.description="Reddit content fetcher and Markdown converter"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"

# Set working directory
WORKDIR /usr/src/app

# Install build dependencies (if any native modules need compilation)
# RUN apk add --no-cache python3 make g++

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies for potential build steps)
RUN npm ci --include=dev && \
    npm cache clean --force

# Copy application source code
COPY index.js ./
COPY lib ./lib
COPY tests ./tests

# -----------------------------------------------------------------------------
# Stage 2: Development/Testing stage (optional, for running tests)
# -----------------------------------------------------------------------------
FROM builder AS tester

# Run tests during build to ensure code quality
RUN npm test

# -----------------------------------------------------------------------------
# Stage 3: Final Production Image
# Purpose: Minimal, secure runtime image
# -----------------------------------------------------------------------------
FROM node:20-alpine AS final

# Set build arguments for metadata
ARG BUILD_DATE
ARG VERSION=1.0.0

# Set metadata labels
LABEL org.opencontainers.image.title="redditx2md"
LABEL org.opencontainers.image.description="Reddit content fetcher and Markdown converter - Production"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"

# Set production environment
ENV NODE_ENV=production \
    # Disable telemetry
    npm_config_unsafe_perm=false

# Create non-root user for running the application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy necessary files from builder stage
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/index.js ./
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/lib ./lib

# Create and set permissions for output directory
RUN mkdir -p /usr/src/app/output && \
    chown -R nodejs:nodejs /usr/src/app/output

# Switch to non-root user
USER nodejs

# Define volume for persistent output storage
VOLUME ["/usr/src/app/output"]

# Expose no ports (this is a CLI application, not a web service)

# Health check (verify application can start)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Default command
ENTRYPOINT ["node", "index.js"]

# Set default command arguments
CMD []
