import { JobContract } from '@ioc:Rocketseat/Bull'
import ApInvoice from 'App/Models/ApInvoice';

export default class SendMailToken implements JobContract {
  public key = 'EC-CheckInvoicePayment'

  public async handle(job) {
    const { data } = job; 

    let ap_invoice = await ApInvoice.findOrFail(data.ap_invoice.id)

    if(ap_invoice?.status == 'pending'){
      ap_invoice.merge({status: 'late'})
      await ap_invoice.save()
    }


    return data;
  }
}
