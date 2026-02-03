FROM node:lts as build

# Install Deno
RUN apt-get update && \
    apt-get install -y curl unzip && \
    curl -fsSL https://deno.land/x/install/install.sh | sh && \
    ln -s /root/.deno/bin/deno /usr/local/bin/deno

WORKDIR /app
RUN deno --version
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2
FROM node:lts as prod

# Install Deno
RUN apt-get update && \
    apt-get install -y curl unzip && \
    curl -fsSL https://deno.land/x/install/install.sh | sh && \
    ln -s /root/.deno/bin/deno /usr/local/bin/deno && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup -d /app appuser

WORKDIR /app
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/package.json ./
COPY --from=build --chown=appuser:appgroup /app/dist ./dist

# Switch to non-root user
USER appuser

EXPOSE 3000
CMD [ "npm", "run", "preview" ]