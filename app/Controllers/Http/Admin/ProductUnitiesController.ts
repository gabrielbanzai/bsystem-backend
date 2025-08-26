import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination, where_slug_or_id } from 'App/Helpers'
import ProductUnity from 'App/Models/ProductUnity'
import EntityService from 'App/Services/EntityService'

export default class ProductUnitiesController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let product_unities: any = ProductUnity.query()
            product_unities = await ProductUnity.listFiltersPaginate(ctx, product_unities)
            product_unities = transform_pagination(product_unities.toJSON())
            const filters = await generate_filters_to_send(ProductUnity)
            return response.status(200).send({...product_unities, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        const enServ: EntityService = new EntityService();
        let trx = await Database.beginGlobalTransaction()
        try {
            const { request, response } = ctx
            const { name, abbreviation, plural } = await request.all()
            const product_unity = await ProductUnity.create({name, abbreviation, plural}, trx)
            await enServ.slugfy('ProductUnity', product_unity, trx)
            await trx.commit()
            return response.status(200).send({data: product_unity})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const product_unity = await where_slug_or_id(ProductUnity, id)
            return response.status(200).send({data: product_unity})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
      const enServ: EntityService = new EntityService();
      const trx = await Database.beginGlobalTransaction()
        try {
            const { name, abbreviation, plural } = request.all()
            const product_unity = await where_slug_or_id(ProductUnity, id, trx)
            if(!product_unity){
                return response.status(404).send({
                    message: 'Unidade não encontrada'
                })
            }
            product_unity.merge({name, abbreviation, plural})
            await product_unity.save()
            await enServ.slugfy('ProductUnity', product_unity, trx)
            await trx.commit()
            return response.status(200).send({data: product_unity})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const product_unity = await where_slug_or_id(ProductUnity, id)
            await product_unity.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }
}
