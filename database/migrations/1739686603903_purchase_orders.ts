import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'purchase_orders'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').defaultTo(null)
      table.integer('supplier_id').unsigned().references('id').inTable('suppliers').onDelete('SET NULL').defaultTo(null)
      table.integer('shipping_company_id').unsigned().references('id').inTable('shipping_companies').onDelete('SET NULL').defaultTo(null)
      table.enum('status', ['pending', 'done', 'canceled']).defaultTo('pending')
      table.integer('items_total')
      table.integer('shipping_total')
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

    this.schema.createTable('po_items', (table) => {
      table.increments('id')
      table.integer('purchase_order_id').unsigned().references('id').inTable('purchase_orders').onDelete('SET NULL').defaultTo(null)
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
    this.schema.dropTable('po_items')
    this.schema.dropTable(this.tableName)
  }
}
