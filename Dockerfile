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

# Copy the rest of the app
COPY . .

# (Optional) If you have Python deps, uncomment the two lines below
# COPY python/requirements.txt ./python/requirements.txt
# RUN pip3 install -r python/requirements.txt

###
# Runtime stage: small image but includes Python 3 for your script
###
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install Python runtime for your spawned script
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      python3 \
      python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Copy built app + node_modules from the build stage
COPY --from=build /app /app

# (Optional) If you need Python deps at runtime, and you didn't install them in build:
# RUN if [ -f python/requirements.txt ]; then pip3 install -r python/requirements.txt; fi


# Load the ML file for 
RUN pip install -r ml_model/requirements_api.txt

RUN gunicorn -c ml_model/gunicorn_config.py ml_api:app


# Render provides $PORT; make sure your app uses it.
ENV PORT=8080

# Expose is informational; Render maps ports automatically.
EXPOSE 8080

# Start with node (not nodemon)
# If your package.json has "start": "node index.js", you can use ["npm","start"] instead.
CMD ["node", "index.js"]
