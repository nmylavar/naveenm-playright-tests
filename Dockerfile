# Playwright official image: Node + Chromium/Firefox/WebKit and system deps.
# Use a tag that matches your @playwright/test version (e.g. v1.49.0-noble).
FROM mcr.microsoft.com/playwright:v1.49.0-noble

WORKDIR /app

# Install app dependencies (no dev deps in prod image; keep for tests).
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and config (excluding paths in .dockerignore).
COPY . .

# Optional: install Playwright browsers if image doesn't match version.
# RUN npx playwright install --with-deps chromium

# Default: run all tests. Override with docker run ... npm test -- <args>
CMD ["npx", "playwright", "test"]
