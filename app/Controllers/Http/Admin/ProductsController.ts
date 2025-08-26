import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination, where_slug_or_id } from 'App/Helpers'
import Product from 'App/Models/Product'
import EntityService from 'App/Services/EntityService'
import Application from '@ioc:Adonis/Core/Application'
import path from 'path'
import Env from '@ioc:Adonis/Core/Env'
import fs from 'fs'
import PdfReportService from 'App/Services/PdfReportService'
import ProductService from 'App/Services/ProductService'
import ProductPrice from 'App/Models/ProductPrice'
import ProductCost from 'App/Models/ProductCost'

export default class ProductsController {

    async index(ctx: HttpContextContract) {
        try {
            let { request, response } = ctx
            let products: any = Product.query()
            products.preload('unit_in')
            products.preload('unit_out')
            products.preload('product_group')
            products.preload('product_category')
            products.preload('prices')
            products.preload('stocks', builder => {
                let storage_id = (request as any)?.requestData.storage_id
                if(storage_id){
                    builder.whereHas('storage', b => {
                        b.where('id', storage_id)
                    })
                }else{
                    builder.whereHas('storage', b => {
                        b.where('principal_storage', 1)
                    })
                }
                builder.preload('storage')
            })
            products = await Product.listFiltersPaginate(ctx, products)
            products = transform_pagination(products.toJSON())
            const filters = await generate_filters_to_send(Product)
            return response.status(200).send({...products, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        const enServ: EntityService = new EntityService();
        let trx = await Database.beginGlobalTransaction()
        try {
            const { request, response, auth } = ctx
            const { 
                name, 
                suppliers, 
                description, 
                barcode, 
                min_stock, 
                sale_price, 
                images, 
                unit_in_id, 
                unit_out_id, 
                conversion_factor, 
                product_group_id, 
                product_category_id 
            } = await request.all()
            const product = await Product.create({
                name, 
                description, 
                barcode, 
                min_stock, 
                sale_price, 
                images, 
                unit_in_id, 
                unit_out_id, 
                conversion_factor, 
                product_group_id, 
                product_category_id,
                last_cost: sale_price,
                avg_cost: sale_price,
                margin_percent: 0
            }, trx)
            await enServ.slugfy('Product', product, trx)

            if(Array.isArray(suppliers)){
                await product.related('suppliers').sync(suppliers, undefined, trx)
            }

            await ProductPrice.create({
                product_id: product.id,
                price: product.sale_price,
                user_id: auth!.user!.id,
                origin: 'manual'
            }, trx)

            await trx.commit()
            await product.load('unit_in')
            await product.load('unit_out')
            await product.load('product_group')
            await product.load('product_category')
            await product.load('suppliers')
            await product.load('prices')
            return response.status(200).send({data: product})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const product = await where_slug_or_id(Product, id)

            await product.load('unit_in')
            await product.load('unit_out')
            await product.load('product_group')
            await product.load('product_category')
            await product.load('stocks', builder => builder.preload('storage'))
            await product.load('suppliers')
            await product.load('prices', builder => builder.preload('user', b => b.select(['id','name','slug','avatar'])).preload('purchase_order').orderBy('id', 'desc'))
            await product.load('costs', builder => builder.preload('user', b => b.select(['id','name','slug','avatar'])).preload('purchase_order').orderBy('id', 'desc'))
            return response.status(200).send({data: product})
        } catch (error) {
            throw error
        }
    }

    async update({ params: { id }, request, response, auth }: HttpContextContract) {
        const enServ: EntityService = new EntityService()
        const trx = await Database.beginGlobalTransaction()

        try {
            const {
            name,
            suppliers,
            description,
            barcode,
            min_stock,
            sale_price,
            margin_percent,
            images,
            unit_in_id,
            unit_out_id,
            conversion_factor,
            product_group_id,
            product_category_id,
            } = request.all()

            const product = await where_slug_or_id(Product, id, trx)
            if (!product) {
            return response.status(404).send({ message: 'Produto não encontrado' })
            }

            const oldSalePrice = product.sale_price
            const newSalePrice = Number(sale_price)

            product.merge({
            name,
            description,
            barcode,
            min_stock,
            sale_price: newSalePrice,
            margin_percent,
            images,
            unit_in_id,
            unit_out_id,
            conversion_factor,
            product_group_id,
            product_category_id,
            })

            await product.save(trx)
            await enServ.slugfy('Product', product, trx)

            if (Array.isArray(suppliers)) {
                await product.related('suppliers').sync(suppliers, undefined, trx)
            }

            // Verifica se o sale_price foi alterado para criar o registro de preço
            if (oldSalePrice !== newSalePrice) {
                await ProductPrice.create({
                    product_id: product.id,
                    user_id: auth!.user!.id,
                    price: newSalePrice,
                    origin: 'manual'
                }, { client: trx })
            }

            await product.save(trx)

            await trx.commit()

            await product.load('unit_in')
            await product.load('unit_out')
            await product.load('product_group')
            await product.load('product_category')
            await product.load('suppliers')
            await product.load('prices', builder => builder.preload('user', b => b.select(['id','name','slug','avatar'])).orderBy('id', 'desc'))
            await product.load('costs', builder => builder.preload('user', b => b.select(['id','name','slug','avatar'])).orderBy('id', 'desc'))

            return response.status(200).send({ data: product })
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const product = await where_slug_or_id(Product, id)
            await product.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }

    async uploadImage(ctx: HttpContextContract) {

        const { params : { id }, request, response } = ctx
        const trx = await Database.beginGlobalTransaction()
    
        try {
            const file = request.file('file', {
              size: '5mb',
            });
    
            if(file){

                const outputDir = Application.publicPath('uploads');
                const uniqueName = `${file.clientName}`//`task_${type == 'image' ? 'image' : 'file'}_${task.id}_${Date.now()}.${file.extname}`;
                const outputPath = path.join(outputDir);
                const file_url = `${Env.get('SERVER_URL')}/uploads/${uniqueName}`

                let product = await Product.findOrFail(id)

                if(product.images && product.images.length > 0){
                    await Promise.all(
                        product.images.map(async image => {
                            await fs.unlinkSync(`${outputPath}/${image.filename}`)
                        })
                    )
                }

                await file.move(outputPath)

                product.merge({
                    images: JSON.stringify([{
                        url: file_url,
                        filename: uniqueName
                    }])
                })

                await product.save()

                await trx.commit()
    
                return response.status(200).send({data: {
                    url: file_url,
                    filename: uniqueName
                }})
            }
        } catch (error) {
            throw error
        }
    }

    async search({ params: { searchString }, response }: HttpContextContract) {
        try {
          let products = await Product.query()
            .where('id', searchString)
            .preload('stocks')
            .preload('product_category')
            .preload('product_group')
            .preload('unit_in')
            .preload('unit_out')
            .preload('suppliers');
      
          if (products.length === 0) {
            products = await Product.query()
              .where('name', 'LIKE', `%${searchString}%`)
              .preload('stocks')
              .preload('product_category')
              .preload('product_group')
              .preload('unit_in')
              .preload('unit_out')
              .preload('suppliers');
          }
      
          if (products.length === 0) {
            products = await Product.query()
              .where('barcode', 'LIKE', `%${searchString}%`)
              .preload('stocks')
              .preload('product_category')
              .preload('product_group')
              .preload('unit_in')
              .preload('unit_out')
              .preload('suppliers');
          }
      
          return response.ok({ data: products });
        } catch (error) {
          throw error;
        }
    }

    async searchSupplier({ params: { supplier_id }, response }: HttpContextContract) {
        try {
          let products

          products = await Product.query()
            .whereHas('suppliers', builder => builder.where('id', supplier_id))
            .preload('stocks')
            .preload('product_category')
            .preload('product_group')
            .preload('unit_in')
            .preload('unit_out')
            .preload('suppliers');

        if(products.length == 0){
            products = await Product.query()
            .preload('stocks')
            .preload('product_category')
            .preload('product_group')
            .preload('unit_in')
            .preload('unit_out')
            .preload('suppliers');
        }
      
          return response.ok({ data: products });
        } catch (error) {
          throw error;
        }
    }

    async report({ response}: HttpContextContract) {

        let products = await Product.query()

        await PdfReportService.generateProductsReport(response, {
            title: 'Relatório de Produtos',
            columns: [
                { label: 'Código', key: 'reference' },
                { label: 'Nome', key: 'name' },
                { label: 'Preço', key: 'sale_price' },
                { label: 'Status', key: 'status' },
            ],
            data: products,
            fileName: 'produtos.pdf'
        })

    }

    async updateCost({ params: { id }, request, response, auth }: HttpContextContract) {
        const trx = await Database.beginGlobalTransaction()
        const service = new ProductService()

        try {
            const { price } = request.all()

            const product = await where_slug_or_id(Product, id, trx)
            if (!product) {
            return response.status(404).send({ message: 'Produto não encontrado' })
            }

            await ProductCost.create({
                product_id: product.id,
                user_id: auth!.user!.id,
                origin: 'manual',
                price
            }, trx)

            let costs = await service.calculateProductCosts(product.id, trx)

            product.merge({
                last_cost: price,
                avg_cost: costs.avgCost
            })

            await product.save()

            await trx.commit()

            await product.load('unit_in')
            await product.load('unit_out')
            await product.load('product_group')
            await product.load('product_category')
            await product.load('suppliers')

            return response.status(200).send({ data: product })
        } catch (error) {
            throw error
        }
    }
      
}
