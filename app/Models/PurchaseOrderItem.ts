import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Product from './Product'
import PurchaseOrder from './PurchaseOrder'

export default class PurchaseOrderItem extends BaseModel {

  static get table () {
    return 'po_items'
  }

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
