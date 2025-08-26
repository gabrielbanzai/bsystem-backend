import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'sale_payments'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('sale_id').unsigned().references('id').inTable('sales').onDelete('CASCADE')
      table.integer('payment_method_id').unsigned().references('id').inTable('payment_methods').onDelete('SET NULL').defaultTo(null)
      table.enum('status', ['pending', 'emited']).defaultTo('pending')
      table.integer('value_total')
      table.integer('installments')
      table.integer('payment_days')
      table.dateTime('deleted_at', { useTz: true })
      table.dateTime('created_at', { useTz: true })
      table.dateTime('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
