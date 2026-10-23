# Vite dev-сервер для локальной разработки и курса (hot-reload через volumes).
FROM node:24-alpine

WORKDIR /app

# wget нужен для healthcheck
RUN apk add --no-cache wget

COPY package.json package-lock.json* ./
# Явно фиксируем публичный registry, чтобы сборка не зависела
# от локальных .npmrc с приватными зеркалами.
RUN npm config set registry https://registry.npmjs.org/ && npm ci

COPY index.html vite.config.ts tsconfig.json ./
COPY src ./src

EXPOSE 5173

CMD ["npm", "run", "dev"]
