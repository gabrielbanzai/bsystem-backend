# Etapa base com Node.js
FROM node:18-alpine

# Define diretório de trabalho
WORKDIR /app

# Copia apenas os arquivos de dependência e instala
COPY package*.json ./
RUN npm install --production

# Copia o restante do código da aplicação
COPY . .

# Expõe a porta padrão do AdonisJS
EXPOSE 3330

# Comando de start (ajuste se estiver usando outro método)
CMD ["node", "server.js"]
