import { DateTime } from 'luxon'
import { BaseModel, beforeFetch, beforeFind, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import { softDeleteQuery, softDelete } from 'App/Services/SoftDelete'
import PaymentMethod from './PaymentMethod'
import BankAccount from './BankAccount'
import PurchaseOrder from './PurchaseOrder'

export default class PurchaseOrderPayment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public status: string
  
  @column()
  public payment_days: number

  @column()
  public installments: number

  @column()
  public value_total: number

  @column()
  public payment_method_id: number
  
  @belongsTo(() => PaymentMethod, {
    localKey: 'id',
    foreignKey: 'payment_method_id'
  })
  public payment_method: BelongsTo<typeof PaymentMethod>

  @column()
  public purchase_order_id: number
      
  @belongsTo(() => PurchaseOrder, {
    localKey: 'id',
    foreignKey: 'purchase_order_id'
  })
  public purchase_order: BelongsTo<typeof PurchaseOrder>

  @column()
  public bank_account_id: number

  @belongsTo(() => BankAccount, {
    localKey: 'id',
    foreignKey: 'bank_account_id'
  })
  public bank_account: BelongsTo<typeof BankAccount>

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
}
