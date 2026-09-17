FROM node:24.20.0-slim AS build
WORKDIR /app
ARG VITE_API_BASE=/focus/api
ENV VITE_API_BASE=$VITE_API_BASE
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html/focus
EXPOSE 80
