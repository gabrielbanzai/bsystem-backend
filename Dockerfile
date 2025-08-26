FROM node:lts-alpine

# Instala bash, MySQL client e Python para build tools
RUN apk add --no-cache bash mysql-client python3 make g++

WORKDIR /app

# Copia arquivos de dependências
COPY package.json yarn.lock ./
RUN yarn install

# Copia o restante do projeto
COPY . .

# Faz o build da aplicação AdonisJS
RUN node ace build --production

# Copia o package.json para a pasta build
RUN cp package.json build/

# Vai para pasta build e instala apenas dependências de produção
WORKDIR /app/build
RUN yarn install --production

# Volta para pasta raiz para configurações finais
WORKDIR /app

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