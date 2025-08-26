import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination, where_slug_or_id } from 'App/Helpers'
import Vehicle from 'App/Models/Vehicle'
import EntityService from 'App/Services/EntityService'

export default class VehiclesController {

    async index(ctx: HttpContextContract) {
        try {

          let { response, auth } = ctx

          if(auth.user){
            let vehicles: any = Vehicle.query()
            vehicles = await Vehicle.listFiltersPaginate(ctx, vehicles)
            vehicles = transform_pagination(vehicles.toJSON())
            const filters = await generate_filters_to_send(Vehicle)
            return response.status(200).send({...vehicles, filters})
          }

        } catch (error) {
            throw error
        }
    }

    async store({ request, response }: HttpContextContract) {
        const enServ: EntityService = new EntityService();
        let trx = await Database.beginGlobalTransaction()
        
        try {
            const { name, brand, model, plate, fb_year, quilometer, shipping_company_id } = await request.all()
            const vehicle = await Vehicle.create({name, brand, model, plate, fb_year, quilometer, shipping_company_id})
            await enServ.slugfy('Vehicle', vehicle, trx)

            await trx.commit()
            return response.status(200).send({data: vehicle})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const vehicle = await where_slug_or_id(Vehicle, id)
            return response.status(200).send({data: vehicle})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
        const enServ: EntityService = new EntityService();
        const trx = await Database.beginGlobalTransaction()
        try {
            const { name, brand, model, plate, fb_year, quilometer, shipping_company_id } = await request.all()
            const vehicle = await where_slug_or_id(Vehicle, id)
            vehicle?.merge({name, brand, model, plate, fb_year, quilometer, shipping_company_id})
            await vehicle?.save(trx)

            await enServ.slugfy('Vehicle', vehicle, trx)
            await trx.commit()
            return response.status(200).send({data: vehicle})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const vehicle = await where_slug_or_id(Vehicle, id)
            if(vehicle){
                await vehicle.softDelete()
            }
            return response.status(200).send({})
        } catch (error) {
            throw error
        }
    }
}
