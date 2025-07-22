import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'permissions'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 150)
      table.string('slug', 170)
      table.boolean('hide_admin').defaultTo(0)
      table.boolean('hide_client').defaultTo(0)
      table.dateTime("deleted_at").defaultTo(null);
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.dateTime('created_at', { useTz: true })
      table.dateTime('updated_at', { useTz: true })
    })

    this.schema.createTable('user_permission', (table) => {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('permission_id').unsigned().references('id').inTable('permissions').onDelete('CASCADE')
    })

    this.schema.createTable('department_permission', (table) => {
      table.integer('department_id').unsigned().references('id').inTable('departments').onDelete('CASCADE')
      table.integer('permission_id').unsigned().references('id').inTable('permissions').onDelete('CASCADE')
    })

    this.schema.createTable('position_permission', (table) => {
      table.integer('position_id').unsigned().references('id').inTable('positions').onDelete('CASCADE')
      table.integer('permission_id').unsigned().references('id').inTable('permissions').onDelete('CASCADE')
    })
  }

  public async down () {
    this.schema.dropTable('position_permission')
    this.schema.dropTable('department_permission')
    this.schema.dropTable('user_permission')
    this.schema.dropTable(this.tableName)
  }
}
