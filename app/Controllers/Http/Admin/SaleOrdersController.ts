import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination } from 'App/Helpers'
import Product from 'App/Models/Product'
import Sale from 'App/Models/Sale'
import SaleOrder from 'App/Models/SaleOrder'
import SaleOrderItem from 'App/Models/SaleOrderItem'
import Stock from 'App/Models/Stock'
import StockTransaction from 'App/Models/StockTransaction'
import StockService from 'App/Services/StockService'

export default class SaleOrderOrdersController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let sale_orders: any = SaleOrder.query()
            sale_orders.preload('user', builder => builder.select(['id', 'name', 'slug']))
            sale_orders.preload('client')
            sale_orders = await SaleOrder.listFiltersPaginate(ctx, sale_orders)
            sale_orders = transform_pagination(sale_orders.toJSON())
            const filters = await generate_filters_to_send(SaleOrder)
            return response.status(200).send({...sale_orders, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction()
        const stockServ = new StockService()
        try {
            const { request, response, auth } = ctx
            const { client_id, items, obs } = await request.all()
            
            const sale_order = await SaleOrder.create({
                client_id, 
                user_id: auth!.user!.id,
                obs
            },trx)
            
            if(items && Array.isArray(items) && items.length > 0){
                await Promise.all(
                    items.map(async item => {

                        let product = await Product.findOrFail(item.product_id)

                        await stockServ.transact_place_stock_reserve(sale_order, item, auth!.user!.id, trx)

                        //Criando o Item
                        await SaleOrderItem.create({
                            sale_order_id: sale_order.id,
                            product_id: item.product_id,
                            quantity: item.quantity,
                            discount_price: 0,
                            unit_price: product?.sale_price,
                            total: (item.quantity * product!.sale_price)
                        }, trx)
                        
                    })
                )

                let items_total = 0

                items.map(item => {
                    items_total+=(item.product.sale_price * item.quantity)
                })

                sale_order.merge({
                    items_total,
                    total: items_total
                })

                await sale_order.save()
            }
            
            await trx.commit()

            await sale_order.load('user', builder => builder.select(['id', 'name', 'slug']))
            await sale_order.load('client', builder => builder.preload('address'))
            await sale_order.load('items', builder => builder.preload('product', builder => {
                builder.preload('unit_in').preload('unit_out').preload('stocks')
            }))

            return response.status(200).send({data: sale_order})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const sale_order = await SaleOrder.findOrFail(id)
            await sale_order.load('user', builder => builder.select(['id', 'name', 'slug']))
            await sale_order.load('client', builder => builder.preload('address'))
            await sale_order.load('items', builder => builder.preload('product', builder => {
                builder.preload('unit_in').preload('unit_out').preload('stocks')
            }))
            return response.status(200).send({data: sale_order})
        } catch (error) {
            throw error
        }
    }

    async update({ params: { id }, request, response, auth }: HttpContextContract) {
        const trx = await Database.beginGlobalTransaction();
        const stockServ = new StockService()
        try {
            const { client_id, items, obs } = request.all();
            const sale_order = await SaleOrder.findOrFail(id);
            
            if (!sale_order) {
                return response.status(404).send({
                    message: 'Orçamento não encontrado',
                });
            }
    
            sale_order.merge({ client_id, obs });
            await sale_order.save();

            await stockServ.transact_adjust_stock_reserve(sale_order, items, auth!.user!.id, trx)
           
            await trx.commit();
    
            // 🔹 Recarrega os relacionamentos para retornar os dados completos
            await sale_order.load('user', builder => builder.select(['id', 'name', 'slug']));
            await sale_order.load('client', builder => builder.preload('address'));
            await sale_order.load('items', builder => builder.preload('product', builder => {
                builder.preload('unit_in').preload('unit_out').preload('stocks');
            }));
    
            return response.status(200).send({ data: sale_order });
        } catch (error) {
            throw error;
        }
    }

    async destroy({ params : { id }, response, auth }: HttpContextContract) {
        try {
            const sale_order = await SaleOrder.findOrFail(id)

            //Zerar as reservas de estoque ao excluir o orçamento
            let items = await SaleOrderItem.query().where('sale_order_id', sale_order.id)
            if(Array.isArray(items) && items.length > 0){
                await Promise.all(
                    items.map(async item => {

                        let stock = await Stock.query().where('product_id', item.product_id).whereHas('storage', b => b.where('principal_storage', 1)).firstOrFail()

                        const balance = stock.quantity_reserved - item.quantity

                        stock.merge({
                            quantity_reserved: balance
                        })

                        await stock.save()

                        await StockTransaction.create({
                            stock_id: stock.id,
                            sale_order_id: item.sale_order_id,
                            product_id: item.product_id,
                            reason: `Orçamento ${sale_order.id} Excluído`,
                            type: 'reserve-cancel',
                            quantity: item.quantity,
                            balance: stock.quantity - balance,
                            user_id: auth!.user!.id
                        })
                    })
                )
            }

            await sale_order.softDelete()

            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }

    async confirm({ params: { id }, response, auth }: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction();
    
        try {
            const sale_order = await SaleOrder.findOrFail(id);
    
            // 🔹 Carrega os itens da venda com os produtos e estoques
            await sale_order.load('items', builder => {
                builder.preload('product', builder => {
                    builder.preload('stocks', builder => builder.whereHas('storage', b => b.where('principal_storage', 1)));
                });
            });
    
            // 🔹 Marca o orçamento como "done"
            sale_order.merge({ status: 'done' });
            await sale_order.save();

            let sale = await Sale.create({
                items_total: sale_order.total,
                discount_price:  0,
                total: sale_order.total,
                user_id: auth!.user!.id, 
                client_id: sale_order.client_id,
                sale_order_id: sale_order.id,
                shipping_total: 0,
            }, trx)

            let saleItems = sale_order.items.map(item => {
                let it = item.toJSON()

                return {
                    product_id: it.product_id,
                    quantity: it.quantity,
                    total: it.total,
                    unit_price: it.unit_price,
                    discount_price: it.discount_price,
                    sale_id: sale.id
                }
            })

            await sale.related('items').createMany(saleItems, trx)
    
            await trx.commit();
    
            // 🔹 Recarrega os relacionamentos para retornar os dados completos
            await sale_order.load('user', builder => builder.select(['id', 'name', 'slug']));
            await sale_order.load('client', builder => builder.preload('address'));
            await sale_order.load('items', builder => builder.preload('product', builder => {
                builder.preload('unit_in').preload('unit_out').preload('stocks', b => b.whereHas('storage', b => b.where('principal_storage', 1)));
            }));
    
            return response.status(200).send({ data: sale_order });
        } catch (error) {
            throw error;
        }
    }
    
}

