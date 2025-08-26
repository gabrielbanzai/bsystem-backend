import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination } from 'App/Helpers'
import ArReceipt from 'App/Models/ArReceipt'
import CheckPaymentDueJob from 'App/Jobs/CheckArReceiptPayment'
import Bull from '@ioc:Rocketseat/Bull'

export default class ArReceiptsController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let ar_receipts: any = ArReceipt.query()
            ar_receipts.preload('client')
            ar_receipts.preload('purchase_order')
            ar_receipts = await ArReceipt.listFiltersPaginate(ctx, ar_receipts)
            ar_receipts = transform_pagination(ar_receipts.toJSON())
            const filters = await generate_filters_to_send(ArReceipt)
            return response.status(200).send({...ar_receipts, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction()
        try {
            const { request, response } = ctx
            const { ar_invoice_id, payment_method_id, bank_account_id, value_base, reference, due_date } = await request.all()
            
            const ar_receipt = await ArReceipt.create({
                ar_invoice_id, payment_method_id, bank_account_id, value_base, value_total: value_base, due_date, reference
            }, trx)

            const job = await Bull.schedule(new CheckPaymentDueJob().key, {ar_receipt: ar_receipt.toJSON()}, due_date, { removeOnComplete: true })

            ar_receipt.merge({
                check_payment_job_id: job.id
            })

            await ar_receipt.save()

            await trx.commit()

            await ar_receipt.load('bank_account')
            await ar_receipt.load('payment_method')

            return response.status(200).send({data: ar_receipt})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const ar_receipt = await ArReceipt.findOrFail(id)
            await ar_receipt.load('bank_account')
            await ar_receipt.load('payment_method')
            return response.status(200).send({data: ar_receipt})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
      const trx = await Database.beginGlobalTransaction()
        try {
            const { ar_invoice_id, payment_method_id, bank_account_id, reference, due_date } = await request.all()

            const ar_receipt = await ArReceipt.findOrFail(id)

            if(!ar_receipt){
                return response.status(404).send({
                    message: 'Remessa de cobrança não encontrada'
                })
            }
            
            ar_receipt.merge({
                ar_invoice_id, payment_method_id, bank_account_id, reference, due_date
            })
            await ar_receipt.save()

            await Bull.remove('EC-CheckArReceiptPayment', ar_receipt.check_payment_job_id)

            const job = await Bull.schedule(new CheckPaymentDueJob().key, {ap_invoice: ar_receipt.toJSON()}, new Date(due_date), { removeOnComplete: true })

            ar_receipt.merge({
                check_payment_job_id: job.id
            })

            await ar_receipt.save()

            await trx.commit()

            await ar_receipt.load('bank_account')
            await ar_receipt.load('payment_method')

            return response.status(200).send({data: ar_receipt})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const ar_receipt = await ArReceipt.findOrFail(id)
            await ar_receipt.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }

    async done({ params : { id }, response }: HttpContextContract) {
        try {
            const ar_receipt = await ArReceipt.findOrFail(id)

            ar_receipt.merge({
                status: 'paid'
            })

            await ar_receipt.save()

            return response.status(200).send({data: ar_receipt})
        } catch (error) {
            throw error
        }
    }
}

