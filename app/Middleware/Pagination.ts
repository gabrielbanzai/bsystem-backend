import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class PaginationMiddleware {
  /**
   * Handle request
   */
  public async handle(ctx: HttpContextContract, next: () => Promise<void>) {

    if(ctx.request.method() === 'GET'){
        const page = parseInt(ctx.request.input('page'))
        const limit = parseInt(ctx.request.input('limit'))

        //Atribuir os valores para a propriedade pagination
        ctx.pagination = {
            page, limit
        }

        //Se for enviado perpage no lugar de limit, tratar para que seja substituida
        const perpage = parseInt(ctx.request.input('perpage'))

        if(perpage){
            ctx.pagination.limit = perpage
        }

        if(!page){
            ctx.pagination.page = 1
        }

        if(!limit){
            ctx.pagination.limit = 20
        }
    }

    await next()
  }
}
