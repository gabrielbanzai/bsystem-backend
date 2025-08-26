import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'ap_invoices'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('supplier_id').unsigned().references('id').inTable('suppliers').onDelete('SET NULL').defaultTo(null)
      table.integer('purchase_order_id').unsigned().references('id').inTable('purchase_orders').onDelete('SET NULL').defaultTo(null)
      table.integer('purchase_order_payment_id').unsigned().references('id').inTable('purchase_order_payments').onDelete('SET NULL').defaultTo(null)
      table.string('invoice_number')
      table.integer('total_amount')
      table.enum('status', ['pending', 'paid', 'late', 'canceled', 'refund']).defaultTo('pending')
      table.integer('installments')
      table.string('check_payment_job_id')
      table.dateTime('issue_date', { useTz: true })
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
