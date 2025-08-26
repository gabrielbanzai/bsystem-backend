import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Stock from 'App/Models/Stock'

export default class StocksController {

    async index(ctx: HttpContextContract) {
        try {
            let { params : { id },request, response } = ctx
            const { storage_id } = request.all()
            let stocks: any = await Stock.query()
            .whereHas('storage', builder => {
                if(storage_id){
                    builder.where('id', parseInt(storage_id))
                }else{
                    builder.where('principal_storage', 1)
                }
            })
            .preload(
                'transactions', builder => {
                    builder.preload('purchase_order').preload('sale').preload('sale_order').preload('user', builder => builder.select('id', 'name', 'slug', 'avatar')).orderBy('id', 'desc')
                }
            )
            .preload('product').whereHas('product', builder => {
                builder.where('barcode', id).orWhere('reference', id).orWhere('name', id).orWhere('id', id)
            })
            return response.status(200).send({data: stocks[0]})
        } catch (error) {
            throw error
        }
    }

}
