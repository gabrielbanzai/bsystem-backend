#!/bin/bash
set -e

# 1. Usar ROOT para criar database e conceder permissões ao deploy
echo "Configurando database ${MYSQL_DB_NAME}..."
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u root -p"$MYSQL_ROOT_PASSWORD" \
  --ssl=0 \
  -e "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DB_NAME\`; 
      GRANT ALL PRIVILEGES ON \`$MYSQL_DB_NAME\`.* TO '$MYSQL_USER'@'%'; 
      FLUSH PRIVILEGES;"

echo "✅ Database criado e permissões concedidas!"

# 2. Roda migrations (agora com usuário deploy que já tem permissão)
echo "Rodando migrations..."
node ace migration:run

# 3. Roda seeders somente se a tabela _seeds estiver vazia
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

# 4. Inicia a API
echo "Iniciando servidor..."
yarn start