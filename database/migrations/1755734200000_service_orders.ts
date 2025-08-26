import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'service_orders'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.enum('status', ['pending', 'in_progress', 'completed', 'cancelled']).defaultTo('pending')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable()
      table.integer('tecnical_id').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable()
      table.integer('client_id').unsigned().references('id').inTable('clients').onDelete('SET NULL').nullable()
      table.text('description')
      table.dateTime('issue_date', { useTz: true })
      table.dateTime('due_date', { useTz: true })
      table.dateTime('deleted_at', { useTz: true })
      table.dateTime('created_at', { useTz: true })
      table.dateTime('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
