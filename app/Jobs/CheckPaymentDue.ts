import { JobContract } from '@ioc:Rocketseat/Bull'
import ApPayment from 'App/Models/ApPayment';

export default class SendMailToken implements JobContract {
  public key = 'EC-CheckPaymentDue'

  public async handle(job) {
    const { data } = job; 

    let ap_payment = await ApPayment.findOrFail(data.ap_payment.id)

    if(ap_payment?.status == 'pending'){
      ap_payment.merge({status: 'late'})
      await ap_payment.save()
    }


    return data;
  }
}
