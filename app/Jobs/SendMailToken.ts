import Mail from '@ioc:Adonis/Addons/Mail'
import { JobContract } from '@ioc:Rocketseat/Bull'

export default class SendMailToken implements JobContract {
  public key = 'EC-SendMailToken'

  public async handle(job) {
    const { data } = job; // the 'data' variable has user data

    await Mail.send((message) => {
      message
        .from('suporte@omegainformaticapa.com.br')
        .to(data.email)
        .subject('Novo código de Verificação EasyCOM')
        .htmlView('emails/mailtoken', { code: data.code })
    })

    return data;
  }
}
