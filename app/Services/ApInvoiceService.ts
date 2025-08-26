class ApInvoiceService {
  
  public async getJobScheduleDate(payment_days: number, due_date: Date) {
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
export default ApInvoiceService
