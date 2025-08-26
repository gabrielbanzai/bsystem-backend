import { DateTime } from 'luxon'
import { BaseModel, beforeFetch, beforeFind, belongsTo, BelongsTo, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Product from './Product'
import { softDeleteQuery, softDelete } from 'App/Services/SoftDelete'
import StockTransaction from './StockTransaction'
import Storage from './Storage'

export default class Stock extends BaseModel {
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
  
}
