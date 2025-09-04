FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY automation.js .
COPY .env.example .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S automation -u 1001
USER automation

# Expose any ports if needed (none required for this app)
# EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check: OK')" || exit 1

# Start the application
CMD ["node", "automation.js"]