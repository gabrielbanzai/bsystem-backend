import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination, where_slug_or_id } from 'App/Helpers'
import ProductCategory from 'App/Models/ProductCategory'
import EntityService from 'App/Services/EntityService'

export default class ProductCategoriesController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let product_categories: any = ProductCategory.query()
            product_categories = await ProductCategory.listFiltersPaginate(ctx, product_categories)
            product_categories = transform_pagination(product_categories.toJSON())
            const filters = await generate_filters_to_send(ProductCategory)
            return response.status(200).send({...product_categories, filters})
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
            const product_category = await ProductCategory.create({name}, trx)
            await enServ.slugfy('ProductCategory', product_category, trx)
            await trx.commit()
            return response.status(200).send({data: product_category})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const product_category = await where_slug_or_id(ProductCategory, id)
            return response.status(200).send({data: product_category})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
      const enServ: EntityService = new EntityService();
      const trx = await Database.beginGlobalTransaction()
        try {
            const { name } = request.all()
            const product_category = await where_slug_or_id(ProductCategory, id, trx)
            if(!product_category){
                return response.status(404).send({
                    message: 'Categoria não encontrada'
                })
            }
            product_category.merge({name})
            await product_category.save(trx)
            await enServ.slugfy('ProductCategory', product_category, trx)
            await trx.commit()
            return response.status(200).send({data: product_category})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const product_category = await where_slug_or_id(ProductCategory, id)
            await product_category.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }
}
