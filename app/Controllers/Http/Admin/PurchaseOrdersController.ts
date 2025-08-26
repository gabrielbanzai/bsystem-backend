import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination } from 'App/Helpers'
import Product from 'App/Models/Product'
import ProductCost from 'App/Models/ProductCost'
import ProductPrice from 'App/Models/ProductPrice'
import PurchaseOrder from 'App/Models/PurchaseOrder'
import PurchaseOrderItem from 'App/Models/PurchaseOrderItem'
import PurchaseOrderPayment from 'App/Models/PurchaseOrderPayment'
import PdfReportService from 'App/Services/PdfReportService'
import StockService from 'App/Services/StockService'

export default class PurchaseOrdersController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let purchase_orders: any = PurchaseOrder.query()
            purchase_orders.preload('user', builder => builder.select(['id', 'name', 'slug']))
            purchase_orders.preload('supplier')
            purchase_orders.preload('shipping_company')
            purchase_orders.preload('purchase_order_payments')
            purchase_orders = await PurchaseOrder.listFiltersPaginate(ctx, purchase_orders)
            purchase_orders = transform_pagination(purchase_orders.toJSON())
            const filters = await generate_filters_to_send(PurchaseOrder)
            return response.status(200).send({...purchase_orders, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction()
        try {
            const { request, response, auth } = ctx
            const { supplier_id, shipping_total, shipping_company_id, discount_price, items, purchase_order_payments, obs } = await request.all()
            const purchase_order = await PurchaseOrder.create({
                supplier_id, 
                shipping_total, 
                shipping_company_id, 
                discount_price, 
                user_id: auth!.user!.id,
                obs
            }, trx)
            
            if(items && Array.isArray(items) && items.length > 0){
                await Promise.all(
                    items.map(async item => {

                        //Criando o Item
                        await PurchaseOrderItem.create({
                            purchase_order_id: purchase_order.id,
                            product_id: item.product_id,
                            quantity: item.quantity,
                            discount_price: item.discount_price,
                            unit_price: item?.unit_price,
                            total: (item.quantity * item.unit_price) - item.discount_price
                        }, trx)
                    })
                )

                let items_total = 0

                items.map(item => {
                    items_total+=(item.quantity * item.unit_price)
                })

                purchase_order.merge({
                    items_total,
                    discount_price: discount_price,
                    total: (items_total + shipping_total) - discount_price
                })

                await purchase_order.save()
            }

            if(purchase_order_payments && Array.isArray(purchase_order_payments) && purchase_order_payments.length > 0){
                await Promise.all(
                    purchase_order_payments.map(async purchase_order_payment => {

                        //Criando o Item
                        await PurchaseOrderPayment.create({
                            purchase_order_id: purchase_order.id,
                            payment_method_id: purchase_order_payment.payment_method_id,
                            value_total: purchase_order_payment.value_total,
                            installments: purchase_order_payment.installments,
                            payment_days: purchase_order_payment.payment_days,
                        }, trx)
                    })
                )
            }
            
            await trx.commit()

            await purchase_order.load('user', builder => builder.select(['id', 'name', 'slug']))
            await purchase_order.load('supplier', builder => builder.preload('address'))
            await purchase_order.load('shipping_company', builder => builder.preload('address'))
            await purchase_order.load('items', builder => builder.preload('product', builder => {
                builder.preload('unit_in').preload('unit_out')
            }))
            await purchase_order.load('purchase_order_payments', builder => {
                builder.preload('payment_method')
            })

            return response.status(200).send({data: purchase_order})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const purchase_order = await PurchaseOrder.findOrFail(id)
            await purchase_order.load('user', builder => builder.select(['id', 'name', 'slug']))
            await purchase_order.load('supplier', builder => builder.preload('address'))
            await purchase_order.load('shipping_company', builder => builder.preload('address'))
            await purchase_order.load('invoices')
            await purchase_order.load('items', builder => builder.preload('product', builder => {
                builder.preload('unit_in').preload('unit_out')
            }))
            await purchase_order.load('purchase_order_payments', builder => {
                builder.preload('payment_method')
            })
            return response.status(200).send({data: purchase_order})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
      const trx = await Database.beginGlobalTransaction()
        try {
            const { supplier_id, shipping_total, shipping_company_id, discount_price, items, purchase_order_payments, obs } = request.all()
            const purchase_order = await PurchaseOrder.findOrFail(id)
            if(!purchase_order){
                return response.status(404).send({
                    message: 'Pedido de compra não encontrado'
                })
            }
            purchase_order.merge({supplier_id, shipping_total, discount_price, shipping_company_id, obs})
            await purchase_order.save()

            if (items && Array.isArray(items) && items.length > 0) {
                const existingItems = await purchase_order.related('items').query()

                const areItemsDifferent = existingItems.length !== items.length ||
                    items.some((item, index) => {
                    const existing = existingItems[index]
                    return (
                        existing.product_id !== item.product_id ||
                        Number(existing.quantity) !== Number(item.quantity) ||
                        Number(existing.unit_price) !== Number(item.unit_price) ||
                        Number(existing.discount_price) !== Number(item.discount_price)
                    )
                    })

                if (areItemsDifferent) {
                    await purchase_order.related('items').query().delete()

                    await Promise.all(
                        items.map(async (item) => {
                            await PurchaseOrderItem.create({
                            purchase_order_id: purchase_order.id,
                            product_id: item.product_id,
                            quantity: item.quantity,
                            discount_price: item.discount_price,
                            unit_price: item.unit_price,
                            total: item.quantity * item.unit_price - item.discount_price,
                            }, trx)
                        })
                    )

                    let items_total = 0
                    items.forEach((item) => {
                        items_total += item.unit_price * item.quantity
                    })

                    purchase_order.merge({
                        items_total,
                        discount_price,
                        total: (items_total + shipping_total) - discount_price,
                    })

                    await purchase_order.save()
                }
            }


            if(purchase_order_payments && Array.isArray(purchase_order_payments) && purchase_order_payments.length > 0){

                await purchase_order.related('purchase_order_payments').query().delete()

                await Promise.all(
                    purchase_order_payments.map(async purchase_order_payment => {

                        await PurchaseOrderPayment.create({
                            purchase_order_id: purchase_order.id,
                            payment_method_id: purchase_order_payment.payment_method_id,
                            value_total: purchase_order_payment.value_total,
                            installments: purchase_order_payment.installments,
                            payment_days: purchase_order_payment.payment_days,
                        }, trx)
                    })
                )
            }

            await trx.commit()

            await purchase_order.load('user', builder => builder.select(['id', 'name', 'slug']))
            await purchase_order.load('supplier', builder => builder.preload('address'))
            await purchase_order.load('shipping_company', builder => builder.preload('address'))
            await purchase_order.load('items', builder => builder.preload('product', builder => {
                builder.preload('unit_in').preload('unit_out')
            }))
            await purchase_order.load('purchase_order_payments', builder => {
                builder.preload('payment_method')
            })

            return response.status(200).send({data: purchase_order})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const purchase_order = await PurchaseOrder.findOrFail(id)
            await purchase_order.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }

    async done({ params : { id }, response }: HttpContextContract) {
        try {
            const purchase_order = await PurchaseOrder.findOrFail(id)
            purchase_order.merge({status: 'done'})
            await purchase_order.save()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }
    }

    async confirm({ params : { id }, request, response, auth }: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction()
        const stockServ = new StockService()
        const { storage_id  } = request.all()

        try {
            const purchase_order = await PurchaseOrder.findOrFail(id)

            await purchase_order.load('items', builder => {
                builder.preload('product', builder => {
                    builder.preload('stocks')
                })
            })

            const po = await purchase_order.toJSON()

            await stockServ.transact_purchase_order(purchase_order, storage_id, auth!.user!.id, trx)

            //Recalcula a margem dos produtos e altera o preço novo
            await Promise.all(
                po.items.map(async item => {
                    const product = await Product.findOrFail(item.product.id)

                    const unitCost = item.unit_price // valor inteiro (ex: 740)
                    const productId = product.id
                    const userId = auth!.user!.id

                    // 1. Atualiza o last_cost do produto
                    product.last_cost = unitCost

                    // 2. Cria um novo ProductCost
                    await ProductCost.create({
                    product_id: productId,
                    price: unitCost,
                    user_id: userId,
                    origin: 'purchase_order',
                    purchase_order_id: purchase_order.id
                    }, { client: trx })

                    // 3. Calcula o avg_cost baseado em todos os ProductCost do produto
                    const allCosts = await ProductCost.query({ client: trx }).where('product_id', productId)

                    const total = allCosts.reduce((sum, pc) => sum + pc.price, 0)
                    const avgCost = Math.round(total / allCosts.length) // resultado também inteiro

                    product.avg_cost = avgCost

                    // 4. Calcula novo sale_price baseado na margem do produto
                    const marginPercent = product.margin_percent ?? 3000 // margem padrão: 30% = 3000

                    const salePrice = Math.round(avgCost * (1 + marginPercent / 10000)) // novo preço

                    // 5. Cria novo ProductPrice
                    await ProductPrice.create({
                    product_id: productId,
                    price: salePrice,
                    user_id: userId,
                    origin: 'purchase_order',
                    purchase_order_id: purchase_order.id
                    }, { client: trx })

                    // 6. Atualiza sale_price e salva o produto
                    product.sale_price = salePrice

                    await product.save()
                })
            )

            //Gera a cobrança
            // let ap_invoice = await ApInvoice.create({
            //     total_amount: purchase_order.total,
            //     issue_date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),

            // })

            purchase_order.merge({status: 'done'})

            await purchase_order.save()

            await trx.commit()

            await purchase_order.load('user', builder => builder.select(['id', 'name', 'slug']))
            await purchase_order.load('supplier', builder => builder.preload('address'))
            await purchase_order.load('shipping_company', builder => builder.preload('address'))
            await purchase_order.load('items', builder => builder.preload('product', builder => {
                builder.preload('unit_in').preload('unit_out')
            }))

            return response.status(200).send({data: purchase_order})
        } catch (error) {
            throw error
        }
    }

    async emitPDF({ params : { id }, response, auth }: HttpContextContract) {
        if(!auth.user){
            return response.status(404).send({message: 'Usuário inválido'})
        }
    
       try {
            let purchase_order = await PurchaseOrder.findOrFail(id)
            
            await purchase_order.load('user', builder => builder.select(['id', 'name', 'slug']))
            await purchase_order.load('supplier', builder => builder.preload('address'))
            await purchase_order.load('shipping_company', builder => builder.preload('address'))
            await purchase_order.load('invoices')
            await purchase_order.load('items', builder => builder.preload('product', builder => {
                builder.preload('unit_in').preload('unit_out')
            }))

            let order = purchase_order.toJSON()

            await PdfReportService.generatePurchaseOrderReport(response, order, auth.user)
       } catch (error) {
            throw error
       }
    }
}

