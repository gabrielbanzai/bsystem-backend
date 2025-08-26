#!/bin/bash
set -e

# Cria o banco de dados se não existir
echo "Criando database ${MYSQL_DB_NAME} se não existir..."
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  --default-auth=mysql_native_password \
  --ssl=0 \
  -e "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DB_NAME\`;"

# Já estamos na pasta /build

# Roda migrations e aguarda terminar
echo "Rodando migrations..."
node ace migration:run --force

echo "Migrations concluídas ✅"

# Inicia a API diretamente do arquivo compilado
echo "Iniciando servidor da pasta build..."
node server.js
