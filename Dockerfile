# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.18.0

###
# Base image with apt (Debian Bookworm works well for build + runtime)
###
FROM node:${NODE_VERSION}-bookworm AS base
WORKDIR /app
ENV NODE_ENV=production

###
# Build stage: compile native modules, install deps
###
FROM base AS build

# Tools needed to compile native addons and build node modules
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      build-essential \
      python3 \
      python3-pip \
      node-gyp \
      pkg-config && \
    rm -rf /var/lib/apt/lists/*

# Install Node deps (production only). Use ci for reproducibility.
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the app (includes ml_model/)
COPY . .

###
# Runtime stage: small image but includes Python 3 for your ML API
###
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install Python runtime for your ML API
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      python3 \
      python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Copy built app + node_modules from the build stage
COPY --from=build /app /app

# Install Python deps for the ML API

# Render provides $PORT; make sure your Node app uses it.
ENV PORT=8080

# Expose is informational; Render maps ports automatically.
EXPOSE 8080

# Ensure start.sh is executable (in case chmod didn't carry)
RUN chmod +x /app/start.sh

# Start both: Gunicorn ML API + Node web app
CMD ["./start.sh"]
