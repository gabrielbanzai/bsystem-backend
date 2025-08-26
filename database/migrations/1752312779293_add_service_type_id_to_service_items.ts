import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'service_items'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('service_type_id').unsigned().references('id').inTable('service_types').onDelete('SET NULL').nullable()
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('service_type_id')
    })
  }
}
