import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'stock_transactions'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('quantity')
      table.integer('balance')
      table.text('reason')
      table.enum('type', ['in', 'out', 'adjust', 'reserve', 'reserve-adjust', 'reserve-cancel'])
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('SET NULL').defaultTo(null)
      table.integer('stock_id').unsigned().references('id').inTable('stocks').onDelete('SET NULL').defaultTo(null)
      table.integer('purchase_order_id').unsigned().references('id').inTable('purchase_orders').onDelete('SET NULL').defaultTo(null)
      table.integer('sale_id').unsigned().references('id').inTable('sales').onDelete('SET NULL').defaultTo(null)
      table.integer('sale_order_id').unsigned().references('id').inTable('sale_orders').onDelete('SET NULL').defaultTo(null)
      table.integer('service_id').unsigned().references('id').inTable('services').onDelete('SET NULL').defaultTo(null)
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').defaultTo(null)
      table.dateTime('deleted_at', { useTz: true })
      table.dateTime('created_at', { useTz: true })
      table.dateTime('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
