import { JobContract } from '@ioc:Rocketseat/Bull'
import ArReceipt from 'App/Models/ArReceipt';

export default class SendMailToken implements JobContract {
  public key = 'EC-CheckPaymentDue'

  public async handle(job) {
    const { data } = job; 

    let ar_receipt = await ArReceipt.findOrFail(data.ar_receipt.id)

    if(ar_receipt?.status == 'pending'){
      ar_receipt.merge({status: 'late'})
      await ar_receipt.save()
    }


    return data;
  }
}
