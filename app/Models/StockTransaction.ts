import { DateTime } from 'luxon'
import { BaseModel, beforeFetch, beforeFind, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Product from './Product'
import Stock from './Stock'
import { softDeleteQuery, softDelete } from 'App/Services/SoftDelete'
import PurchaseOrder from './PurchaseOrder'
import Sale from './Sale'
import User from './User'
import SaleOrder from './SaleOrder'
import Service from './Service'

export default class StockTransaction extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public quantity: number

  @column()
  public balance: number

  @column()
  public reason: string
  
  @column()
  public type: string

  @column()
  public product_id: number
  
  @belongsTo(() => Product, {
    localKey: 'id',
    foreignKey: 'product_id'
  })
  public product: BelongsTo<typeof Product>

  @column()
  public stock_id: number
  
  @belongsTo(() => Stock, {
    localKey: 'id',
    foreignKey: 'stock_id'
  })
  public stock: BelongsTo<typeof Stock>

  @column()
  public purchase_order_id: number
  
  @belongsTo(() => PurchaseOrder, {
    localKey: 'id',
    foreignKey: 'purchase_order_id'
  })
  public purchase_order: BelongsTo<typeof PurchaseOrder>

  @column()
  public sale_id: number
  
  @belongsTo(() => Sale, {
    localKey: 'id',
    foreignKey: 'sale_id'
  })
  public sale: BelongsTo<typeof Sale>

  @column()
  public sale_order_id: number
  
  @belongsTo(() => SaleOrder, {
    localKey: 'id',
    foreignKey: 'sale_order_id'
  })
  public sale_order: BelongsTo<typeof SaleOrder>

  @column()
  public service_id: number
  
  @belongsTo(() => Service, {
    localKey: 'id',
    foreignKey: 'service_id'
  })
  public service: BelongsTo<typeof Service>
  
  @column()
  public user_id: number
  
  @belongsTo(() => User, {
    localKey: 'id',
    foreignKey: 'user_id'
  })
  public user: BelongsTo<typeof User>

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
