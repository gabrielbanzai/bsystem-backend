//import Redis from '@ioc:Adonis/Addons/Redis'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
export default class DashboardController {

  async index(ctx: HttpContextContract) {
    try {
      ctx.response.send({})
    } catch (error) {
        throw error
    }
  }

}
