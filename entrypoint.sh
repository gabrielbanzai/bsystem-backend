#!/bin/bash
set -e

# Cria o banco de dados se não existir
echo "Criando database ${MYSQL_DB_NAME} se não existir..."
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  --default-auth=mysql_native_password \
  --ssl=0 \
  -e "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DB_NAME\`;"

# Já estamos na pasta /build
echo "Rodando migrations..."
node ace migration:run --force

# Aguardar um pouco extra para garantir que terminou
sleep 3

# Verifica se já rodou seeds
SEED_MARKER="/.seeded"  # <- fora da pasta build
if [ ! -f "$SEED_MARKER" ]; then
    echo "✅ Rodando seeders pela primeira vez..."
    
    # Executa os seeders
    node ace db:seed

    # Cria arquivo de marcação fora da build para não rodar novamente
    touch "$SEED_MARKER"
else
    echo "⚠️ Seeds já foram aplicadas anteriormente. Pulando..."
fi

# Inicia a API diretamente do arquivo compilado
echo "Iniciando servidor da pasta build..."
node server.js
