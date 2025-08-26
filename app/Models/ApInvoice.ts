import { DateTime } from 'luxon'
import { BaseModel, beforeFetch, beforeFind, BelongsTo, belongsTo, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import PurchaseOrder from './PurchaseOrder'
import Supplier from './Supplier'
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete'
import { list_filters } from 'App/Helpers'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ApPayment from './ApPayment'
import PurchaseOrderPayment from './PurchaseOrderPayment'

export default class ApInvoice extends BaseModel {

  static get filters () {
    return {
      id: {
        field: 'id',
        placeholder: 'Cód.',
        type: 'string',
        isLike: false,
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
  public total_amount: number

  @column()
  public invoice_number: string

  @column()
  public status: string

  @column()
  public installments: number

  @column()
  public issue_date: DateTime | string
  
  @column()
  public due_date: DateTime | string

  @column()
  public purchase_order_id: number
  
  @belongsTo(() => PurchaseOrder, {
    localKey: 'id',
    foreignKey: 'purchase_order_id'
  })
  public purchase_order: BelongsTo<typeof PurchaseOrder>

  @column()
  public purchase_order_payment_id: number
  
  @belongsTo(() => PurchaseOrderPayment, {
    localKey: 'id',
    foreignKey: 'purchase_order_payment_id'
  })
  public purchase_order_payment: BelongsTo<typeof PurchaseOrderPayment>

  @column()
  public supplier_id: number
  
  @belongsTo(() => Supplier, {
    localKey: 'id',
    foreignKey: 'supplier_id'
  })
  public supplier: BelongsTo<typeof Supplier>

  @hasMany(() => ApPayment, {
    localKey: 'id',
    foreignKey: 'ap_invoice_id'
  })
  public ap_payments: HasMany<typeof ApPayment>

  @column()
  public check_payment_job_id: string

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
