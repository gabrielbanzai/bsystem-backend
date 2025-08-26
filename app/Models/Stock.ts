import { DateTime } from 'luxon'
import { BaseModel, beforeFetch, beforeFind, belongsTo, BelongsTo, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Product from './Product'
import { softDeleteQuery, softDelete } from 'App/Services/SoftDelete'
import { list_filters } from 'App/Helpers'
import StockTransaction from './StockTransaction'
import Storage from './Storage'

export default class Stock extends BaseModel {
  
  static get filters () {
    return {
      product_search: {
        field: 'product_search',
        type: 'global_search',
        scale: ['product'], // Escalonamento para buscar no produto relacionado
        searchFields: ['name', 'description', 'barcode', 'reference'], // Campos do produto onde buscar
        isLike: true,
      },
      storage_id: {
        field: 'storage_id',
        type: 'dropdown',
        modelName: 'Storage',
      },
    }
  }
  @column({ isPrimary: true })
  public id: number

  @column()
  public quantity: number

  @column()
  public quantity_reserved: number

  @column()
  public product_id: number
  
  @belongsTo(() => Product, {
    localKey: 'id',
    foreignKey: 'product_id'
  })
  public product: BelongsTo<typeof Product>

  @column()
  public storage_id: number
  
  @belongsTo(() => Storage, {
    localKey: 'id',
    foreignKey: 'storage_id'
  })
  public storage: BelongsTo<typeof Storage>

  @hasMany(() => StockTransaction, {
    localKey: 'id',
    foreignKey: 'stock_id'
  })
  public transactions: HasMany<typeof StockTransaction>
  

  @column.dateTime({ serializeAs: null})
  public deletedAt: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeFind()
    public static softDeletesFind = softDeleteQuery;
    @beforeFetch()
    public static softDeletesFetch = softDeleteQuery;
  
    public async softDelete(column?: string) {
      await softDelete(this, column);
    }

  public static async listFilters(ctx: HttpContextContract, currentQuery: any){

    const { request } = ctx

    let query = list_filters(this.filters, currentQuery, request.all())

    return query
  }
  
  public static async listFiltersPaginate(ctx: HttpContextContract, currentQuery: any){

    const { request, pagination } = ctx

    let query = list_filters(this.filters, currentQuery, request.all())

    return await query.paginate(pagination.page, pagination.limit)
  }
  
}
