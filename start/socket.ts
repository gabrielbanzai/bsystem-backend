import Redis from '@ioc:Adonis/Addons/Redis';
import NotificationService from 'App/Services/NotificationService';
import Ws from 'App/Services/Ws';
import { format } from 'date-fns';

Ws.boot();

const serverIo = Ws.wss;

serverIo.on('connection', async function connection(ws, req) {
  //await Redis.del(`notifications:1`)
  const notServ: NotificationService = new NotificationService()
  const urlParams = req.url.replace('/?','').split('=');
  const userId = urlParams[1] ? urlParams[1] : ''
  //console.log(`User ${userId} connected`);

  if (userId) {
    //Registrar o usuário como Online
    const statusChannel = `user:${userId}`
    await Redis.rpush(statusChannel, JSON.stringify({user_id: userId, online_since: format(new Date(), 'yyyy-MM-dd HH:mm:ss')}));

    // Criar um canal exclusivo para este usuário
    const channel = `notifications:${userId}`;

    // Subscrever ao canal do Redis
    Redis.subscribe(channel, async (message) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });

    //Enviando notificações pendentes
    let notificationsPending: any[] = []
    notificationsPending = await notServ.getNotifications(userId)
    if(notificationsPending && notificationsPending.length > 0){
      await Redis.publish(channel, JSON.stringify(notificationsPending));
    }

    // console.log(`Usuário autenticado: ${userId} no canal ${channel}`);

    ws.on('close', async function () {
      //console.log(`User ${userId} disconnected`);
      await Redis.del(statusChannel);
      await Redis.unsubscribe(channel);
    });
  } else {
    ws.send('Erro: Usuário inválido');
    ws.close();
    return;
  }

});
