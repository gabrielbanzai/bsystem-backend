FROM node:18-alpine

# Instala bash e utilitários
RUN apk add --no-cache bash

WORKDIR /app

# Copia apenas os arquivos de dependência e instala com Yarn
COPY package.json yarn.lock ./
RUN yarn install

# Copia o restante do projeto (inclusive public, se quiser, ou ignora com .dockerignore)
COPY . .

# Garante que a pasta public/uploads exista e tenha as permissões corretas
RUN mkdir -p /app/public/uploads && \
    chown -R node:node /app/public/uploads && \
    chmod -R 775 /app/public/uploads

# Builda o projeto e executa migrations e seeders
RUN yarn build && \
    node ace migration:run --force && \
    node ace db:seed --force

# Expõe a porta do AdonisJS
EXPOSE 3330

# Start da aplicação
CMD ["node", "server.js"]
