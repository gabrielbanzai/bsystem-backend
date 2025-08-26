import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import ServiceOrder from './ServiceOrder'
import Product from './Product'

export default class ServiceOrderProduct extends BaseModel {

  @column({ isPrimary: true })
  public id: number

  @column()
  public product_id: number

  @belongsTo(() => Product, {
    localKey: 'id',
    foreignKey: 'product_id'
  })
  public product: BelongsTo<typeof Product>

  @column()
  public service_order_id: number

  @belongsTo(() => ServiceOrder, {
    localKey: 'id',
    foreignKey: 'service_order_id'
  })
  public service_order: BelongsTo<typeof ServiceOrder>

  @column()
  public quantity: number

  @column()
  public quantity_confirmed: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
