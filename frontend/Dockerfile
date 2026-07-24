# Stage 1: Build React static assets
FROM node:20-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Default API endpoint (Vite replaces this during build)
ENV VITE_API_URL=http://localhost:8000
RUN npm run build

# Stage 2: Serve React build using Nginx
FROM nginx:alpine

# Copy nginx config for single page app routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to Nginx html directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
