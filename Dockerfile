FROM node:lts-alpine

# Instala bash e ferramentas básicas
RUN apk add --no-cache bash

WORKDIR /app

# Copia apenas os arquivos de dependência
COPY package.json yarn.lock ./
RUN yarn install

# Copia o restante do projeto, exceto public/uploads
COPY . .

# Garante que a pasta uploads exista, se não existir, e ajusta permissões
RUN if [ ! -d /app/public/uploads ]; then \
      mkdir -p /app/public/uploads; \
    fi && \
    chmod -R g+rwX /app/public/uploads && \
    chown -R node:node /app/public/uploads

EXPOSE 3333

# Inicia o servidor
CMD ["yarn", "start"]