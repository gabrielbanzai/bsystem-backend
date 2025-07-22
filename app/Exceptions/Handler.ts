/*
|--------------------------------------------------------------------------
| Http Exception Handler
|--------------------------------------------------------------------------
|
| AdonisJs will forward all exceptions occurred during an HTTP request to
| the following class. You can learn more about exception handling by
| reading docs.
|
| The exception handler extends a base `HttpExceptionHandler` which is not
| mandatory, however it can do lot of heavy lifting to handle the errors
| properly.
|
*/

import Logger from '@ioc:Adonis/Core/Logger'
import HttpExceptionHandler from '@ioc:Adonis/Core/HttpExceptionHandler'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ExceptionHandler extends HttpExceptionHandler {
  constructor () {
    super(Logger)
  }

  public async handle(error: any, ctx: HttpContextContract) {
    /**
     * Self handle the validation exception
     */
    if (error.status == 422) {
      return ctx.response.status(422).send(
        {
          status: error.status,
          code: error.code,
          messages: error.messages.errors.map(({message}) => message)
        }
      )
    }

    if (error.status == 404) {
      return ctx.response.status(404).send(
        {
          status: error.status,
          code: error.code,
          messages: [error.message]
        }
      )
    }

    if(error.code === 'E_INVALID_TOKEN') {
      return ctx.response.status(403).send({
        status: error.status,
        code: 'E_INVALID_TOKEN',
        messages: ['Sessão expirada ou inexistente.']
      })
    }

    if(error.code === 'E_INVALID_AUTH_PASSWORD') {
      return ctx.response.status(401).send({
        status: error.status,
        code: 'E_INVALID_AUTH_PASSWORD',
        messages: ['Não foi possível acessar o sistema com as credenciais informadas.']
      })
    }

    if(error.status == 500){
      if(error.message){
        return ctx.response.status(500).send({
          status: error.status,
          code: error.code || 'UNKNOWN ERROR',
          messages: [error.message ? error.message : error.error.message]
        })
      }
    }

    if(!error.status){
      return ctx.response.status(500).send({
        status: 500,
        code: 'UNKNOWN_ERROR',
        messages: [error.message]
      })
    }

    /**
     * Forward rest of the exceptions to the parent class
     */
    return super.handle(error, ctx)
  }
}
