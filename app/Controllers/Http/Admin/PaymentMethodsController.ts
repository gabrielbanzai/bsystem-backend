import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination, where_slug_or_id } from 'App/Helpers'
import PaymentMethod from 'App/Models/PaymentMethod'
import EntityService from 'App/Services/EntityService'

export default class PaymentMethodsController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let payment_methods: any = PaymentMethod.query()
            payment_methods = await PaymentMethod.listFiltersPaginate(ctx, payment_methods)
            payment_methods = transform_pagination(payment_methods.toJSON())
            const filters = await generate_filters_to_send(PaymentMethod)
            return response.status(200).send({...payment_methods, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        let enServ = new EntityService()
        let trx = await Database.beginGlobalTransaction()
        try {
            const { request, response } = ctx
            const { name } = await request.all()
            const payment_method = await PaymentMethod.create({name}, trx)
            await enServ.slugfy('PaymentMethod', payment_method, trx)
            
            await trx.commit()

            return response.status(200).send({data: payment_method})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const payment_method = await where_slug_or_id(PaymentMethod, id)
            return response.status(200).send({data: payment_method})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
        let enServ = new EntityService()
        const trx = await Database.beginGlobalTransaction()
        try {
            const { name } = request.all()
            const payment_method = await where_slug_or_id(PaymentMethod, id)
            if(!payment_method){
                return response.status(404).send({
                    message: 'Método de pagamento não encontrado'
                })
            }
            payment_method.merge({name})
            await payment_method.save()
            await enServ.slugfy('PaymentMethod', payment_method, trx)

            await trx.commit()

            return response.status(200).send({data: payment_method})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const payment_method = await where_slug_or_id(PaymentMethod, id)
            await payment_method.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }

}

