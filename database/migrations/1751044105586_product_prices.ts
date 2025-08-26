import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'product_prices'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE').defaultTo(null)
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').defaultTo(null)
      table.integer('purchase_order_id').unsigned().references('id').inTable('purchase_orders').onDelete('SET NULL').defaultTo(null)
      table.enum('origin', ['manual', 'purchase_order'])
      table.integer('price')
      table.integer('quantity').defaultTo(1)
      table.dateTime('created_at', { useTz: true })
      table.dateTime('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
