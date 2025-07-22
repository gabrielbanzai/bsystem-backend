import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Bull from '@ioc:Rocketseat/Bull'
import Job from 'App/Jobs/SendMailToken'
import MailToken from 'App/Models/MailToken'
import User from 'App/Models/User'
import AuthService from 'App/Services/AuthService'
import LoginValidator from 'App/Validators/LoginValidator'
import { addMinutes, addSeconds, format } from 'date-fns'

export default class AuthController {
  async login({ request, response, auth }: HttpContextContract) {

    const { email, password } = await request.validate(LoginValidator)

    const service = new AuthService()

    try {
      let user: any | null = await User.findBy('email', email)
      await service.loginAttempt(email, password, auth)

      let token = await auth.use('api').generate(user, {
          expiresIn: '10h', // Define a expiração do token
      })

      if(user.position_id){
        await user.load('position')
      }
      if(user.department_id){
        await user.load('department')
      }

      user.password = null

      let permissions: any[] = await service.loadUserPermissions(user)

      return response.status(200).send({token, user, permissions})
    } catch (error) {
      throw error
    }

  }

  async logout({ request, response }: HttpContextContract) {

    try {

      const { user_id } = request.all()

      let user: any | null = await User.query().where('id', user_id)

      if(user){
        await Database.query().from('api_tokens').where('user_id', user_id).delete()
      }

      return response.send({})

    } catch (error) {
      throw error
    }
  }

  async requestPassword({ request, response }: HttpContextContract) {

    const { email } = await request.all()

    let user = await User.findBy('email', email)

    if(!user){
      return response.status(404).send({
        message: 'Não foi possível encontrar o usuário com o e-mail informado.'
      })
    }

    try {
      //Verificando existência de tokens
      let tokenCheck = await MailToken.findBy('email', email)

      if(tokenCheck){

        let expires_at = new Date(tokenCheck.expires_at)
        let now = new Date()

        //Existe um token criado e está dentro da validade
        if(now < expires_at){
          return response.status(208).send({
            message: 'Há uma solicitação em andamento, por favor, verifique seu email na caixa de SPAM.'
          })
        //Token Expirado será excluído
        }else{
          await tokenCheck.delete()
        }

      }

      //Gerando o código
      let code = '';

      for (let i = 0; i < 8; i++) {
        code += Math.floor(Math.random() * 10); // Gera um número de 0 a 9
      }

      //Gerando o novo token
      let token = await MailToken.create({code, email, expires_at: format(addMinutes(new Date(), 10), 'yyyy-MM-dd HH:mm:ss')})

      if(token){

        await Bull.schedule(new Job().key, {code, email}, addSeconds(new Date(), 10), { removeOnComplete: true })

        return response.send({})
      }
    } catch (error) {
      throw error
    }

  }

  async validateRequestPassword({ request, response }: HttpContextContract) {

    const { email, code } = await request.all()

    let user = await User.findBy('email', email)

    if(!user){
      return response.status(404).send({
        message: 'Não foi possível encontrar o usuário com o e-mail informado.'
      })
    }

    try {
      let token = await MailToken.findBy('email', email)

      if(!token){
        return response.status(400).send({
          message: 'Token inválido.'
        })
      }

      let expires_at = new Date(token.expires_at)
      let now = new Date()

      if(token.code == code && (now < expires_at)){
        return response.status(200).send({})
      }else{
        await token.delete()
        return response.status(400).send({
          message: 'Token inválido.'
        })
      }
    } catch (error) {
      throw error
    }

  }

  async changePassword({ request, response }: HttpContextContract) {
    const { email, code, password } = await request.all()

    let user = await User.findBy('email', email)

    if(!user){
      return response.status(404).send({
        message: 'Não foi possível encontrar o usuário com o e-mail informado.'
      })
    }

    let token = await MailToken.findBy('email', email)

    if(!token || (token.code != code)){
      if(token){
        await token.delete()
      }
      return response.status(404).send({
        message: 'Ocorreu um erro ao processar a sua solicitação'
      })
    }

    try {

      user.merge({
        password
      })

      await user.save()

      await token.delete()

      return response.send({})

    } catch (error) {
      throw error
    }
  }

}
