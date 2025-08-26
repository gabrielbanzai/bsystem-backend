import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Bull from '@ioc:Rocketseat/Bull'
import { generate_filters_to_send, transform_pagination } from 'App/Helpers'
import ArInvoice from 'App/Models/ArInvoice'
import Product from 'App/Models/Product'
import Sale from 'App/Models/Sale'
import SaleItem from 'App/Models/SaleItem'
import SaleOrder from 'App/Models/SaleOrder'
import SalePayment from 'App/Models/SalePayment'
import Stock from 'App/Models/Stock'
import StockTransaction from 'App/Models/StockTransaction'
import ArInvoiceService from 'App/Services/ArInvoiceService'
import PdfReportService from 'App/Services/PdfReportService'
import StockService from 'App/Services/StockService'

export default class SalesController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let sales: any = Sale.query()
            sales.preload('user', builder => builder.select(['id', 'name', 'slug']))
            sales.preload('client')
            sales.preload('shipping_company')
            sales.preload('sale_payments')
            sales = await Sale.listFiltersPaginate(ctx, sales)
            sales = transform_pagination(sales.toJSON())
            const filters = await generate_filters_to_send(Sale)
            return response.status(200).send({...sales, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction()
        const stockServ = new StockService()
        try {
            const { request, response, auth } = ctx
            const { client_id, shipping_company_id, discount_price, items, shipping_total, sale_payments, obs } = await request.all()
            
            const sale = await Sale.create({
                client_id, 
                shipping_company_id, 
                discount_price, 
                user_id: auth!.user!.id,
                shipping_total, 
                obs
            },trx)
            
            if(items && Array.isArray(items) && items.length > 0){
                await Promise.all(
                    items.map(async item => {

                        let product = await Product.findOrFail(item.product_id)

                        //Criando o Item
                        await SaleItem.create({
                            sale_id: sale.id,
                            product_id: item.product_id,
                            quantity: item.quantity,
                            discount_price: item.discount_price,
                            unit_price: product?.sale_price,
                            total: (item.quantity * product!.sale_price) - item.discount_price
                        }, trx)

                        await stockServ.transact_place_stock_reserve_sale(sale, item, auth!.user!.id, trx)
                        
                    })
                )

                let items_total = 0

                items.map(item => {
                    items_total+=(item.product.sale_price * item.quantity)
                })

                sale.merge({
                    items_total,
                    discount_price: discount_price,
                    total: (items_total + shipping_total) - discount_price
                })

                await sale.save()
            }

            if(sale_payments && Array.isArray(sale_payments) && sale_payments.length > 0){
                await Promise.all(
                    sale_payments.map(async purchase_order_payment => {

                        //Criando o Item
                        await SalePayment.create({
                            sale_id: sale.id,
                            payment_method_id: purchase_order_payment.payment_method_id,
                            value_total: purchase_order_payment.value_total,
                            installments: purchase_order_payment.installments,
                            payment_days: purchase_order_payment.payment_days,
                        }, trx)
                    })
                )
            }
            
            await trx.commit()

            await sale.load('user', builder => builder.select(['id', 'name', 'slug']))
            await sale.load('client', builder => builder.preload('address'))
            await sale.load('shipping_company', builder => builder.preload('address'))
            await sale.load('items', builder => builder.preload('product', builder => {
                builder.preload('unit_in').preload('unit_out').preload('stocks')
            }))
            await sale.load('sale_payments', builder => {
                builder.preload('payment_method')
            })
            return response.status(200).send({data: sale})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const sale = await Sale.findOrFail(id)
            await sale.load('user', builder => builder.select(['id', 'name', 'slug']))
            await sale.load('client', builder => builder.preload('address'))
            await sale.load('shipping_company', builder => builder.preload('address'))
            await sale.load('items', builder => builder.preload('product', builder => {
                builder.preload('unit_in').preload('unit_out').preload('stocks')
            }))
            await sale.load('sale_payments', builder => {
                builder.preload('payment_method')
            })
            return response.status(200).send({data: sale})
        } catch (error) {
            throw error
        }
    }

    async update({ params: { id }, request, response, auth }: HttpContextContract) {
        const trx = await Database.beginGlobalTransaction();
        const stockServ = new StockService()
        try {
            const { client_id, shipping_total, shipping_company_id, discount_price, items, sale_payments, obs } = request.all();
            const sale = await Sale.findOrFail(id);
            
            if (!sale) {
                return response.status(404).send({
                    message: 'Pedido de compra não encontrado',
                });
            }
    
            sale.merge({ client_id, shipping_total, shipping_company_id, discount_price, obs });
            await sale.save();

            await stockServ.transact_adjust_stock_reserve_sale(sale, items, auth!.user?.id, discount_price, shipping_total, trx)

            if(sale_payments && Array.isArray(sale_payments) && sale_payments.length > 0){
            
                await sale.related('sale_payments').query().delete()

                await Promise.all(
                    sale_payments.map(async sale_payment => {

                        await SalePayment.create({
                            sale_id: sale.id,
                            payment_method_id: sale_payment.payment_method_id,
                            value_total: sale_payment.value_total,
                            installments: sale_payment.installments,
                            payment_days: sale_payment.payment_days,
                        }, trx)
                    })
                )
            }
    
            await trx.commit();
    
            // Recarrega os relacionamentos para retornar os dados completos
            await sale.load('user', builder => builder.select(['id', 'name', 'slug']));
            await sale.load('client', builder => builder.preload('address'));
            await sale.load('shipping_company', builder => builder.preload('address'));
            await sale.load('items', builder => builder.preload('product', builder => {
                builder.preload('unit_in').preload('unit_out').preload('stocks');
            }));
    
            return response.status(200).send({ data: sale });
        } catch (error) {
            throw error;
        }
    }

    async destroy({ params : { id }, response, auth }: HttpContextContract) {
        try {
            const sale = await Sale.findOrFail(id)
            const sale_order = await SaleOrder.findOrFail(sale.sale_order_id)

            //Zerar as reservas de estoque ao excluir o orçamento
            let items = await SaleItem.query().where('sale_id', sale.id)
            let invoices = await ArInvoice.query().where('sale_id', sale.id)

            if(sale.status == 'done' && Array.isArray(invoices) && invoices.length > 0){
                return response.status(400).send({
                    message: 'A venda já foi concluída e faturada e não pode ser excluída.'
                })
            }

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
                            sale_id: item.sale_id,
                            product_id: item.product_id,
                            reason: `Venda ${sale.id} Excluída`,
                            type: 'reserve-cancel',
                            quantity: item.quantity,
                            balance: stock.quantity - balance,
                            user_id: auth!.user!.id
                        })
                    })
                )
            }

            sale_order.merge({status: 'canceled'})

            await sale_order.save()
            
            if(Array.isArray(invoices) && invoices.length > 0){
                await Promise.all(
                    invoices.map(async ar_invoice => {
                        await Bull.remove('EC-CheckArInvoicePayment', ar_invoice.check_payment_job_id)
                        const receipts = await ar_invoice.related('ar_receipts').query()
                        
                        if(Array.isArray(receipts) && receipts.length > 0){
                            await Promise.all(
                                receipts.map(async receipt => {
                                    await receipt.softDelete()
                                    await Bull.remove('EC-CheckArReceiptPayment', receipt.check_payment_job_id)
                                })
                            )
                        }

                        await ar_invoice.softDelete()
                    })
                )
            }

            await sale.softDelete()

            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }

    async confirm({ params: { id }, response, auth }: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction();
        const stockServ = new StockService()
        const arInvServ = new ArInvoiceService()
    
        try {
            const sale = await Sale.findOrFail(id);
    
            // Carrega os itens da venda com os produtos e estoques
            await sale.load('items', builder => {
                builder.preload('product', builder => {
                    builder.preload('stocks', builder => {
                        builder.whereHas('storage', b => b.where('principal_storage', 1))
                    });
                });
            });
            await sale.load('invoices')
            await sale.load('sale_payments', builder => {
                builder.preload('payment_method')
            })

            const { sale_payments, invoices } = sale.toJSON()

            // Verifca se ainda não foram gerados os dados de pagamento
            if(!sale_payments || sale_payments.length == 0){
                // Não foram informados dados de pagamento da venda
                return response.status(400).send({
                    message: 'Não é possivel confirmar esta venda. Não foram encontrados os dados de pagamento desta venda.'
                })
            }

            // Não foram informados dados de pagamento da venda no financeiro
            if(Array.isArray(invoices) && invoices.length == 0){
                // Gera-se as faturas caso não tenham sido geradas até o momento
                await Promise.all(
                    sale_payments.map(async sale_payment => {
                        await arInvServ.generateSaleInvoice({
                            sale,
                            sale_payment
                        }, trx)
                        let pymnt = await SalePayment.findOrFail(sale_payment.id)
                        pymnt.merge({status: 'emited'})
                        await pymnt.save()
                    })
                )
            }

            // Foram informados dados de pagamento da venda no financeiro
            if(Array.isArray(invoices) && invoices.length > 0){
                // Contador
                let doEmit = sale_payments.filter(x => x.status == 'pending')
                
                // Se houverem pagamentos pendentes para emitir, emiti-los imediatamente
                if(doEmit.length > 0){
                    await Promise.all(
                        doEmit.map(async sale_payment => {
                            await arInvServ.generateSaleInvoice({
                                sale,
                                sale_payment
                            }, trx)
                            let pymnt = await SalePayment.findOrFail(sale_payment.id)
                            pymnt.merge({status: 'emited'})
                            await pymnt.save()
                        })
                    )
                }
            }

            // Verifica se todos os produtos têm estoque suficiente antes de prosseguir
            // for (const item of sale.items) {
            //     const stock = await Stock.findOrFail(item.product?.stocks.id);
    
            //     const availableStock = stock.quantity - stock.quantity_reserved;
    
            //     if (item.quantity > availableStock) {
            //         await trx.rollback();
            //         return response.status(400).send({
            //             message: `Estoque insuficiente para o produto ${item.product?.name}. Disponível: ${availableStock}, Necessário: ${item.quantity}`
            //         });
            //     }
            // }
    
            // Percorre os itens para criar transações e atualizar o estoque
            await stockServ.transact_cancel_stock_reserve(sale, auth!.user!.id, trx)
    
            // Marca a venda como "done"
            sale.merge({ status: 'done' });
            await sale.save();
    
            await trx.commit();
    
            // Recarrega os relacionamentos para retornar os dados completos
            await sale.load('user', builder => builder.select(['id', 'name', 'slug']));
            await sale.load('client', builder => builder.preload('address'));
            await sale.load('shipping_company', builder => builder.preload('address'));
            await sale.load('items', builder => builder.preload('product', builder => {
                builder.preload('unit_in').preload('unit_out').preload('stocks', b => b.whereHas('storage', b => b.where('principal_storage', 1)));
            }));
    
            return response.status(200).send({ data: sale });
        } catch (error) {
            throw error;
        }
    }

    async emitPDF({ params : { id }, response, auth }: HttpContextContract) {
        if(!auth.user){
            return response.status(404).send({message: 'Usuário inválido'})
        }
    
        try {
            let purchase_order = await Sale.findOrFail(id)
            
            await purchase_order.load('user', builder => builder.select(['id', 'name', 'slug']))
            await purchase_order.load('client', builder => builder.preload('address'))
            await purchase_order.load('shipping_company', builder => builder.preload('address'))
            await purchase_order.load('items', builder => builder.preload('product', builder => {
                builder.preload('unit_in').preload('unit_out')
            }))

            let order = purchase_order.toJSON()

            await PdfReportService.generateSaleOrderReport(response, order, auth.user)
        } catch (error) {
            throw error
        }
    }
    
}

