import { validator } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'

validator.rule('exists', async (value, args: any[], options) => {
  if (typeof value !== 'number') {
    return
  }

  const table = args[0][0]
  const column = args[0][1]

  const row = await Database.query().from(table).where(column, value)

  if(row.length == 0){
    options.errorReporter.report(
        options.pointer,
        'exists',
        'exists validation failed',
        options.arrayExpressionPointer
    )
  }
})
