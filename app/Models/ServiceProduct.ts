import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Service from './Service'
import Product from './Product'

export default class ServiceProduct extends BaseModel {

  @column({ isPrimary: true })
  public id: number

  @column()
  public service_id: number
  
  @belongsTo(() => Service, {
    localKey: 'id',
    foreignKey: 'service_id'
  })
  public service: BelongsTo<typeof Service>

  @column()
  public product_id: number
  
  @belongsTo(() => Product, {
    localKey: 'id',
    foreignKey: 'product_id'
  })
  public product: BelongsTo<typeof Product>

  @column()
  public quantity: number

  @column()
  public unit_price: number

  @column()
  public discount_price: number

  @column()
  public total: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
