#!/bin/bash
set -e

# Cria o banco de dados se não existir
echo "Criando database ${DB_NAME} se não existir..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`;"

# Roda migrations
echo "Rodando migrations..."
node ace migration:run

# Roda seeders somente se a tabela _seeds estiver vazia
SEED_CHECK=$(node -e "
const Database = require('@adonisjs/lucid/build/src/Database').Database
Database.connection()
  .from('_seeds')
  .count('* as total')
  .then(res => console.log(res[0].total))
  .finally(() => Database.manager.closeAll())
")
if [ "$SEED_CHECK" -eq "0" ]; then
  echo "Rodando seeders..."
  node ace db:seed
else
  echo "Seeders já rodados, pulando..."
fi

# Inicia a API
echo "Iniciando servidor..."
yarn start
