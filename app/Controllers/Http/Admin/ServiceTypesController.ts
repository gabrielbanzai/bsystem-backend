import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination, where_slug_or_id } from 'App/Helpers'
import ServiceType from 'App/Models/ServiceType'
import EntityService from 'App/Services/EntityService'

export default class ServiceTypesController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let serviceTypes: any = ServiceType.query()
            serviceTypes = await ServiceType.listFiltersPaginate(ctx, serviceTypes)
            serviceTypes = transform_pagination(serviceTypes.toJSON())
            const filters = await generate_filters_to_send(ServiceType)
            return response.status(200).send({...serviceTypes, filters})
        } catch (error) {
            throw error
        }
    }

    async store({ request, response }: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction()
        const enServ: EntityService = new EntityService();
        try {
            const { name, unit_price, description } = await request.all()
            
            const serviceType = await ServiceType.create({
                name,
                unit_price,
                description
            })

            await enServ.slugfy('ServiceType', serviceType, trx)
            await trx.commit()

            return response.status(200).send({data: serviceType})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const serviceType = await where_slug_or_id(ServiceType, id)
            return response.status(200).send({data: serviceType})
        } catch (error) {
            throw error
        }
    }

    async update({ params: { id }, request, response }: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction()
        const enServ: EntityService = new EntityService();
        try {
            const { name, unit_price, description } = request.all()
            const serviceType = await ServiceType.findOrFail(id)
            
            if (!serviceType) {
                return response.status(404).send({
                    message: 'Tipo de serviço não encontrado',
                })
            }

            serviceType.merge({ name, unit_price, description })
            await serviceType.save()
            await enServ.slugfy('ServiceType', serviceType, trx)

            await trx.commit()

            return response.status(200).send({ data: serviceType })
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const serviceType = await ServiceType.findOrFail(id)
            await serviceType.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }
    }

    // Endpoint para listar todos os tipos de serviço (para uso em selects)
    async list({ response }: HttpContextContract) {
        try {
            const serviceTypes = await ServiceType.query().select(['id', 'name', 'slug', 'unit_price', 'description'])
            return response.status(200).send({data: serviceTypes})
        } catch (error) {
            throw error
        }
    }
}
