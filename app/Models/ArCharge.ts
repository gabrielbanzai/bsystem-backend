import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ArReceipt from './ArReceipt'
import { list_filters } from 'App/Helpers'

//Accounts Receivable Invoice
export default class ArCharge extends BaseModel {
  
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
    public description: string
  
    @column()
    public ar_receipt_id: number
    
    @belongsTo(() => ArReceipt, {
      localKey: 'id',
      foreignKey: 'ar_receipt_id'
    })
    public ar_receipt: BelongsTo<typeof ArReceipt>
  
    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime
  
    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime

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

