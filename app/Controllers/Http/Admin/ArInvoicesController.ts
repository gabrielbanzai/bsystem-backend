import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Bull from '@ioc:Rocketseat/Bull'
import { generate_filters_to_send, transform_pagination } from 'App/Helpers'
import ArInvoice from 'App/Models/ArInvoice'
import Sale from 'App/Models/Sale'
import { addDays, addMonths, format, setDate } from 'date-fns'
import CheckInvoiceJob from 'App/Jobs/CheckArInvoicePayment'
import CheckReceiptJob from 'App/Jobs/CheckArReceiptPayment'
import ArReceipt from 'App/Models/ArReceipt'
import SalePayment from 'App/Models/SalePayment'


export default class ArInvoicesController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let ar_invoices: any = ArInvoice.query()
            ar_invoices.preload('client')
            ar_invoices.preload('sale')
            ar_invoices.preload('service')
            ar_invoices = await ArInvoice.listFiltersPaginate(ctx, ar_invoices)
            ar_invoices = transform_pagination(ar_invoices.toJSON())
            const filters = await generate_filters_to_send(ArInvoice)
            return response.status(200).send({...ar_invoices, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        let trx = await Database.beginGlobalTransaction()
        try {
            const { request, response } = ctx
            const { client_id, sale_id, reference, installments, sale_payment_id } = await request.all()
            
            //Checar primeiro se o pagamento já não foi emitido
            const ar_invoice_check = await ArInvoice.query()
            .where('sale_payment_id', sale_payment_id)
            .first()

            if(ar_invoice_check){
                return response.status(400).send({message: 'Pagamento já emitido.'})
            }

            const sale_payment= await SalePayment.findOrFail(sale_payment_id)

            const sale = await Sale.findOrFail(sale_id)

            //Definida a data de vencimento total da fatura baseado no número de parcelas
            let due_date =  format(addDays(new Date(), sale_payment.payment_days + (installments*30)), 'yyyy-MM-dd HH:mm:ss')
            
            const ar_invoice = await ArInvoice.create({
                client_id, 
                sale_id, 
                reference,
                installments,
                total_amount: sale_payment.value_total,
                issue_date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                due_date: due_date,
                sale_payment_id
            }, trx)

            const job = await Bull.schedule(new CheckInvoiceJob().key, {ar_invoice: ar_invoice.toJSON()}, new Date(due_date), { removeOnComplete: true })

            ar_invoice.merge({
                check_payment_job_id: job.id
            })

            await ar_invoice.save()

            if(ar_invoice.installments && ar_invoice.installments > 0){

                let value = Math.floor(
                parseInt(ar_invoice.total_amount.toString()) /
                parseInt(ar_invoice.installments.toString())
                )
                const baseDate = addDays(new Date(), sale_payment.payment_days)
                const dayOfMonth = baseDate.getDate()

                let valueCount = 0

                for (let i = 1; i <= ar_invoice.installments; i++) {

                    let dueDate = addMonths(baseDate, i - 1)
                    dueDate = setDate(dueDate, dayOfMonth)

                    let payment_due_date

                    //Primeira passagem do loop vai considerar o payment_days no cálculo da data de vencimento
                    if(i == 1){
                        payment_due_date = format(addDays(new Date(), sale_payment.payment_days), 'yyyy-MM-dd HH:mm:ss')
                    }else{
                        payment_due_date = dueDate
                    }

                    if(i == ar_invoice.installments){
                        value = ar_invoice.total_amount-valueCount
                        ar_invoice.merge({
                            due_date: payment_due_date
                        })
                        await ar_invoice.save()
                    }else{
                        valueCount+=value
                    }

                    let ar_receipt = await ArReceipt.create({
                        value_base: value,
                        value_total: value,
                        reference: `Fatura ${ar_invoice.id} (${i} / ${ar_invoice.installments}) - Venda: ${sale.id}`,
                        ar_invoice_id: ar_invoice.id,
                        installment_number: i,
                        payment_method_id: sale_payment.payment_method_id,
                        status: 'pending',
                        due_date: payment_due_date
                    }, trx)

                    // const paymentjob = await Bull.schedule(new CheckPaymentDueJob().key, {ar_receipt: ar_receipt.toJSON()}, addSeconds(new Date(), 5), { removeOnComplete: true })
                    const paymentjob = await Bull.schedule(new CheckReceiptJob().key, {ar_receipt: ar_receipt.toJSON()}, new Date(payment_due_date), { removeOnComplete: true })

                    ar_receipt.merge({
                        check_payment_job_id: paymentjob.id
                    })

                    await ar_receipt.save()
                }
            }

            //Buscar o pagamento do pedido para efetuar a alteração de status
            const pymnt = await SalePayment.query().where('id', sale_payment_id).first()

            if(pymnt){
                pymnt.merge({
                    status: 'emited'
                })
                await pymnt.save()
            }
                    
            await trx.commit()

            await ar_invoice.load('client', builder => builder.preload('address'))
            await ar_invoice.load('sale')
            await ar_invoice.load('service')
            await ar_invoice.load('ar_receipts', builder => builder.preload('ar_charges'))

            return response.status(200).send({data: ar_invoice})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const ar_invoice = await ArInvoice.findOrFail(id)
            await ar_invoice.load('client', builder => builder.preload('address'))
            await ar_invoice.load('sale')
            await ar_invoice.load('service')
            await ar_invoice.load('ar_receipts', builder => builder.preload('ar_charges'))
            return response.status(200).send({data: ar_invoice})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
      const trx = await Database.beginGlobalTransaction()
        try {
            const { client_id, sale_id, reference, issue_date, due_date } = await request.all()

            const ar_invoice = await ArInvoice.findOrFail(id)

            if(!ar_invoice){
                return response.status(404).send({
                    message: 'Remessa de pagamento não encontrada'
                })
            }
            
            const sale = await Sale.findOrFail(sale_id)
            
            ar_invoice.merge({
                client_id, 
                sale_id, 
                reference,
                total_amount: sale.total,
                issue_date: issue_date,
                due_date: due_date
            })
            await ar_invoice.save()

            await Bull.remove('EC-CheckArInvoicePayment', ar_invoice.check_payment_job_id)

            // const job = await Bull.schedule(new CheckPaymentJob().key, {ar_invoice: ar_invoice.toJSON()}, addSeconds(new Date(), 5), { removeOnComplete: true })
            const job = await Bull.schedule(new CheckInvoiceJob().key, {ar_invoice: ar_invoice.toJSON()}, new Date(due_date), { removeOnComplete: true })

            ar_invoice.merge({
                check_payment_job_id: job.id
            })

            await ar_invoice.save()

            await trx.commit()

            await ar_invoice.load('client', builder => builder.preload('address'))
            await ar_invoice.load('sale')
            await ar_invoice.load('service')
            await ar_invoice.load('ar_receipts', builder => builder.preload('ar_charges'))

            return response.status(200).send({data: sale})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const ar_invoice = await ArInvoice.findOrFail(id)
            await Bull.remove('EC-CheckArInvoicePayment', ar_invoice.check_payment_job_id)
            await ar_invoice.softDelete()

            const receipts = await ar_invoice.related('ar_receipts').query()

            if(Array.isArray(receipts) && receipts.length > 0){
                await Promise.all(
                    receipts.map(async receipt => {
                        await receipt.softDelete()
                        await Bull.remove('EC-CheckArReceiptPayment', receipt.check_payment_job_id)
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
            const ar_invoice = await ArInvoice.findOrFail(id)

            ar_invoice.merge({
                status: 'paid'
            })

            await ar_invoice.save()

            return response.status(200).send({data: ar_invoice})
        } catch (error) {
            throw error
        }
    }

}

