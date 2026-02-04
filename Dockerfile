FROM node:lts as build

# Install Deno to /usr/local/bin
RUN apt-get update && \
    apt-get install -y curl unzip && \
    curl -fsSL https://deno.land/x/install/install.sh | DENO_INSTALL=/usr/local sh

WORKDIR /app
RUN deno --version
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2
FROM node:lts as prod

# Install Deno to /usr/local/bin (accessible by all users)
RUN apt-get update && \
    apt-get install -y curl unzip && \
    curl -fsSL https://deno.land/x/install/install.sh | DENO_INSTALL=/usr/local sh && \
    chmod +x /usr/local/bin/deno && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create non-root user with specific UID and create app directory
RUN groupadd -r -g 1001 appgroup && \
    useradd -r -u 1001 -g appgroup -d /app appuser && \
    mkdir -p /app && \
    chown -R 1001:1001 /app

WORKDIR /app

# Set deno cache dir
ENV DENO_DIR=/app/.cache/deno

# Copy files with correct ownership
COPY --from=build --chown=1001:1001 /app/node_modules ./node_modules
COPY --from=build --chown=1001:1001 /app/package.json ./
COPY --from=build --chown=1001:1001 /app/dist ./dist

# Switch to non-root user
USER 1001

EXPOSE 3000
CMD [ "npm", "run", "preview" ]
