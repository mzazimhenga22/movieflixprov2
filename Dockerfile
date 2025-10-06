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

WORKDIR /usr/src/app

# 1) Copy package manifests first (keeps npm install cached if package.json unchanged)
COPY package.json package-lock.json* ./

# 2) Copy providers sources needed by postinstall/build BEFORE running npm ci
#    This ensures `npx tsc -p src/providers/tsconfig.json` can find the tsconfig and sources.
#    Copying only providers keeps the layer small.
COPY src/providers ./src/providers

# 3) Install all deps (including dev if desired)
RUN npm ci --include=dev

# 4) Now copy the rest of the repository (app sources, scripts, etc.)
COPY . .

# 5) Run build (this will run providers:build as defined in package.json)
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/server.js"]
