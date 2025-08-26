#!/bin/bash
set -e

# Cria o banco de dados se não existir
echo "Criando database ${MYSQL_DB_NAME} se não existir..."
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  --default-auth=mysql_native_password \
  --ssl=0 \
  -e "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DB_NAME\`;"

# Roda migrations
echo "Rodando migrations..."
node ace migration:run

# Verificação de seeders corrigida
echo "Verificando seeders..."
SEED_CHECK=$(node -pe "
const Database = require('@ioc:Adonis/Lucid/Database')
Database.from('adonis_schema_versions').select('*').then(r => r.length).catch(() => 0)
" 2>/dev/null || echo "0")

if [ "$SEED_CHECK" -eq "0" ] || [ "$SEED_CHECK" = "0" ]; then
  echo "Rodando seeders..."
  node ace db:seed
else
  echo "Database já tem dados, pulando seeders..."
fi

# Inicia a API
echo "Iniciando servidor..."
yarn start