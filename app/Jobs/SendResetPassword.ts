import Mail from '@ioc:Adonis/Addons/Mail'
import { JobContract } from '@ioc:Rocketseat/Bull'

export default class SendResetPassword implements JobContract {
  public key = 'EC-SendResetPassword'

  public async handle(job) {
    const {data} = job; // the 'data' variable has user data

    await Mail.send((message) => {
      message
        .from('suporte@omegainformaticapa.com.br')
        .to(data.user.email)
        .subject('Novo código de Verificação EasyCOM')
        .htmlView('emails/resetpassword', { password: data.newPass })
    })

    return data;
  }
}
