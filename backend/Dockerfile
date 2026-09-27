# Node 24, dev-запуск через ts-node-dev, прод — скомпилированный dist.
FROM node:24-alpine

WORKDIR /app

# OpenSSL нужен Prisma query engine (libssl) + wget для healthcheck
RUN apk add --no-cache openssl wget

# Ставим зависимости отдельно для кэширования слоя
COPY package.json package-lock.json* ./
RUN npm install

# Prisma-схема нужна для генерации клиента
COPY prisma ./prisma
RUN npx prisma generate

# Исходники и TS-конфиг
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 4000

# При старте применяем миграции, сеем товары и запускаем сервер.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/seed.js ; node dist/index.js"]
