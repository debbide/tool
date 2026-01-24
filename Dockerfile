FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Copy source code
COPY index.js ./
COPY config_manager.js ./

# Create data directory and set permissions to avoid EACCES errors
# We set ownership of the entire /app directory to the 'node' user
RUN mkdir -p /app/data/bin && \
    mkdir -p /app/data/logs && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Expose necessary ports (adjust if needed, based on config defaults)
# 3097 is default app port, 8001 is default tunnel port
EXPOSE 3097 8001

# Define volume for persistent data
VOLUME ["/app/data"]

# Start command
CMD ["node", "index.js"]
