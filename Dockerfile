# Usa a imagem oficial Node.js LTS (Gallium) baseada em Alpine
FROM node:lts-alpine

# Instala bash e utilitários de sistema
RUN apk add --no-cache bash

# Define o diretório de trabalho da aplicação
WORKDIR /app

# Copia os arquivos de dependências e instala com Yarn
COPY package.json yarn.lock ./
RUN yarn install

# Copia o restante do projeto
COPY . .

# Garante que a pasta public/uploads exista e tenha permissões adequadas
RUN mkdir -p /app/public/uploads && \
    chown -R node:node /app/public/uploads && \
    chmod -R 775 /app/public/uploads

# Compila o projeto, roda migrations e seeders
RUN yarn build && \
    node ace migration:run --force && \
    node ace db:seed --force

# Expõe a porta usada pelo AdonisJS
EXPOSE 3330

# Comando de inicialização
CMD ["node", "server.js"]
