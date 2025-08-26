import Bull from "@ioc:Rocketseat/Bull"
import ArInvoice from "App/Models/ArInvoice"
import { addDays, addMonths, format, setDate } from "date-fns"
import CheckPaymentJob from 'App/Jobs/CheckInvoicePayment'
import CheckPaymentDueJob from 'App/Jobs/CheckPaymentDue'
import ArReceipt from "App/Models/ArReceipt"

class ArInvoiceService {
  
  public async generateSaleInvoice(data, trx){

    const { sale, sale_payment } = data

    //Definida a data de vencimento total da fatura baseado no número de parcelas
    let due_date =  format(addDays(new Date(), sale_payment.payment_days + (sale_payment.installments*30)), 'yyyy-MM-dd HH:mm:ss')
    
    const ar_invoice = await ArInvoice.create({
      client_id: sale.client_id, 
      sale_id: sale.id, 
      installments: sale_payment.installments,
      total_amount: sale_payment.value_total,
      issue_date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      due_date: due_date,
    }, trx)

    let date = await this.getJobScheduleDate(sale_payment.payment_days, new Date(due_date))

    // const job = await Bull.schedule(new CheckPaymentJob().key, {ap_invoice: ap_invoice.toJSON()}, addSeconds(new Date(), 5), { removeOnComplete: true })
    const job = await Bull.schedule(new CheckPaymentJob().key, {ap_invoice: ar_invoice.toJSON()}, date, { removeOnComplete: true })

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
                due_date: payment_due_date,
            }, trx)

            let date2 = await this.getJobScheduleDate(sale_payment.payment_days, new Date(payment_due_date))

            // const paymentjob = await Bull.schedule(new CheckPaymentDueJob().key, {ar_receipt: ar_receipt.toJSON()}, addSeconds(new Date(), 5), { removeOnComplete: true })
            const paymentjob = await Bull.schedule(new CheckPaymentDueJob().key, {ar_receipt: ar_receipt.toJSON()}, date2, { removeOnComplete: true })

            ar_receipt.merge({
                check_payment_job_id: paymentjob.id
            })

            await ar_receipt.save()
        }
    }
  }

  public async generateServiceInvoice(data, trx){

    const { service, service_payment } = data

    //Definida a data de vencimento total da fatura baseado no número de parcelas
    let due_date =  format(addDays(new Date(), service_payment.payment_days + (service_payment.installments*30)), 'yyyy-MM-dd HH:mm:ss')
    
    const ar_invoice = await ArInvoice.create({
      client_id: service.client_id, 
      service_id: service.id, 
      installments: service_payment.installments,
      total_amount: service_payment.value_total,
      issue_date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      due_date: due_date,
    }, trx)

    let date = await this.getJobScheduleDate(service_payment.payment_days, new Date(due_date))

    // const job = await Bull.schedule(new CheckPaymentJob().key, {ap_invoice: ap_invoice.toJSON()}, addSeconds(new Date(), 5), { removeOnComplete: true })
    const job = await Bull.schedule(new CheckPaymentJob().key, {ap_invoice: ar_invoice.toJSON()}, date, { removeOnComplete: true })

    ar_invoice.merge({
        check_payment_job_id: job.id
    })

    await ar_invoice.save()

    if(ar_invoice.installments && ar_invoice.installments > 0){

        let value = Math.floor(
        parseInt(ar_invoice.total_amount.toString()) /
        parseInt(ar_invoice.installments.toString())
        )
        const baseDate = addDays(new Date(), service_payment.payment_days)
        const dayOfMonth = baseDate.getDate()

        let valueCount = 0

        for (let i = 1; i <= ar_invoice.installments; i++) {

            let dueDate = addMonths(baseDate, i - 1)
            dueDate = setDate(dueDate, dayOfMonth)

            let payment_due_date

            //Primeira passagem do loop vai considerar o payment_days no cálculo da data de vencimento
            if(i == 1){
                payment_due_date = format(addDays(new Date(), service_payment.payment_days), 'yyyy-MM-dd HH:mm:ss')
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
                reference: `Fatura ${ar_invoice.id} (${i} / ${ar_invoice.installments}) - Serviço: ${service.id}`,
                ar_invoice_id: ar_invoice.id,
                installment_number: i,
                payment_method_id: service_payment.payment_method_id,
                status: 'pending',
                due_date: payment_due_date,
            }, trx)

            let date2 = await this.getJobScheduleDate(service_payment.payment_days, new Date(payment_due_date))

            // const paymentjob = await Bull.schedule(new CheckPaymentDueJob().key, {ar_receipt: ar_receipt.toJSON()}, addSeconds(new Date(), 5), { removeOnComplete: true })
            const paymentjob = await Bull.schedule(new CheckPaymentDueJob().key, {ar_receipt: ar_receipt.toJSON()}, date2, { removeOnComplete: true })

            ar_receipt.merge({
                check_payment_job_id: paymentjob.id
            })

            await ar_receipt.save()
        }
    }

    // const { client_id, service_id, invoice_number, payment_days, installments, payment_method_id } = data

    // const service = await Service.findOrFail(service_id)

    // //Definida a data de vencimento total da fatura baseado no número de parcelas
    // let due_date =  format(addDays(new Date(), payment_days + (installments*30)), 'yyyy-MM-dd HH:mm:ss')
    
    // const ar_invoice = await ArInvoice.create({
    //   client_id, 
    //   service_id, 
    //   reference: invoice_number,
    //   installments,
    //   total_amount: service.total,
    //   issue_date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    //   due_date: due_date,
    // }, trx)

    // let date = await this.getJobScheduleDate(payment_days, new Date(due_date))

    // // const job = await Bull.schedule(new CheckPaymentJob().key, {ap_invoice: ap_invoice.toJSON()}, addSeconds(new Date(), 5), { removeOnComplete: true })
    // const job = await Bull.schedule(new CheckPaymentJob().key, {ap_invoice: ar_invoice.toJSON()}, date, { removeOnComplete: true })

    // ar_invoice.merge({
    //     check_payment_job_id: job.id
    // })

    // await ar_invoice.save()

    // if(ar_invoice.installments && ar_invoice.installments > 0){

    //     let value = Math.floor(
    //     parseInt(ar_invoice.total_amount.toString()) /
    //     parseInt(ar_invoice.installments.toString())
    //     )
    //     const baseDate = addDays(new Date(), payment_days)
    //     const dayOfMonth = baseDate.getDate()

    //     let valueCount = 0

    //     for (let i = 1; i <= ar_invoice.installments; i++) {

    //         let dueDate = addMonths(baseDate, i - 1)
    //         dueDate = setDate(dueDate, dayOfMonth)

    //         let payment_due_date

    //         //Primeira passagem do loop vai considerar o payment_days no cálculo da data de vencimento
    //         if(i == 1){
    //             payment_due_date = format(addDays(new Date(), payment_days), 'yyyy-MM-dd HH:mm:ss')
    //         }else{
    //             payment_due_date = dueDate
    //         }

    //         if(i == ar_invoice.installments){
    //             value = ar_invoice.total_amount-valueCount
    //             ar_invoice.merge({
    //                 due_date: payment_due_date
    //             })
    //             await ar_invoice.save()
    //         }else{
    //             valueCount+=value
    //         }

    //         let ar_receipt = await ArReceipt.create({
    //             value_base: value,
    //             value_total: value,
    //             reference: `Fatura ${ar_invoice.id} (${i} / ${ar_invoice.installments}) - Serviço: ${service.id}`,
    //             ar_invoice_id: ar_invoice.id,
    //             installment_number: i,
    //             payment_method_id,
    //             status: 'pending',
    //             due_date: payment_due_date,
    //         }, trx)

    //         let date2 = await this.getJobScheduleDate(payment_days, new Date(payment_due_date))

    //         // const paymentjob = await Bull.schedule(new CheckPaymentDueJob().key, {ar_receipt: ar_receipt.toJSON()}, addSeconds(new Date(), 5), { removeOnComplete: true })
    //         const paymentjob = await Bull.schedule(new CheckPaymentDueJob().key, {ar_receipt: ar_receipt.toJSON()}, date2, { removeOnComplete: true })

    //         ar_receipt.merge({
    //             check_payment_job_id: paymentjob.id
    //         })

    //         await ar_receipt.save()
    //     }
    // }
  }

  protected async getJobScheduleDate(payment_days: number, due_date: Date) {
    if (payment_days === 0) {
      // Agendar para o próximo dia à meia-noite
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    }
    return due_date;
  }

}
export default ArInvoiceService
