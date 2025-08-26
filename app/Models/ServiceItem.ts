import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Service from './Service'
import ServiceType from './ServiceType'

export default class ServiceItem extends BaseModel {

  @column({ isPrimary: true })
  public id: number

  @column()
  public description: string

  @column()
  public unit_price: number

  @column()
  public discount_price: number

  @column()
  public total: number

  @column()
  public service_id: number
  
  @belongsTo(() => Service, {
    localKey: 'id',
    foreignKey: 'service_id'
  })
  public service: BelongsTo<typeof Service>

  @column()
  public service_type_id: number
  
  @belongsTo(() => ServiceType, {
    localKey: 'id',
    foreignKey: 'service_type_id'
  })
  public service_type: BelongsTo<typeof ServiceType>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
