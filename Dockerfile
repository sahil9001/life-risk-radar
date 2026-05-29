FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies (curl, tar, ca-certificates, gnupg) and Node.js 20
RUN apt-get update && apt-get install -y curl tar ca-certificates gnupg && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

# Download and install the Linux x86_64 Coral binary (v0.2.1, matching local project spec)
RUN curl -L https://github.com/withcoral/coral/releases/download/v0.2.1/coral-x86_64-unknown-linux-gnu.tar.gz \
    | tar -xz && mv coral /usr/local/bin/coral && chmod +x /usr/local/bin/coral

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Generate the seeded JSONL data
RUN npm run seed:local

# Build the Next.js application
RUN npm run build

# Make the start script executable
RUN chmod +x start.sh

# Expose the default port (Railway will set PORT env var, but default to 3000)
EXPOSE 3000

# Execute runtime start script
CMD ["bash", "start.sh"]
