import { DateTime } from 'luxon'
import { BaseModel, beforeFetch, beforeFind, belongsTo, BelongsTo, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import ArInvoice from './ArInvoice'
import PaymentMethod from './PaymentMethod'
import BankAccount from './BankAccount'
import { softDeleteQuery, softDelete } from 'App/Services/SoftDelete'
import ArCharge from './ArCharge'
import { list_filters } from 'App/Helpers'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

//Accounts Receivable Receipt
export default class ArReceipt extends BaseModel {
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
  public value_base: number

  @column()
  public value_total: number

  @column()
  public installment_number: number
  
  @column()
  public reference: string

  @column()
  public status: string

  @column()
  public ar_invoice_id: number
  
  @belongsTo(() => ArInvoice, {
    localKey: 'id',
    foreignKey: 'ar_invoice_id'
  })
  public ar_invoice: BelongsTo<typeof ArInvoice>
  

  @column()
  public payment_method_id: number
  
  @belongsTo(() => PaymentMethod, {
    localKey: 'id',
    foreignKey: 'payment_method_id'
  })
  public payment_method: BelongsTo<typeof PaymentMethod>

  @column()
  public bank_account_id: number
  
  @belongsTo(() => BankAccount, {
    localKey: 'id',
    foreignKey: 'bank_account_id'
  })
  public bank_account: BelongsTo<typeof BankAccount>

  @hasMany(() => ArCharge, {
      localKey: 'id',
      foreignKey: 'ar_receipt_id'
  })
  public ar_charges: HasMany<typeof ArCharge>

  @column()
  public check_payment_job_id: string

  @column()
  public due_date: DateTime | string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
  
  @column.dateTime({ serializeAs: null})
  public deletedAt: DateTime

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