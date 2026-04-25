# Stage 1: Build the React Application
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# Accept the backend URL from Coolify during build
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
# Fix for Node 18 hashing error
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine
# Copy the build output to replace the default nginx contents
COPY --from=build /app/build /usr/share/nginx/html

# We need to add a custom nginx conf to route all 404s back to index.html for React Router
RUN echo $'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
