## Primeiro Passo

###   Gerar uma chave SSH da sua máquina.
    1.  Acessar um terminal.
    2.  comando> ssh-keygen.
    3.  Acessar a chave pública ~/user/.ssh/chave.pub
    4.  Copiar o conteúdo da chave e registrar na Digital Ocean.

###   Criando e configurando o Droplet
    -   Acessar Droplet via terminal: > ssh root@(IP DO SERVER) (de yes pra tudo)

####    Adicionando usuário deploy
    -   Dentro do Droplet via terminal, digite: adduser deploy.
    -   Colocando permissões de sudo para o usuário deploy: usermod -aG sudo deploy
    -   Criar o diretório: /home/deploy/.ssh
    -   Copiar o arquivo authorized_keys: cp ~/.ssh/authorized_keys /home/deploy/.ssh/
    -   Permissão para o arquivo authorized_keys: chmod 600 authorized_keys ; em /home/deploy/.ssh
    -   Voltar na pasta /home/deploy e dar a permissão: chmod 700 .ssh/
    -   Trocar propriedade do diretório .ssh/ e subsequentes: chown -R deploy:deploy .ssh/
    -   Acesse a partir daqui para uso do servidor da seguinte forma: ssh deploy@(IP DO SERVER), acessando como root apenas para manutenção do Droplet.

####    Atualizando Servidor
    -   apt update e apt upgrade para atualizar as dependências do Linux.
    -   Instalando NodeJS: sudo apt install nodejs
    -   Instalando NPM: sudo apt install npm
    -   Instalando Yarn: npm install --global yarn
    -   Instalando Docker: apt install docker.io
    -   Adicionando permissões do usuário deplou para o docker: usermod -aG docker deploy (A partir daqui já pode-se usar somente o usuário deploy)

# SENHA Root MYSQL: bbdb38fef241d929e601d4e956010d59
# SENHA USUARIO DEPLOY (MYSQL): 952730d1edd4a89d8f0ce068238e064e

####    Configurando Ambiente 
#####   Instalando Mysql
    -   Instalando Mysql no Docker: docker run --name mysql -e MYSQL_ROOT_PASSWORD=bbdb38fef241d929e601d4e956010d59 -p 33306:3306 -d mysql:5.7
    -   Acessar o Mysql: docker exec -it mysql bash
    -   Acessar terminal Mysql: mysql -uroot -p
    -   Criar usuário deploy: CREATE USER 'deploy' IDENTIFIED BY '952730d1edd4a89d8f0ce068238e064e';
    -   Criar banco de dados da aplicação: CREATE DATABASE easycom COLLATE utf8_general_ci;
    -   Passar privilégios para usuário: GRANT ALL PRIVILEGES ON easycom .* TO 'deploy';

#####   Instalando Redis
    -   Instalando Redis no Docker: docker run --name redis -e REDIS_PASSWORD=Omg@1234Info -p 36379:6379 -d bitnami/redis:latest

#####   Ambiente e Aplicação
    -   Criar diretório ~/app/server
    -   Baixar aplicação dentro da pasta server

#####   Instalando PM2
    -   yarn global add pm2
    -   yarn global bin
    -   sudo vim ~/.bashrc
    -   Adicionar ao final do arquivo: export PATH="$(yarn global bin):$PATH"
    -   source ~/.bashrc
    -   Startando um Projeto: pm2 start (path para o executavel) --name nome-porta
    -   pm2 list para verificar os apps em execução
    -   pm2 logs
    -   pm2 monit
    -   pm2 save
    -   pm2 startup ubuntu -u deploy (sudo env PATH=$PATH:/usr/bin pm2 startup ubuntu -u deploy --hp /home/deploy)

#####   NGINX
    -   sudo su root
    -   cd /etc/nginx/sites-available
    -   cd /etc/nginx/sites-enabled
    -   service nginx restart

    Omg@1234Info

    ng build --base-href ./ --configuration=production
    ng build --base-href ./ --configuration=development

server {
  server_name servertsk.bzapi.shop;

  location / {
    proxy_pass http://148.110.224.148:3333;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
  }
}

server {
  location /ws/ {
    proxy_pass http://143.110.224.148:3333;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
  }
}

### BUILD

Depois de realizar a build, se atente a algumas operações que temos que realizar:

  - copiar e preencher o .env para pasta da build:  sudo cp .env ./build/.env
  - criar os diretórios public/uploads: sudo mkdir ./build | cd ./build | sudo mkdir public
  - dar permissões para o usuário deploy: sudo chown -R deploy:deploy ./build/public

### Duvidas
  - Validade do produto entra onde
  - custo, custo medio, margem de lucro dos produtos são calculados ou salvos?
  - saldo, pedido de venda, disponível, saldo total - o que representa cada um.

