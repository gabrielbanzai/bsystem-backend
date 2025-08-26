FROM node:lts-alpine

# Instala bash, MySQL client e Python para build tools
RUN apk add --no-cache bash mysql-client python3 make g++

WORKDIR /app

# Copia arquivos de dependências
COPY package.json yarn.lock ./
RUN yarn install

# Copia o restante do projeto
COPY . .

# Faz o build da aplicação AdonisJS (cria /build como pasta irmã)
RUN node ace build --production

# Copia o package.json para a pasta build
RUN cp package.json ../build/

# Muda para pasta build (pasta irmã, não filha)
WORKDIR /build

# Instala apenas dependências de produção
RUN yarn install --production

# Ajusta permissões nas pastas public e uploads que já existem na build
RUN chmod -R g+rwX public && \
    chown -R node:node public

# Script para criar o DB, rodar migrations e seeds
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expõe porta da API
EXPOSE 3001

# Inicia entrypoint
CMD ["/entrypoint.sh"]