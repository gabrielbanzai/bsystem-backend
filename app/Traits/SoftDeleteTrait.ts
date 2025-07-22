// app/Traits/SoftDeleteTrait.ts
import { ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'
import { softDeleteQuery, softDelete } from 'App/Services/SoftDelete'

export function applySoftDeleteTrait(model: any) {
  model.beforeFind((query: ModelQueryBuilderContract<any>) => softDeleteQuery(query))
  model.beforeFetch((query: ModelQueryBuilderContract<any>) => softDeleteQuery(query))

  model.prototype.softDelete = async function (column?: string) {
    await softDelete(this, column)
  }
}
