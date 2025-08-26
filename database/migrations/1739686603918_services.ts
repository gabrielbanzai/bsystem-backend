import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'services'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').defaultTo(null)
      table.integer('client_id').unsigned().references('id').inTable('clients').onDelete('SET NULL').defaultTo(null)
      table.integer('tecnical_id').unsigned().references('id').inTable('users').onDelete('SET NULL').defaultTo(null)
      table.enum('status', ['pending', 'done', 'canceled']).defaultTo('pending')
      table.integer('items_total')
      table.integer('discount_price').defaultTo(0)
      table.integer('total')
      table.text('obs')
      table.dateTime('issue_date', { useTz: true })
      table.dateTime('due_date', { useTz: true })
      table.dateTime('deleted_at', { useTz: true })
      table.dateTime('created_at', { useTz: true })
      table.dateTime('updated_at', { useTz: true })
    })

    this.schema.createTable('service_items', (table) => {
      table.increments('id')
      table.integer('service_id').unsigned().references('id').inTable('services').onDelete('SET NULL').defaultTo(null)
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').defaultTo(null)
      table.text('description')
      table.integer('unit_price')
      table.integer('discount_price').defaultTo(0)
      table.integer('total')
      table.dateTime('created_at', { useTz: true })
      table.dateTime('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable('service_items')
    this.schema.dropTable(this.tableName)
  }
}
