import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination } from 'App/Helpers'
import ApCharge from 'App/Models/ApCharge'
import ApInvoice from 'App/Models/ApInvoice'
import ApPayment from 'App/Models/ApPayment'

export default class ApChargesController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let ap_charges: any = ApCharge.query()
            ap_charges.preload('ap_payment')
            ap_charges = await ApCharge.listFiltersPaginate(ctx, ap_charges)
            ap_charges = transform_pagination(ap_charges.toJSON())
            const filters = await generate_filters_to_send(ApCharge)
            return response.status(200).send({...ap_charges, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction()
        try {
            const { request, response } = ctx
            const { ap_payment_id, description, total_amount } = await request.all()
            
            const ap_charge = await ApCharge.create({
                ap_payment_id, description, total_amount: total_amount*100
            }, trx)

            let ap_payment = await ApPayment.findOrFail(ap_charge.ap_payment_id)
            let ap_invoice = await ApInvoice.findOrFail(ap_payment.ap_invoice_id)

            let value =  parseInt(ap_payment.value_total.toString()) + (parseInt(ap_charge.total_amount.toString()))

            ap_payment.merge({
                value_base: ap_payment.value_base,
                value_total: value
            })

            await ap_payment.save()

            ap_invoice.merge({
                total_amount: ap_invoice.total_amount + (parseInt(ap_charge.total_amount.toString()))
            })

            await ap_invoice.save()

            await trx.commit()

            await ap_charge.load('ap_payment')

            return response.status(200).send({data: ap_charge})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const ap_charge = await ApCharge.findOrFail(id)
            await ap_charge.load('ap_payment')
            return response.status(200).send({data: ap_charge})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
      const trx = await Database.beginGlobalTransaction()
        try {
            const { ap_payment_id, description } = await request.all()

            const ap_charge = await ApCharge.findOrFail(id)

            if(!ap_charge){
                return response.status(404).send({
                    message: 'Pagamento não encontrado'
                })
            }
            
            ap_charge.merge({
                ap_payment_id, description
            })
            await ap_charge.save()

            // let ap_payment = await ApPayment.findOrFail(ap_charge.ap_payment_id)

            // ap_payment.merge({
            //     amount_received: ap_payment.amount_received + ap_charge.total_amount
            // })

            // await ap_payment.save()

            await trx.commit()

            await ap_charge.load('ap_payment')

            return response.status(200).send({data: ap_charge})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const ap_charge = await ApCharge.findOrFail(id)

            let ap_payment = await ApPayment.findOrFail(ap_charge.ap_payment_id)
            let ap_invoice = await ApInvoice.findOrFail(ap_payment.ap_invoice_id)

            let value = parseInt(ap_payment.value_total.toString()) - parseInt(ap_charge.total_amount.toString())

            ap_payment.merge({
                value_base: ap_payment.value_base,
                value_total: value
            })
            ap_invoice.merge({
                total_amount: ap_invoice.total_amount - parseInt(ap_charge.total_amount.toString())
            })

            await ap_payment.save()
            await ap_invoice.save()

            await ap_charge.delete()

            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }
}

