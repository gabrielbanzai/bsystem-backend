import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Product from './Product'
import PurchaseOrder from './PurchaseOrder'

export default class ProductPrice extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public origin: 'manual' | 'purchase_order'

  @column()
  public price: number

  @column()
  public quantity: number

  @column()
  public user_id: number

  @belongsTo(() => User, {
    localKey: 'id',
    foreignKey: 'user_id'
  })
  public user: BelongsTo<typeof User>

  @column()
  public product_id: number

  @belongsTo(() => Product, {
    localKey: 'id',
    foreignKey: 'product_id'
  })
  public product: BelongsTo<typeof Product>

  @column()
    public purchase_order_id: number
  
    @belongsTo(() => PurchaseOrder, {
      localKey: 'id',
      foreignKey: 'purchase_order_id'
    })
    public purchase_order: BelongsTo<typeof PurchaseOrder>
  

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
