import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'ar_receipts'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('ar_invoice_id').unsigned().references('id').inTable('ar_invoices').onDelete('SET NULL').defaultTo(null)
      table.integer('payment_method_id').unsigned().references('id').inTable('payment_methods').onDelete('SET NULL').defaultTo(null)
      table.integer('bank_account_id').unsigned().references('id').inTable('bank_accounts').onDelete('SET NULL').defaultTo(null)
      table.integer('value_base')
      table.integer('value_total')
      table.string('reference')
      table.integer('installment_number')
      table.enum('status', ['pending', 'paid', 'late', 'canceled', 'refund']).defaultTo('pending')
      table.string('check_payment_job_id')
      table.dateTime('due_date', { useTz: true })
      table.dateTime('deleted_at', { useTz: true })
      table.dateTime('created_at', { useTz: true })
      table.dateTime('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
