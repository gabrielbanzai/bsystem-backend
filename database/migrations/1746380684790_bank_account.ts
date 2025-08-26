import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'bank_accounts'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('account_number')
      table.string('agency')
      table.integer('bank_id').unsigned().references('id').inTable('banks').onDelete('SET NULL').defaultTo(null)
      table.enum('account_type', ['checking','savings', 'cash', 'credit', 'investment', 'digital', 'virtual'])
      // Valor (ENUM)	Significado
      // Checking	= Conta corrente
      // Savings = Conta poupança
      // Cash	= Conta caixa (usada internamente)
      // Credit	= Conta de cartão de crédito
      // Investment =	Conta de investimentos
      // Digital =	Conta digital (ex: PicPay, Nubank)
      // Virtual =	Conta virtual ou temporária
      table.dateTime('deleted_at', { useTz: true })
      table.dateTime('created_at', { useTz: true })
      table.dateTime('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
