import { DateTime } from 'luxon'
import { BaseModel, beforeFetch, beforeFind, belongsTo, BelongsTo, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Client from './Client'
import Sale from './Sale'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { list_filters } from 'App/Helpers'
import { softDeleteQuery, softDelete } from 'App/Services/SoftDelete'
import ArReceipt from './ArReceipt'
import SalePayment from './SalePayment'

//Accounts Receivable Invoice
export default class ArInvoice extends BaseModel {

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
  public reference: string

  @column()
  public status: string

  @column()
  public installments: number

  @column()
  public issue_date: DateTime | string
  
  @column()
  public due_date: DateTime | string

  @column()
  public sale_id: number
  
  @belongsTo(() => Sale, {
    localKey: 'id',
    foreignKey: 'sale_id'
  })
  public sale: BelongsTo<typeof Sale>

  @column()
  public service_id: number
  
  @belongsTo(() => Sale, {
    localKey: 'id',
    foreignKey: 'service_id'
  })
  public service: BelongsTo<typeof Sale>

  @column()
    public sale_payment_id: number
    
    @belongsTo(() => SalePayment, {
      localKey: 'id',
      foreignKey: 'sale_payment_id'
    })
    public sale_payment: BelongsTo<typeof SalePayment>

  @column()
  public client_id: number
  
  @belongsTo(() => Client, {
    localKey: 'id',
    foreignKey: 'client_id'
  })
  public client: BelongsTo<typeof Client>

  @hasMany(() => ArReceipt, {
    localKey: 'id',
    foreignKey: 'ar_invoice_id'
  })
  public ar_receipts: HasMany<typeof ArReceipt>

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

