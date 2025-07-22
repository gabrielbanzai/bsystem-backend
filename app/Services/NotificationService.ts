import Redis from '@ioc:Adonis/Addons/Redis'
import { str_random } from 'App/Helpers';
import { format } from 'date-fns';

class NotificationService {
  // Armazenar a notificação no Redis
  public async storeNotification(userId: string, data: any) {
    const channel = `notifications:${userId}`
    let id = await str_random(10)
    await Redis.rpush(channel, JSON.stringify({...data, id, created_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss')}));
    let notifications = await this.getNotifications(userId)
    await Redis.publish(channel, JSON.stringify(notifications));

  }

  // Recuperar notificações do Redis para um usuário específico
  public async getNotifications(userId: string) {

    //await Redis.del(`notifications:${userId}`);

    const channel = `notifications:${userId}`
    const notifications = await Redis.lrange(channel, 0, -1);
    let nots = notifications.map((notification) => JSON.parse(notification));

    let result = nots.filter(x => x.read == "false")

    return result
  }
}

export default NotificationService;
