import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'clients'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 150)
      table.string('slug', 170)
      table.string('trade_name', 150)
      table.string('state_registration', 14)
      table.string('email', 150)
      table.string('phone', 11)
      table.string('mobile_phone', 11)
      table.string('contact_name', 150)
      table.string('cpf_cnpj', 14)
      table.text('obs')
      table.integer('address_id').unsigned().references('id').inTable('addresses').onDelete('SET NULL').defaultTo(null)
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
