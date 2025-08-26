#!/bin/bash
set -e

# Cria o banco de dados se não existir
echo "Criando database ${MYSQL_DB_NAME} se não existir..."
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u root -p"$MYSQL_ROOT_PASSWORD" \
  --ssl=0 \
  -e "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DB_NAME\`; 
      GRANT ALL PRIVILEGES ON \`$MYSQL_DB_NAME\`.* TO '$MYSQL_USER'@'%'; 
      FLUSH PRIVILEGES;"

echo "Rodando migrations..."
node ace migration:run

# CORREÇÃO: Verificar seeders de forma mais simples
echo "Verificando se seeders já foram executados..."
SEED_COUNT=$(node ace db:seed --show 2>/dev/null | wc -l || echo "0")

if [ "$SEED_COUNT" -eq "0" ]; then
  echo "Rodando seeders..."
  node ace db:seed
else
  echo "Seeders já executados, pulando..."
fi

echo "Iniciando servidor..."
yarn start