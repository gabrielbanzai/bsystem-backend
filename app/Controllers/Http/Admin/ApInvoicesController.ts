import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination } from 'App/Helpers'
import ApInvoice from 'App/Models/ApInvoice'
import ApPayment from 'App/Models/ApPayment'
import PurchaseOrder from 'App/Models/PurchaseOrder'
import { addDays, addMonths, format, setDate } from 'date-fns'
import CheckPaymentJob from 'App/Jobs/CheckInvoicePayment'
import CheckPaymentDueJob from 'App/Jobs/CheckPaymentDue'
import Bull from '@ioc:Rocketseat/Bull'
import ApInvoiceService from 'App/Services/ApInvoiceService'
import PurchaseOrderPayment from 'App/Models/PurchaseOrderPayment'

export default class ApInvoicesController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let ap_invoices: any = ApInvoice.query()
            ap_invoices.preload('supplier')
            ap_invoices.preload('purchase_order')
            ap_invoices = await ApInvoice.listFiltersPaginate(ctx, ap_invoices)
            ap_invoices = transform_pagination(ap_invoices.toJSON())
            const filters = await generate_filters_to_send(ApInvoice)
            return response.status(200).send({...ap_invoices, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction()
        try {
            const service = new ApInvoiceService()
            const { request, response } = ctx
            const { supplier_id, purchase_order_id, invoice_number, payment_days, installments, purchase_order_payment_id } = await request.all()

            //Checar primeiro se o pagamento já não foi emitido
            const ap_invoice_check = await ApInvoice.query()
            .where('purchase_order_payment_id', purchase_order_payment_id)
            .first()

            if(ap_invoice_check){
                return response.status(400).send({message: 'Pagamento já emitido.'})
            }
            
            const order_payment= await PurchaseOrderPayment.findOrFail(purchase_order_payment_id)
            
            const purchase_order = await PurchaseOrder.findOrFail(purchase_order_id)

            //Definida a data de vencimento total da fatura baseado no número de parcelas
            let due_date = format(addDays(new Date(), payment_days + (installments*30)), 'yyyy-MM-dd HH:mm:ss')

            if(payment_days == 0){
                due_date = format(await service.getJobScheduleDate(payment_days, new Date(due_date)), 'yyyy-MM-dd HH:mm:ss')
            }
            
            const ap_invoice = await ApInvoice.create({
                supplier_id, 
                purchase_order_id, 
                invoice_number,
                installments,
                total_amount: order_payment.value_total,
                issue_date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                due_date: due_date,
                purchase_order_payment_id,
            }, trx)

            // const job = await Bull.schedule(new CheckPaymentJob().key, {ap_invoice: ap_invoice.toJSON()}, addSeconds(new Date(), 5), { removeOnComplete: true })
            const job = await Bull.schedule(new CheckPaymentJob().key, {ap_invoice: ap_invoice.toJSON()}, new Date(due_date), { removeOnComplete: true })

            ap_invoice.merge({
                check_payment_job_id: job.id
            })

            await ap_invoice.save()

            if(ap_invoice.installments && ap_invoice.installments > 0){

                let value = Math.floor(
                parseInt(ap_invoice.total_amount.toString()) /
                parseInt(ap_invoice.installments.toString())
                )
                const baseDate = addDays(new Date(), payment_days)
                const dayOfMonth = baseDate.getDate()

                let valueCount = 0

                for (let i = 1; i <= ap_invoice.installments; i++) {

                    let dueDate = addMonths(baseDate, i - 1)
                    dueDate = setDate(dueDate, dayOfMonth)

                    let payment_due_date

                    //Primeira passagem do loop vai considerar o payment_days no cálculo da data de vencimento
                    if(i == 1){
                        payment_due_date = format(addDays(new Date(), payment_days), 'yyyy-MM-dd HH:mm:ss')
                    }else{
                        payment_due_date = dueDate
                    }

                    if(i == ap_invoice.installments){
                        value = ap_invoice.total_amount-valueCount
                        ap_invoice.merge({
                            due_date: payment_due_date
                        })
                        await ap_invoice.save()
                    }else{
                        valueCount+=value
                    }

                    if(payment_days == 0){
                        payment_due_date = format(await service.getJobScheduleDate(payment_days, new Date(payment_due_date)), 'yyyy-MM-dd HH:mm:ss')
                    }

                    let ap_payment = await ApPayment.create({
                        value_base: value,
                        value_total: value,
                        reference: `Fatura ${ap_invoice.id} (${i} / ${ap_invoice.installments}) - Pedido de compra: ${purchase_order.id}`,
                        ap_invoice_id: ap_invoice.id,
                        installment_number: i,
                        payment_method_id: order_payment.payment_method_id,
                        status: 'pending',
                        due_date: payment_due_date
                    }, trx)
                    

                    // const paymentjob = await Bull.schedule(new CheckPaymentDueJob().key, {ap_payment: ap_payment.toJSON()}, addSeconds(new Date(), 5), { removeOnComplete: true })
                    const paymentjob = await Bull.schedule(new CheckPaymentDueJob().key, {ap_payment: ap_payment.toJSON()}, new Date(payment_due_date), { removeOnComplete: true })

                    ap_payment.merge({
                        check_payment_job_id: paymentjob.id
                    })

                    await ap_payment.save()
                }
            }

            //Buscar o pagamento do pedido para efetuar a alteração de status
            const pymnt = await PurchaseOrderPayment.query().where('id', purchase_order_payment_id).first()

            if(pymnt){
                pymnt.merge({
                    status: 'emited'
                })
                await pymnt.save()
            }
                    
            await trx.commit()

            await ap_invoice.load('supplier', builder => builder.preload('address'))
            await ap_invoice.load('purchase_order')
            await ap_invoice.load('ap_payments', builder => builder.preload('ap_charges').preload('payment_method'))

            return response.status(200).send({data: ap_invoice})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const ap_invoice = await ApInvoice.findOrFail(id)
            await ap_invoice.load('supplier', builder => builder.preload('address'))
            await ap_invoice.load('purchase_order')
            await ap_invoice.load('ap_payments', builder => builder.preload('ap_charges').preload('payment_method'))
            return response.status(200).send({data: ap_invoice})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
      const trx = await Database.beginGlobalTransaction()
        try {
            const { supplier_id, purchase_order_id, invoice_number, issue_date, due_date } = await request.all()

            const ap_invoice = await ApInvoice.findOrFail(id)

            if(!ap_invoice){
                return response.status(404).send({
                    message: 'Remessa de pagamento não encontrada'
                })
            }
            
            const purchase_order = await PurchaseOrder.findOrFail(purchase_order_id)
            
            ap_invoice.merge({
                supplier_id, 
                purchase_order_id, 
                invoice_number,
                total_amount: purchase_order.total,
                issue_date: issue_date,
                due_date: due_date
            })
            await ap_invoice.save()

            await Bull.remove('EC-CheckInvoicePayment', ap_invoice.check_payment_job_id)

            // const job = await Bull.schedule(new CheckPaymentJob().key, {ap_invoice: ap_invoice.toJSON()}, addSeconds(new Date(), 5), { removeOnComplete: true })
            const job = await Bull.schedule(new CheckPaymentJob().key, {ap_invoice: ap_invoice.toJSON()}, new Date(due_date), { removeOnComplete: true })

            ap_invoice.merge({
                check_payment_job_id: job.id
            })

            await ap_invoice.save()

            await trx.commit()

            await ap_invoice.load('supplier', builder => builder.preload('address'))
            await ap_invoice.load('purchase_order')
            await ap_invoice.load('ap_payments', builder => builder.preload('ap_charges').preload('payment_method'))

            return response.status(200).send({data: purchase_order})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const ap_invoice = await ApInvoice.findOrFail(id)
            await Bull.remove('EC-CheckPaymentJob', ap_invoice.check_payment_job_id)
            await ap_invoice.softDelete()

            const payments = await ap_invoice.related('ap_payments').query()

            if(Array.isArray(payments) && payments.length > 0){
                await Promise.all(
                    payments.map(async payment => {
                        await payment.softDelete()
                        await Bull.remove('EC-CheckPaymentDue', payment.check_payment_job_id)
                    })
                )
            }

            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }

    async done({ params : { id }, response }: HttpContextContract) {
        try {
            const ap_invoice = await ApInvoice.findOrFail(id)

            ap_invoice.merge({
                status: 'paid'
            })

            await ap_invoice.save()

            return response.status(200).send({data: ap_invoice})
        } catch (error) {
            throw error
        }
    }
}

