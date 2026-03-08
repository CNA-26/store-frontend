# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Vite reads VITE_* variables at build time, so expose BuildConfig args here.
ARG VITE_ORDER_API_URL=https://order-service-git-order-service.2.rahtiapp.fi/
ARG VITE_ORDER_API_KEY
ENV VITE_ORDER_API_URL=${VITE_ORDER_API_URL}
ENV VITE_ORDER_API_KEY=${VITE_ORDER_API_KEY}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# List contents to verify build (for debugging)
RUN echo "===== Contents of /app/dist: =====" && \
    ls -la /app/dist && \
    echo "===== Files in dist: =====" && \
    find /app/dist -type f

# Production stage
FROM nginx:alpine

# Copy custom nginx config (replace main config)
COPY nginx.conf /etc/nginx/nginx.conf

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create temp directories for nginx (required for OpenShift)
RUN mkdir -p /tmp/client_temp /tmp/proxy_temp_path /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && \
    chmod -R 777 /tmp && \
    chmod -R 777 /var/log/nginx && \
    chmod -R 777 /var/cache/nginx && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:0 /usr/share/nginx/html && \
    chmod -R g+rwX /usr/share/nginx/html /var/log/nginx /var/cache/nginx

# List contents to verify copy (for debugging)
RUN ls -la /usr/share/nginx/html

# Verify index.html exists
RUN test -f /usr/share/nginx/html/index.html && echo "index.html found!" || echo "ERROR: index.html NOT found!"

# nginx runs on port 8080 in OpenShift
EXPOSE 8080

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
