# Vite dev-сервер для локальной разработки и курса (hot-reload через volumes).
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY index.html vite.config.ts tsconfig.json ./
COPY src ./src

EXPOSE 5173

CMD ["npm", "run", "dev"]
