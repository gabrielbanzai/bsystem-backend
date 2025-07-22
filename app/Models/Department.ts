import { BaseModel, HasMany, ManyToMany, beforeFetch, beforeFind, column, hasMany, manyToMany } from '@ioc:Adonis/Lucid/Orm'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import Permission from './Permission'
import Position from './Position'
import { list_filters } from 'App/Helpers'
import { softDeleteQuery, softDelete } from 'App/Services/SoftDelete'

export default class Department extends BaseModel {

  static get filters () {
    return {
      name: {
        field: 'name',
        placeholder: 'Nome',
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
  public name: string

  @column()
  public slug: string

  @hasMany(() => Position, {
    localKey: 'id',
    foreignKey: 'department_id'
  })
  public positions: HasMany<typeof Position>

  @manyToMany(() => Permission, {
    pivotTable: 'department_permission'
  })
  public permissions: ManyToMany<typeof Permission>

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
