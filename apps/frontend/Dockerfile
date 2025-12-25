FROM node:22-alpine

# Install Bun
RUN npm install -g bun

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build
RUN bun run build

# Expose port
EXPOSE 3000

# Start
CMD ["bun", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
