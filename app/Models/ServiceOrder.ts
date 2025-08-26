import { DateTime } from 'luxon'
import { BaseModel, beforeFetch, beforeFind, belongsTo, BelongsTo, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Client from './Client'
import User from './User'
import ServiceOrderItem from './ServiceOrderItem'
import ServiceOrderProduct from './ServiceOrderProduct'
import ServicePayment from './ServicePayment'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { list_filters } from 'App/Helpers'
import { softDeleteQuery, softDelete } from 'App/Services/SoftDelete'

export default class ServiceOrder extends BaseModel {

  static get filters () {
    return {
      id: {
        field: 'id',
        placeholder: 'Código',
        type: 'string',
        isLike: true,
      },
      order: {
        field: 'order',
        placeholder: 'Classificar',
        type: 'order',
        options: [
          {
            name: 'Mais recentes',
            field: 'id',
            orientation: 'desc'
          },
          {
            name: 'Mais antigos',
            field: 'id',
            orientation: 'asc'
          },
          {
            name: 'Nome A-Z',
            field: 'name',
            orientation: 'asc'
          },
          {
            name: 'Nome Z-A',
            field: 'name',
            orientation: 'desc'
          },
        ]
      },
    }
  }

  @column({ isPrimary: true })
  public id: number

  @column()
  public status: string

  @column()
  public issue_date: DateTime | string

  @column()
  public due_date: DateTime | string

  @column()
  public user_id: number

  @belongsTo(() => User, {
    localKey: 'id',
    foreignKey: 'user_id'
  })
  public user: BelongsTo<typeof User>

  @column()
  public tecnical_id: number

  @belongsTo(() => User, {
    localKey: 'id',
    foreignKey: 'tecnical_id'
  })
  public tecnical: BelongsTo<typeof User>

  @column()
  public client_id: number

  @belongsTo(() => Client, {
    localKey: 'id',
    foreignKey: 'client_id'
  })
  public client: BelongsTo<typeof Client>

  @column()
  public description: string

  @column.dateTime({ serializeAs: null})
  public deletedAt: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => ServiceOrderItem, {
      localKey: 'id',
      foreignKey: 'service_order_id'
  })
  public items: HasMany<typeof ServiceOrderItem>

  @hasMany(() => ServiceOrderProduct, {
      localKey: 'id',
      foreignKey: 'service_order_id'
  })
  public products: HasMany<typeof ServiceOrderProduct>

  @hasMany(() => ServicePayment, {
      localKey: 'id',
      foreignKey: 'service_order_id'
  })
  public service_payments: HasMany<typeof ServicePayment>

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

