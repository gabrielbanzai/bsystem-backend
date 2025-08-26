import { BaseModel, beforeFetch, beforeFind, beforeSave, belongsTo, BelongsTo, column, manyToMany, ManyToMany } from '@ioc:Adonis/Lucid/Orm'

import { DateTime } from 'luxon'
import Position from './Position'
import Department from './Department'
import Permission from './Permission'
import hash from '@ioc:Adonis/Core/Hash'
import Address from './Address'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { list_filters } from 'App/Helpers'
import { softDeleteQuery, softDelete } from 'App/Services/SoftDelete'

export default class User extends BaseModel {

  public static hidden = ['password']

  static get filters () {
    return {
      name: {
        field: 'name',
        placeholder: 'Buscar usuários...',
        type: 'global_search',
        searchFields: ['name', 'slug', 'cpf_cnpj', 'email'], // Campos onde a busca será feita
        isLike: true,
      },
      position_id: {
        field: 'position_id',
        placeholder: 'Perfil',
        type: 'dropdown',
        modelName: 'Position'
      },
      department_id: {
        field: 'department_id',
        placeholder: 'Departamento',
        type: 'dropdown',
        modelName: 'Department'
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
  
  @column()
  public trade_name: string
  
  @column()
  public state_registration: string

  @column()
  public cpf_cnpj: string

  @column()
  public phone: string
  
  @column()
  public mobile_phone: string

  @column()
  public contact_name: string

  @column()
  public avatar: string

  @column()
  public status: string

  @column()
  public email: string

  @column()
  public obs: string

  @column()
  public password: string

  @column()
  public rememberMeToken: string | null

  @column()
  public position_id: number

  @column()
  public department_id: number

  @column()
  public discount_percent: number

  @column()
  public comission_percent: number

  @column()
  public comission_type: string

  @belongsTo(() => Position, {
    localKey: 'id',
    foreignKey: 'position_id'
  })
  public position: BelongsTo<typeof Position>

  @column()
  public address_id: number

  @belongsTo(() => Address, {
      localKey: 'id',
      foreignKey: 'address_id'
    })
  public address: BelongsTo<typeof Address>

  @belongsTo(() => Department, {
    localKey: 'id',
    foreignKey: 'department_id'
  })
  public department: BelongsTo<typeof Department>

  @manyToMany(() => Permission, {
    pivotTable: 'user_permission'
  })
  public permissions: ManyToMany<typeof Permission>

  @column()
  public birthday: DateTime | string

  @column.dateTime({ serializeAs: null})
  public deletedAt: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await hash.make(user.password)
    }
  }

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