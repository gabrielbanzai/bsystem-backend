import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'sales'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').defaultTo(null)
      table.integer('client_id').unsigned().references('id').inTable('clients').onDelete('SET NULL').defaultTo(null)
      table.integer('sale_order_id').unsigned().references('id').inTable('sale_orders').onDelete('SET NULL').defaultTo(null)
      table.integer('shipping_company_id').unsigned().references('id').inTable('shipping_companies').onDelete('SET NULL').defaultTo(null)
      table.enum('status', ['pending', 'done', 'canceled']).defaultTo('pending')
      table.integer('shipping_total')
      table.integer('items_total')
      table.integer('discount_price').defaultTo(0)
      table.integer('total')
      table.text('obs')
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.dateTime('deleted_at', { useTz: true })
      table.dateTime('created_at', { useTz: true })
      table.dateTime('updated_at', { useTz: true })
    })

    this.schema.createTable('sale_items', (table) => {
      table.increments('id')
      table.integer('sale_id').unsigned().references('id').inTable('sales').onDelete('SET NULL').defaultTo(null)
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('SET NULL').defaultTo(null)
      table.integer('quantity')
      table.integer('unit_price')
      table.integer('discount_price').defaultTo(0)
      table.integer('total')
      table.dateTime('created_at', { useTz: true })
      table.dateTime('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable('sale_items')
    this.schema.dropTable(this.tableName)
  }
}
