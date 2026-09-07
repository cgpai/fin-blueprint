# production image for VPS (Caddy → host :3020)
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Same-origin Postgres state API (replaces Google Sheets)
ARG VITE_SHEETS_ENDPOINT=/api/state
ARG VITE_STATE_API_TOKEN=
ENV VITE_SHEETS_ENDPOINT=$VITE_SHEETS_ENDPOINT
ENV VITE_STATE_API_TOKEN=$VITE_STATE_API_TOKEN
ENV VITE_ENABLE_REMOTE_AUTH=false
RUN npm run build:node

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3020
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3020
CMD ["node", "dist/server.cjs"]
