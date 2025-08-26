import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 150)
      table.string('slug', 170)
      table.text('description')
      table.string('barcode', 128)
      table.string('reference')
      table.json('images')
      table.integer('conversion_factor')
      table.integer('min_stock')
      table.integer('sale_price').unsigned().defaultTo(null)
      table.integer('last_cost').unsigned().defaultTo(0)
      table.integer('avg_cost').unsigned().defaultTo(0)
      table.integer('margin_percent').unsigned().defaultTo(0)
      table.enum('status', ['active', 'blocked']).defaultTo('active')
      table.integer('product_group_id').unsigned().references('id').inTable('product_groups').onDelete('SET NULL').defaultTo(null)
      table.integer('product_category_id').unsigned().references('id').inTable('product_categories').onDelete('SET NULL').defaultTo(null)
      table.integer('unit_in_id').unsigned().references('id').inTable('product_unities').onDelete('SET NULL').defaultTo(null)
      table.integer('unit_out_id').unsigned().references('id').inTable('product_unities').onDelete('SET NULL').defaultTo(null)
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.dateTime('deleted_at', { useTz: true })
      table.dateTime('created_at', { useTz: true })
      table.dateTime('updated_at', { useTz: true })
    })

    this.schema.createTable('product_supplier', (table) => {
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE')
      table.integer('supplier_id').unsigned().references('id').inTable('suppliers').onDelete('CASCADE')
    })
  }

  public async down () {
    this.schema.dropTable('product_supplier')
    this.schema.dropTable(this.tableName)
  }
}
