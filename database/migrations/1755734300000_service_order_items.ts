import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'service_order_items'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.text('description')
      table.integer('service_order_id').unsigned().references('id').inTable('service_orders').onDelete('CASCADE')
      table.integer('service_type_id').unsigned().references('id').inTable('service_types').onDelete('SET NULL').nullable()
      table.enum('status', ['pending', 'done', 'canceled']).defaultTo('pending')
      table.dateTime('created_at', { useTz: true })
      table.dateTime('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
