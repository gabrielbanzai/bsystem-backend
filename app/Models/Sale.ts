import { DateTime } from 'luxon'
import { BaseModel, beforeFetch, beforeFind, belongsTo, BelongsTo, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { list_filters } from 'App/Helpers'
import { softDeleteQuery, softDelete } from 'App/Services/SoftDelete'
import Client from './Client'
import ShippingCompany from './ShippingCompany'
import User from './User'
import SaleItem from './SaleItem'
import SaleOrder from './SaleOrder'
import SalePayment from './SalePayment'
import ArInvoice from './ArInvoice'

export default class Sale extends BaseModel {
  static get filters () {
    return {
      name: {
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
  public items_total: number

  @column()
  public discount_price: number

  @column()
  public total: number

  @column()
  public obs: string

  @column()
  public shipping_total: number
  
  @column()
  public installments: number

  // User
  @column()
  public user_id: number
  
  @belongsTo(() => User, {
    localKey: 'id',
    foreignKey: 'user_id'
  })
  public user: BelongsTo<typeof User>

  // Client
  @column()
  public client_id: number
  
  @belongsTo(() => Client, {
    localKey: 'id',
    foreignKey: 'client_id'
  })
  public client: BelongsTo<typeof Client>

  // Sale Order
  @column()
  public sale_order_id: number
  
  @belongsTo(() => SaleOrder, {
    localKey: 'id',
    foreignKey: 'sale_order_id'
  })
  public sale_order: BelongsTo<typeof SaleOrder>

  // Shipping Company
  @column()
  public shipping_company_id: number
  
  @belongsTo(() => ShippingCompany, {
    localKey: 'id',
    foreignKey: 'shipping_company_id'
  })
  public shipping_company: BelongsTo<typeof ShippingCompany>

  // Items
  @hasMany(() => SaleItem, {
      localKey: 'id',
      foreignKey: 'sale_id'
    })
    public items: HasMany<typeof SaleItem>

  // Sale Payments
  @hasMany(() => SalePayment, {
      localKey: 'id',
      foreignKey: 'sale_id'
    })
    public sale_payments: HasMany<typeof SalePayment>

  @hasMany(() => ArInvoice, {
      localKey: 'id',
      foreignKey: 'sale_id'
    })
    public invoices: HasMany<typeof ArInvoice>
  
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
