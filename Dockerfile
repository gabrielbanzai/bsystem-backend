FROM node:lts-alpine

# Instala bash, MySQL client e ferramentas básicas
RUN apk add --no-cache bash mysql-client

WORKDIR /app

# Copia arquivos de dependências
COPY package.json yarn.lock ./
RUN yarn install

# Copia o restante do projeto, exceto public/uploads
COPY . .

# Cria pasta public e uploads somente se não existirem
RUN if [ ! -d /app/public ]; then \
      mkdir -p /app/public/uploads; \
    fi && \
    chmod -R g+rwX /app/public && \
    chown -R node:node /app/public

# Script para criar o DB, rodar migrations e seeds
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expõe porta da API
EXPOSE 3001

# Inicia entrypoint
CMD ["/entrypoint.sh"]