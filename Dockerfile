# production image for VPS (Caddy → host :3020)
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV VITE_ENABLE_REMOTE_AUTH=false
RUN npm run build:node

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3020
ENV BIND_HOST=127.0.0.1
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3020
CMD ["node", "dist/server.cjs"]
