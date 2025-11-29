FROM node:20-alpine

WORKDIR /app

# Copiar package.json primero (mejor caché)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código
COPY . .

# Build de producción
RUN npm run build

# Puerto
EXPOSE 3000

# Comando para ejecutar
CMD ["npm", "start"]