import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'stocks'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('quantity').defaultTo(0)
      table.integer('quantity_reserved').defaultTo(0)
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('SET NULL').defaultTo(null)
      table.integer('storage_id').unsigned().references('id').inTable('storages').onDelete('SET NULL').defaultTo(null)
      table.dateTime('deleted_at', { useTz: true })
      table.dateTime('created_at', { useTz: true })
      table.dateTime('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
