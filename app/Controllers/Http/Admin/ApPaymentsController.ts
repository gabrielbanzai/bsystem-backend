import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination } from 'App/Helpers'
import ApPayment from 'App/Models/ApPayment'
import CheckPaymentDueJob from 'App/Jobs/CheckPaymentDue'
import Bull from '@ioc:Rocketseat/Bull'

export default class ApPaymentsController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let ap_payments: any = ApPayment.query()
            ap_payments.preload('supplier')
            ap_payments.preload('purchase_order')
            ap_payments = await ApPayment.listFiltersPaginate(ctx, ap_payments)
            ap_payments = transform_pagination(ap_payments.toJSON())
            const filters = await generate_filters_to_send(ApPayment)
            return response.status(200).send({...ap_payments, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction()
        try {
            const { request, response } = ctx
            const { ap_invoice_id, payment_method_id, bank_account_id, value_base, reference, due_date } = await request.all()
            
            const ap_payment = await ApPayment.create({
                ap_invoice_id, payment_method_id, bank_account_id, value_base, value_total: value_base, due_date, reference
            }, trx)

            const job = await Bull.schedule(new CheckPaymentDueJob().key, {ap_payment: ap_payment.toJSON()}, due_date, { removeOnComplete: true })

            ap_payment.merge({
                check_payment_job_id: job.id
            })

            await ap_payment.save()

            await trx.commit()

            await ap_payment.load('bank_account')
            await ap_payment.load('payment_method')

            return response.status(200).send({data: ap_payment})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const ap_payment = await ApPayment.findOrFail(id)
            await ap_payment.load('bank_account')
            await ap_payment.load('payment_method')
            return response.status(200).send({data: ap_payment})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
      const trx = await Database.beginGlobalTransaction()
        try {
            const { ap_invoice_id, payment_method_id, bank_account_id, reference, due_date } = await request.all()

            const ap_payment = await ApPayment.findOrFail(id)

            if(!ap_payment){
                return response.status(404).send({
                    message: 'Remessa de pagamento não encontrada'
                })
            }
            
            ap_payment.merge({
                ap_invoice_id, payment_method_id, bank_account_id, reference, due_date
            })
            await ap_payment.save()

            await Bull.remove('EC-CheckInvoicePayment', ap_payment.check_payment_job_id)

            const job = await Bull.schedule(new CheckPaymentDueJob().key, {ap_invoice: ap_payment.toJSON()}, new Date(due_date), { removeOnComplete: true })

            ap_payment.merge({
                check_payment_job_id: job.id
            })

            await ap_payment.save()

            await trx.commit()

            await ap_payment.load('bank_account')
            await ap_payment.load('payment_method')

            return response.status(200).send({data: ap_payment})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const ap_payment = await ApPayment.findOrFail(id)
            await ap_payment.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }

    async done({ params : { id }, response }: HttpContextContract) {
        try {
            const ap_payment = await ApPayment.findOrFail(id)

            ap_payment.merge({
                status: 'paid'
            })

            await ap_payment.save()

            return response.status(200).send({data: ap_payment})
        } catch (error) {
            throw error
        }
    }
}

