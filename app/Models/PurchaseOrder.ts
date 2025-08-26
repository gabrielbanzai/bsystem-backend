import { DateTime } from 'luxon'
import { BaseModel, beforeFetch, beforeFind, belongsTo, BelongsTo, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Supplier from './Supplier'
import ShippingCompany from './ShippingCompany'
import { list_filters } from 'App/Helpers'
import { softDeleteQuery, softDelete } from 'App/Services/SoftDelete'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import PurchaseOrderItem from './PurchaseOrderItem'
import ApInvoice from './ApInvoice'
import PurchaseOrderPayment from './PurchaseOrderPayment'

export default class PurchaseOrder extends BaseModel {
  
  static get filters () {
    return {
      id: {
        field: 'id',
        placeholder: 'Código',
        type: 'string',
        isLike: true,
      },
      name: {
        field: 'name',
        placeholder: 'Nome do Fornecedor',
        scale: ['supplier'],
        type: 'string',
        isLike: true,
      },
      supplier_cpf_cnpj: {
        field: 'cpf_cnpj',
        scale: ['supplier'],
        placeholder: 'CPF/CNPJ do Fornecedor',
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
  public shipping_total: number

  @column()
  public items_total: number

  @column()
  public discount_price: number

  @column()
  public total: number

  @column()
  public obs: string

  @column()
  public user_id: number
  
  @belongsTo(() => User, {
    localKey: 'id',
    foreignKey: 'user_id'
  })
  public user: BelongsTo<typeof User>

  @column()
  public supplier_id: number
  
  @belongsTo(() => Supplier, {
    localKey: 'id',
    foreignKey: 'supplier_id'
  })
  public supplier: BelongsTo<typeof Supplier>

  @column()
  public shipping_company_id: number
  
  @belongsTo(() => ShippingCompany, {
    localKey: 'id',
    foreignKey: 'shipping_company_id'
  })
  public shipping_company: BelongsTo<typeof ShippingCompany>


  @hasMany(() => PurchaseOrderItem, {
    localKey: 'id',
    foreignKey: 'purchase_order_id'
  })
  public items: HasMany<typeof PurchaseOrderItem>

  @hasMany(() => PurchaseOrderPayment, {
    localKey: 'id',
    foreignKey: 'purchase_order_id'
  })
  public purchase_order_payments: HasMany<typeof PurchaseOrderPayment>

  @hasMany(() => ApInvoice, {
    localKey: 'id',
    foreignKey: 'purchase_order_id'
  })
  public invoices: HasMany<typeof ApInvoice>
  
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
