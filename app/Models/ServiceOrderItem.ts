import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import ServiceOrder from './ServiceOrder'
import ServiceType from './ServiceType'

export default class ServiceOrderItem extends BaseModel {

  @column({ isPrimary: true })
  public id: number

  @column()
  public description: string

  @column()
  public service_order_id: number

  @belongsTo(() => ServiceOrder, {
    localKey: 'id',
    foreignKey: 'service_order_id'
  })
  public service_order: BelongsTo<typeof ServiceOrder>

  @column()
  public service_type_id: number

  @belongsTo(() => ServiceType, {
    localKey: 'id',
    foreignKey: 'service_type_id'
  })
  public service_type: BelongsTo<typeof ServiceType>

  @column()
  public status: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
