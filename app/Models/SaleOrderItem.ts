import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Product from './Product'
import SaleOrder from './SaleOrder'

export default class SaleOrderItem extends BaseModel {

  @column({ isPrimary: true })
  public id: number

  @column()
  public quantity: number

  @column()
  public unit_price: number

  @column()
  public discount_price: number

  @column()
  public total: number

  @column()
  public product_id: number
  
  @belongsTo(() => Product, {
    localKey: 'id',
    foreignKey: 'product_id'
  })
  public product: BelongsTo<typeof Product>

  @column()
  public sale_order_id: number
  
  @belongsTo(() => SaleOrder, {
    localKey: 'id',
    foreignKey: 'sale_order_id'
  })
  public sale_order: BelongsTo<typeof SaleOrder>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
