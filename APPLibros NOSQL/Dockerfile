# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependencias y el esquema de Prisma primero
COPY package*.json ./
COPY prisma ./prisma

# Instalar dependencias (esto ejecuta postinstall con prisma generate)
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Crear el build de Next.js
RUN npm run build

# Stage 2: Producción
FROM node:20-alpine
WORKDIR /app

# Copiar solo lo necesario desde el builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./


# Variables de entorno
ENV DATABASE_URL=${DATABASE_URL}

EXPOSE 3000
CMD ["npm", "start"]
