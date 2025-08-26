import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { list_filters } from 'App/Helpers'
import ApPayment from './ApPayment'

export default class ApCharge extends BaseModel {

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
    public ap_payment_id: number
    
    @belongsTo(() => ApPayment, {
      localKey: 'id',
      foreignKey: 'ap_payment_id'
    })
    public ap_payment: BelongsTo<typeof ApPayment>
  
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
