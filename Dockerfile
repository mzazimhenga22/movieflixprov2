# Dockerfile - Debian-based image with Chromium libs for Puppeteer
FROM node:22-bullseye-slim

# Install system deps required by Chromium / Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libc6 \
    libcairo2 \
    libdbus-1-3 \
    libexpat1 \
    libgbm1 \
    libgcc1 \
    libgconf-2-4 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libsecret-1-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxshmfence1 \
    lsb-release \
    wget \
    gnupg \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# copy package manifests first for better caching
COPY package.json package-lock.json* ./

# Install dependencies (including dev deps if you want browsers installed)
# If you rely on devDependencies for build tools, include them:
RUN npm ci --include=dev

# Copy rest of the repo
COPY . .

# Build the project
RUN npm run build

# Set NODE_ENV=production for runtime
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Use the built output
CMD ["node", "dist/server.js"]
