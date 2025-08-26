import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'vehicles'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 150)
      table.string('slug', 170)
      table.string('brand', 80)
      table.string('model', 100)
      table.string('plate', 8)
      table.integer('fb_year', 4)
      table.integer('quilometer', 7).unsigned()
      table.integer('shipping_company_id').unsigned().references('id').inTable('shipping_companies').onDelete('SET NULL').defaultTo(null)
      table.enum('status', ['active', 'blocked']).defaultTo('active')
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.dateTime('deleted_at', { useTz: true })
      table.dateTime('created_at', { useTz: true })
      table.dateTime('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
