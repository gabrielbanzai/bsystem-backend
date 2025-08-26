import { JobContract } from '@ioc:Rocketseat/Bull'
import ArInvoice from 'App/Models/ArInvoice';

export default class SendMailToken implements JobContract {
  public key = 'EC-CheckArInvoicePayment'

  public async handle(job) {
    const { data } = job; 

    let ar_invoice = await ArInvoice.findOrFail(data.ar_invoice.id)

    if(ar_invoice?.status == 'pending'){
      ar_invoice.merge({status: 'late'})
      await ar_invoice.save()
    }


    return data;
  }
}
