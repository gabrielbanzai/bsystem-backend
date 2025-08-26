import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination } from 'App/Helpers'
import Product from 'App/Models/Product'
import Service from 'App/Models/Service'
import ServiceItem from 'App/Models/ServiceItem'
import ServiceProduct from 'App/Models/ServiceProduct'
import ServicePayment from 'App/Models/ServicePayment'
import ServiceType from 'App/Models/ServiceType'
import ArInvoiceService from 'App/Services/ArInvoiceService'
import StockService from 'App/Services/StockService'
import Stock from 'App/Models/Stock'
import StockTransaction from 'App/Models/StockTransaction'
import ArInvoice from 'App/Models/ArInvoice'
import Bull from '@ioc:Rocketseat/Bull'

export default class ServicesController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let services: any = Service.query()
            services.preload('user', builder => builder.select(['id', 'name', 'slug', 'avatar']))
            services.preload('client')
            services.preload('tecnical')
            services = await Service.listFiltersPaginate(ctx, services)
            services = transform_pagination(services.toJSON())
            const filters = await generate_filters_to_send(Service)
            return response.status(200).send({...services, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction()
        const stockServ = new StockService()
        try {
            const { request, response, auth } = ctx
            const { client_id, tecnical_id, discount_price, items, products, service_payments, obs } = await request.all()
            
            const service = await Service.create({
                client_id,
                tecnical_id,
                discount_price, 
                user_id: auth!.user!.id,
                obs
            },trx)
            
            let items_total = 0

            // Processamento de itens de serviço (sem produto)
            if(items && Array.isArray(items) && items.length > 0){
                await Promise.all(
                    items.map(async item => {
                        let actualPrice = item.unit_price
                        let actualDescription = item.description
                        
                        // Se foi fornecido um service_type_id, buscar o tipo e usar seus dados
                        if(item.service_type_id) {
                            const serviceType = await ServiceType.findOrFail(item.service_type_id)
                            // Se o preço do item não foi informado ou é igual ao do tipo, usar o preço do tipo
                            // Caso contrário, manter o preço informado no item
                            if(!item.unit_price || item.unit_price === serviceType.unit_price) {
                                actualPrice = serviceType.unit_price
                            }
                            actualDescription = actualDescription || serviceType.description
                        }
                        
                        //Criando o Item
                        await ServiceItem.create({
                            service_id: service.id,
                            service_type_id: item.service_type_id || null,
                            unit_price: actualPrice,
                            discount_price: item.discount_price,
                            description: actualDescription,
                            total: actualPrice - item.discount_price,
                        }, trx)                        
                    })
                )

                // Calculamos o total baseado nos itens realmente criados
                let createdItems = await ServiceItem.query().where('service_id', service.id)
                createdItems.map(item => {
                    items_total += item.unit_price
                })
            }

            let products_total = 0
            
            // Processamento de produtos (baseado no SalesController)
            if(products && Array.isArray(products) && products.length > 0){
                await Promise.all(
                    products.map(async item => {

                        let product = await Product.findOrFail(item.product_id)

                        //Criando o Produto do Serviço
                        await ServiceProduct.create({
                            service_id: service.id,
                            product_id: item.product_id,
                            quantity: item.quantity,
                            discount_price: item.discount_price,
                            unit_price: product?.sale_price,
                            total: (item.quantity * product!.sale_price) - item.discount_price
                        }, trx)

                        await stockServ.transact_place_stock_reserve_service(service, item, auth!.user!.id, trx)
                        
                    })
                )

                // Calculamos o total baseado nos produtos realmente criados
                let createdProducts = await ServiceProduct.query().where('service_id', service.id).preload('product')
                createdProducts.map(item => {
                    products_total += (item.quantity * item.unit_price)
                })
            }

            service.merge({
                items_total,
                discount_price: discount_price,
                total: (items_total + products_total) - discount_price
            })

            await service.save()

            // Processamento de pagamentos do serviço (baseado no SalesController)
            if(service_payments && Array.isArray(service_payments) && service_payments.length > 0){
                await Promise.all(
                    service_payments.map(async service_payment => {

                        //Criando o Pagamento do Serviço
                        await ServicePayment.create({
                            service_id: service.id,
                            payment_method_id: service_payment.payment_method_id,
                            value_total: service_payment.value_total,
                            installments: service_payment.installments,
                            payment_days: service_payment.payment_days,
                        }, trx)
                    })
                )
            }
            
            await trx.commit()

            await service.load('user', builder => builder.select(['id', 'name', 'slug', 'avatar']))
            await service.load('tecnical', builder => builder.select(['id', 'name', 'slug', 'avatar']))
            await service.load('client', builder => builder.preload('address'))
            await service.load('items', builder => builder.preload('service_type'))
            await service.load('products')
            await service.load('service_payments', builder => {
                builder.preload('payment_method')
            })

            return response.status(200).send({data: service})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const service = await Service.findOrFail(id)
            await service.load('user', builder => builder.select(['id', 'name', 'slug', 'avatar']))
            await service.load('tecnical', builder => builder.select(['id', 'name', 'slug', 'avatar']))
            await service.load('client', builder => builder.preload('address'))
            await service.load('items', builder => builder.preload('service_type'))
            await service.load('products', builder => builder.preload('product'))
            await service.load('service_payments', builder => {
                builder.preload('payment_method')
            })
            return response.status(200).send({data: service})
        } catch (error) {
            throw error
        }
    }

    async update({ params: { id }, request, response, auth }: HttpContextContract) {
        const trx = await Database.beginGlobalTransaction();
        const stockServ = new StockService()
        try {
            const { client_id, tecnical_id, discount_price, items, products, obs } = request.all();
            const service = await Service.findOrFail(id);
            
            if (!service) {
                return response.status(404).send({
                    message: 'Serviço não encontrado',
                });
            }
    
            service.merge({ client_id, discount_price, tecnical_id, obs });
            await service.save();

            let products_total = await stockServ.transact_adjust_stock_reserve_service(service, products, auth!.user?.id, discount_price, trx)

            let items_total = 0

            // Processamento de itens de serviço (sem produto)
            if(items && Array.isArray(items) && items.length > 0){
                await service.related('items').query().delete();

                await Promise.all(
                    items.map(async item => {
                        let actualPrice = item.unit_price
                        let actualDescription = item.description
                        
                        // Se foi fornecido um service_type_id, buscar o tipo e usar seus dados
                        if(item.service_type_id) {
                            const serviceType = await ServiceType.findOrFail(item.service_type_id)
                            // Se o preço do item não foi informado ou é igual ao do tipo, usar o preço do tipo
                            // Caso contrário, manter o preço informado no item
                            if(!item.unit_price || item.unit_price === serviceType.unit_price) {
                                actualPrice = serviceType.unit_price
                            }
                            actualDescription = actualDescription || serviceType.description
                        }
                        
                        //Criando o Item
                        await ServiceItem.create({
                            service_id: service.id,
                            service_type_id: item.service_type_id || null,
                            unit_price: actualPrice,
                            discount_price: item.discount_price,
                            description: actualDescription,
                            total: actualPrice - item.discount_price
                        }, trx)
                        
                    })
                )

                // Calculamos o total baseado nos itens realmente criados
                let createdItems = await ServiceItem.query().where('service_id', service.id)
                createdItems.map(item => {
                    items_total += item.unit_price
                })
            }

            service.merge({
                items_total,
                discount_price: discount_price,
                total: (items_total + products_total) - discount_price
            })

            await service.save()

            await trx.commit();
    
            // 🔹 Recarrega os relacionamentos para retornar os dados completos
            await service.load('user', builder => builder.select(['id', 'name', 'slug', 'avatar']));
            await service.load('tecnical', builder => builder.select(['id', 'name', 'slug', 'avatar']));
            await service.load('client', builder => builder.preload('address'));
            await service.load('items', builder => builder.preload('service_type'));
            await service.load('products', builder => builder.preload('product'));
    
            return response.status(200).send({ data: service });
        } catch (error) {
            throw error;
        }
    }

    async destroy({ params : { id }, response, auth }: HttpContextContract) {
        try {
            const service = await Service.findOrFail(id)

            let items = await ServiceProduct.query().where('service_id', service.id)
            let invoices = await ArInvoice.query().where('service_id', service.id)

            if(service.status == 'done' && Array.isArray(invoices) && invoices.length > 0){
                return response.status(400).send({
                    message: 'O serviço já foi concluído e faturado e não pode ser excluído.'
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
                            service_id: item.service_id,
                            product_id: item.product_id,
                            reason: `Serviço ${service.id} Excluído`,
                            type: 'reserve-cancel',
                            quantity: item.quantity,
                            balance: stock.quantity - balance,
                            user_id: auth!.user!.id
                        })
                    })
                )
            }

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

            await service.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }

    // async confirmOld({ params: { id }, response }: HttpContextContract) {
    //     let trx = await Database.beginGlobalTransaction();

    //     const arInvServ = new ArInvoiceService()
    
    //     try {
    //         const service = await Service.findOrFail(id);
    
    //         // 🔹 Marca o status como "done"
    //         service.merge({ status: 'done' });
    //         await service.save();

    //         await arInvServ.generateServiceInvoice({
    //             client_id: service.client_id,
    //             service_id: service.id,
    //             reference: null,
    //             payment_days: service.payment_days,
    //             installments: service.installments,
    //             payment_method_id: service.payment_method_id,
    //         }, trx)
    
    //         await trx.commit();
    
    //         // 🔹 Recarrega os relacionamentos para retornar os dados completos
    //         await service.load('user', builder => builder.select(['id', 'name', 'slug']));
    //         await service.load('tecnical', builder => builder.select(['id', 'name', 'slug']));
    //         await service.load('client', builder => builder.preload('address'));
    //         await service.load('items');
            
    
    //         return response.status(200).send({ data: service });
    //     } catch (error) {
    //         await trx.rollback();
    //         throw error;
    //     }
    // }

    async confirm({ params: { id }, response, auth }: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction();
        const stockServ = new StockService()
        const arInvServ = new ArInvoiceService()
    
        try {
            const service = await Service.findOrFail(id);
    
            // Carrega os itens da venda com os produtos e estoques
            await service.load('products', builder => {
                builder.preload('product', builder => {
                    builder.preload('stocks', builder => {
                        builder.whereHas('storage', b => b.where('principal_storage', 1))
                    });
                });
            });
            await service.load('invoices')
            await service.load('service_payments', builder => {
                builder.preload('payment_method')
            })

            const { service_payments, invoices } = service.toJSON()

            // Verifca se ainda não foram gerados os dados de pagamento
            if(!service_payments || service_payments.length == 0){
                // Não foram informados dados de pagamento da venda
                return response.status(400).send({
                    message: 'Não é possivel confirmar este serviço. Não foram encontrados os dados de pagamento desta venda.'
                })
            }

            // Não foram informados dados de pagamento da venda no financeiro
            if(Array.isArray(invoices) && invoices.length == 0){
                // Gera-se as faturas caso não tenham sido geradas até o momento
                await Promise.all(
                    service_payments.map(async service_payment => {
                        await arInvServ.generateServiceInvoice({
                            service,
                            service_payment
                        }, trx)
                        let pymnt = await ServicePayment.findOrFail(service_payment.id)
                        pymnt.merge({status: 'emited'})
                        await pymnt.save()
                    })
                )
            }

            // Foram informados dados de pagamento da venda no financeiro
            if(Array.isArray(invoices) && invoices.length > 0){
                // Contador
                let doEmit = service_payments.filter(x => x.status == 'pending')
                
                // Se houverem pagamentos pendentes para emitir, emiti-los imediatamente
                if(doEmit.length > 0){
                    await Promise.all(
                        doEmit.map(async service_payment => {
                            await arInvServ.generateServiceInvoice({
                                service,
                                service_payment
                            }, trx)
                            let pymnt = await ServicePayment.findOrFail(service_payment.id)
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
            await stockServ.transact_cancel_stock_reserve_service(service, auth!.user!.id, trx)
    
            // Marca a venda como "done"
            service.merge({ status: 'done' });
            await service.save();
    
            await trx.commit();
    
            // Recarrega os relacionamentos para retornar os dados completos
            await service.load('user', builder => builder.select(['id', 'name', 'slug']));
            await service.load('client', builder => builder.preload('address'));
            await service.load('products', builder => builder.preload('product', builder => {
                builder.preload('unit_in').preload('unit_out').preload('stocks', b => b.whereHas('storage', b => b.where('principal_storage', 1)));
            }));
    
            return response.status(200).send({ data: service });
        } catch (error) {
            throw error;
        }
    }
    
}

