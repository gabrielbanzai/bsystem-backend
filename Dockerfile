FROM node:lts-alpine

# Instala bash, MySQL client e ferramentas de build
RUN apk add --no-cache bash mysql-client python3 make g++

# Copia todo o código fonte para a raiz
WORKDIR /
COPY . .

# Instala dependências do projeto
RUN yarn install

# Gera a build do AdonisJS (vai criar /build na raiz)
RUN node ace build --production

# Vai para a pasta build
WORKDIR /build

# Copia package.json da raiz para /build
COPY package.json /build/

# Instala apenas dependências de produção na build
RUN yarn install --production

# Ajusta permissões na pasta public
RUN chmod -R g+rwX public && chown -R node:node public

# Copia entrypoint e dá permissão
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expõe a porta da API
EXPOSE 3001

# Inicia o entrypoint
CMD ["/entrypoint.sh"]
