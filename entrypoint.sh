#!/bin/bash
set -e

# Cria o banco de dados se não existir
echo "Criando database ${MYSQL_DB_NAME} se não existir..."
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  --default-auth=mysql_native_password \
  --ssl=0 \
  -e "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DB_NAME\`;"

# Já estamos na pasta /build

# Roda migrations e AGUARDA terminar
echo "Rodando migrations..."
node ace migration:run --force

# Aguardar um pouco extra para garantir que terminou
echo "Aguardando migrations completarem..."
sleep 3

# Verificar se tabelas foram criadas antes de rodar seeders
echo "Verificando se migrations completaram..."
TABLE_CHECK=$(mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  --default-auth=mysql_native_password --ssl=0 \
  -D "$MYSQL_DB_NAME" -e "SHOW TABLES LIKE 'users';" | wc -l)

if [ "$TABLE_CHECK" -gt "1" ]; then
  echo "✅ Migrations completadas! Rodando seeders..."
  node ace db:seed
else
  echo "❌ Tabelas não foram criadas. Pulando seeders."
fi

# Inicia a API diretamente do arquivo compilado
echo "Iniciando servidor da pasta build..."
node server.js