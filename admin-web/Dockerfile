FROM node:22-alpine AS build
WORKDIR /src
COPY admin-web/package*.json ./
RUN npm ci
COPY admin-web/. .
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /src/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
