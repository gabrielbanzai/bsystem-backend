import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination } from 'App/Helpers'
import ServiceOrder from 'App/Models/ServiceOrder'
import ServiceOrderItem from 'App/Models/ServiceOrderItem'
import ServiceOrderProduct from 'App/Models/ServiceOrderProduct'
import ServiceType from 'App/Models/ServiceType'

export default class ServiceOrdersController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let services: any = ServiceOrder.query()
            services.preload('user', builder => builder.select(['id', 'name', 'slug', 'avatar']))
            services.preload('client')
            services.preload('tecnical')
            services = await ServiceOrder.listFiltersPaginate(ctx, services)
            services = transform_pagination(services.toJSON())
            const filters = await generate_filters_to_send(ServiceOrder)
            return response.status(200).send({...services, filters})
        } catch (error) {
            throw error
        }
    }
    
    async store(ctx: HttpContextContract) {
        const { request, response, auth } = ctx
        const trx = await Database.beginGlobalTransaction()
        try {
            const { client_id, tecnical_id, description, items, products, issue_date } = await request.all()
            
            const serviceOrder = await ServiceOrder.create({
                client_id,
                tecnical_id,
                description,
                issue_date,
                user_id: auth!.user!.id
            }, trx)

            // Processamento de itens de serviço
            if (items && Array.isArray(items) && items.length > 0) {
                await Promise.all(
                    items.map(async item => {
                        let actualDescription = item.description
                        
                        // Se foi fornecido um service_type_id, buscar o tipo e usar seus dados
                        if (item.service_type_id) {
                            const serviceType = await ServiceType.findOrFail(item.service_type_id)
                            actualDescription = actualDescription || serviceType.description
                        }
                        
                        // Criando o Item
                        await ServiceOrderItem.create({
                            service_order_id: serviceOrder.id,
                            service_type_id: item.service_type_id || null,
                            description: actualDescription,
                        }, trx)
                    })
                )
            }

            // Processamento de produtos
            if (products && Array.isArray(products) && products.length > 0) {
                await Promise.all(
                    products.map(async product => {
                        await ServiceOrderProduct.create({
                            service_order_id: serviceOrder.id,
                            product_id: product.product_id,
                            quantity: product.quantity || 1
                        }, trx)
                    })
                )
            }

            await trx.commit()

            // Recarregar relacionamentos
            await serviceOrder.load('user', builder => builder.select(['id', 'name', 'slug', 'avatar']))
            await serviceOrder.load('tecnical', builder => builder.select(['id', 'name', 'slug', 'avatar']))
            await serviceOrder.load('client', builder => builder.preload('address'))
            await serviceOrder.load('items', builder => builder.preload('service_type'))
            await serviceOrder.load('products', builder => builder.preload('product'))

            return response.status(201).send({ data: serviceOrder })
        } catch (error) {
            await trx.rollback()
            throw error
        }
    }

    async show({ params: { id }, response }: HttpContextContract) {
        try {
            const serviceOrder = await ServiceOrder.findOrFail(id)
            
            await serviceOrder.load('user', builder => builder.select(['id', 'name', 'slug', 'avatar']))
            await serviceOrder.load('tecnical', builder => builder.select(['id', 'name', 'slug', 'avatar']))
            await serviceOrder.load('client', builder => builder.preload('address'))
            await serviceOrder.load('items', builder => builder.preload('service_type'))
            await serviceOrder.load('products', builder => builder.preload('product'))

            return response.status(200).send({ data: serviceOrder })
        } catch (error) {
            throw error
        }
    }

    async update({ params: { id }, request, response }: HttpContextContract) {
        const trx = await Database.beginGlobalTransaction()
        try {
            const { client_id, tecnical_id, description, issue_date, items, products } = await request.all()
            
            const serviceOrder = await ServiceOrder.findOrFail(id)
            
            serviceOrder.merge({ client_id, tecnical_id, issue_date, description })
            await serviceOrder.save()

            // Processamento de itens de serviço
            if (items && Array.isArray(items) && items.length > 0) {
                // Remove itens existentes
                await serviceOrder.related('items').query().delete()

                await Promise.all(
                    items.map(async item => {
                        let actualDescription = item.description
                        
                        // Se foi fornecido um service_type_id, buscar o tipo e usar seus dados
                        if (item.service_type_id) {
                            const serviceType = await ServiceType.findOrFail(item.service_type_id)
                            actualDescription = actualDescription || serviceType.description
                        }
                        
                        // Criando o Item
                        await ServiceOrderItem.create({
                            service_order_id: serviceOrder.id,
                            service_type_id: item.service_type_id || null,
                            description: actualDescription,
                        }, trx)
                    })
                )
            }

            // Processamento de produtos
            if (products && Array.isArray(products) && products.length > 0) {
                // Remove produtos existentes
                await serviceOrder.related('products').query().delete()

                await Promise.all(
                    products.map(async product => {
                        await ServiceOrderProduct.create({
                            service_order_id: serviceOrder.id,
                            product_id: product.product_id,
                            quantity: product.quantity || 1
                        }, trx)
                    })
                )
            }

            await trx.commit()

            // Recarregar relacionamentos
            await serviceOrder.load('user', builder => builder.select(['id', 'name', 'slug', 'avatar']))
            await serviceOrder.load('tecnical', builder => builder.select(['id', 'name', 'slug', 'avatar']))
            await serviceOrder.load('client', builder => builder.preload('address'))
            await serviceOrder.load('items', builder => builder.preload('service_type'))
            await serviceOrder.load('products', builder => builder.preload('product'))

            return response.status(200).send({ data: serviceOrder })
        } catch (error) {
            await trx.rollback()
            throw error
        }
    }

    async destroy({ params: { id }, response }: HttpContextContract) {
        try {
            const serviceOrder = await ServiceOrder.findOrFail(id)
            await serviceOrder.delete()

            return response.status(200).send({ message: 'Ordem de serviço excluída com sucesso' })
        } catch (error) {
            throw error
        }
    }
}
