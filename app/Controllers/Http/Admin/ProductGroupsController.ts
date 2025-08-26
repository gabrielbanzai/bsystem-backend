import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination, where_slug_or_id } from 'App/Helpers'
import ProductGroup from 'App/Models/ProductGroup'
import EntityService from 'App/Services/EntityService'

export default class ProductGroupsController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let product_groups: any = ProductGroup.query()
            product_groups = await ProductGroup.listFiltersPaginate(ctx, product_groups)
            product_groups = transform_pagination(product_groups.toJSON())
            const filters = await generate_filters_to_send(ProductGroup)
            return response.status(200).send({...product_groups, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        const enServ: EntityService = new EntityService();
        let trx = await Database.beginGlobalTransaction()
        try {
            const { request, response } = ctx
            const { name } = await request.all()
            const product_group = await ProductGroup.create({name}, trx)
            await enServ.slugfy('ProductGroup', product_group, trx)
            await trx.commit()
            return response.status(200).send({data: product_group})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const product_group = await where_slug_or_id(ProductGroup, id)
            return response.status(200).send({data: product_group})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
      const enServ: EntityService = new EntityService();
      const trx = await Database.beginGlobalTransaction()
        try {
            const { name } = request.all()
            const product_group = await where_slug_or_id(ProductGroup, id, trx)
            if(!product_group){
                return response.status(404).send({
                    message: 'Grupo não encontrado'
                })
            }
            product_group.merge({name})
            await product_group.save()
            await enServ.slugfy('ProductGroup', product_group, trx)
            await trx.commit()
            return response.status(200).send({data: product_group})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const product_group = await where_slug_or_id(ProductGroup, id)
            await product_group.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }
}
