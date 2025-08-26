//import Redis from '@ioc:Adonis/Addons/Redis'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Department from 'App/Models/Department'
import Position from 'App/Models/Position'
import ServiceOrder from 'App/Models/ServiceOrder'
export default class DashboardController {

  async index(ctx: HttpContextContract) {
    const { response, auth } = ctx
    
    try {

      if(!auth.user){
        throw Error('Invalid user')
      }
      // if(auth.user.id == 1){
      //   return response.status(200).send({})
      // }

      let department = await Department.findOrFail(auth.user.department_id)
      let position = await Position.findOrFail(auth.user.position_id)
      let responseData: any = {}

      switch (department.slug) {
        case 'departamento-tecnico':
          
          switch (position.slug) {
            case 'tecnico':
              
              let orders = await ServiceOrder.query().where('tecnical_id', auth.user.id)
              responseData = {
                ...responseData,
                orders
              }

              break;
          
            default:
              break;
          }

          break;
      
        default:
          break;
      }

      response.send({data: responseData})
    } catch (error) {
        throw error
    }
  }

}
