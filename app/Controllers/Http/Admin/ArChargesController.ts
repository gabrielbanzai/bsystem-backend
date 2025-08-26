import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination } from 'App/Helpers'
import ArCharge from 'App/Models/ArCharge'
import ArInvoice from 'App/Models/ArInvoice'
import ArReceipt from 'App/Models/ArReceipt'

export default class ArChargesController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let ar_charges: any = ArCharge.query()
            ar_charges.preload('ar_receipt')
            ar_charges = await ArCharge.listFiltersPaginate(ctx, ar_charges)
            ar_charges = transform_pagination(ar_charges.toJSON())
            const filters = await generate_filters_to_send(ArCharge)
            return response.status(200).send({...ar_charges, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction()
        try {
            const { request, response } = ctx
            const { ar_receipt_id, description, total_amount } = await request.all()
            
            const ar_charge = await ArCharge.create({
                ar_receipt_id, description, total_amount: total_amount*100
            }, trx)

            let ar_receipt = await ArReceipt.findOrFail(ar_charge.ar_receipt_id)
            let ar_invoice = await ArInvoice.findOrFail(ar_receipt.ar_invoice_id)

            let value =  parseInt(ar_receipt.value_total.toString()) + (parseInt(ar_charge.total_amount.toString()))

            ar_receipt.merge({
                value_base: ar_receipt.value_base,
                value_total: value
            })

            await ar_receipt.save()

            ar_invoice.merge({
                total_amount: ar_invoice.total_amount + (parseInt(ar_charge.total_amount.toString()))
            })

            await ar_invoice.save()

            await trx.commit()

            await ar_charge.load('ar_receipt')

            return response.status(200).send({data: ar_charge})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const ar_charge = await ArCharge.findOrFail(id)
            await ar_charge.load('ar_receipt')
            return response.status(200).send({data: ar_charge})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
      const trx = await Database.beginGlobalTransaction()
        try {
            const { ar_receipt_id, description } = await request.all()

            const ar_charge = await ArCharge.findOrFail(id)

            if(!ar_charge){
                return response.status(404).send({
                    message: 'Cobrança não encontrada'
                })
            }
            
            ar_charge.merge({
                ar_receipt_id, description
            })
            await ar_charge.save()

            // let ar_receipt = await ArReceipt.findOrFail(ar_charge.ar_receipt_id)

            // ar_receipt.merge({
            //     amount_received: ar_receipt.amount_received + ar_charge.total_amount
            // })

            // await ar_receipt.save()

            await trx.commit()

            await ar_charge.load('ar_receipt')

            return response.status(200).send({data: ar_charge})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const ar_charge = await ArCharge.findOrFail(id)

            let ar_receipt = await ArReceipt.findOrFail(ar_charge.ar_receipt_id)
            let ar_invoice = await ArInvoice.findOrFail(ar_receipt.ar_invoice_id)

            let value = parseInt(ar_receipt.value_total.toString()) - parseInt(ar_charge.total_amount.toString())

            ar_receipt.merge({
                value_base: ar_receipt.value_base,
                value_total: value
            })
            ar_invoice.merge({
                total_amount: ar_invoice.total_amount - parseInt(ar_charge.total_amount.toString())
            })

            await ar_receipt.save()
            await ar_invoice.save()

            await ar_charge.delete()

            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }
}

