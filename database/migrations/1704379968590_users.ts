import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name', 150)
      table.string('slug', 170)
      table.string('trade_name', 150)
      table.string('password', 255)
      table.string('email', 150).notNullable().unique()
      table.string('cpf_cnpj', 14)
      table.string('phone', 11)
      table.string('mobile_phone', 11)
      table.string('contact_name', 150)
      table.string('state_registration', 14)
      table.text('obs')
      table.string('remember_me_token', 255).nullable()
      table.string('avatar', 255).nullable()
      table.decimal('discount_percent')
      table.decimal('comission_percent')
      table.enum('comission_type', ['total_sale'])
      table.enum('status', ['active', 'blocked']).defaultTo('active')
      table.integer('position_id').unsigned().references('id').inTable('positions').onDelete('SET NULL').defaultTo(null)
      table.integer('department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL').defaultTo(null)
      table.integer('address_id').unsigned().references('id').inTable('addresses').onDelete('SET NULL').defaultTo(null)
      table.dateTime('birthday', { useTz: true })
      table.dateTime("deleted_at").defaultTo(null);

      /**
       * Uses timestampz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.dateTime('created_at', { useTz: true }).notNullable()
      table.dateTime('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
