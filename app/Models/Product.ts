import { DateTime } from 'luxon'
import { afterCreate, BaseModel, beforeFetch, beforeFind, belongsTo, BelongsTo, column, HasMany, hasMany, manyToMany, ManyToMany } from '@ioc:Adonis/Lucid/Orm'
import ProductUnity from './ProductUnity'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { list_filters } from 'App/Helpers'
import { softDeleteQuery, softDelete } from 'App/Services/SoftDelete'
import ProductGroup from './ProductGroup'
import ProductCategory from './ProductCategory'
import Stock from './Stock'
import Supplier from './Supplier'
import Storage from './Storage'
import ProductPrice from './ProductPrice'
import ProductCost from './ProductCost'

export default class Product extends BaseModel {

  static get filters () {
    return {
      search_string: {
        field: 'search_string',
        fields: ['name', 'id', 'reference', 'barcode'],
        type: 'combo_search',
        hideOnList: true,
        isLike: true,
      },
      name: {
        field: 'name',
        placeholder: 'Nome',
        type: 'string',
        cssColClass: 'col-md-6',
        isLike: true,
      },
      reference: {
        field: 'reference',
        placeholder: 'Código',
        type: 'string',
        cssColClass: 'col-md-3',
        isLike: true,
      },
      barcode: {
        field: 'barcode',
        placeholder: 'Código de barras',
        type: 'string',
        cssColClass: 'col-md-3',
        isLike: true,
      },
      supplier_id: {
        field: 'supplier_id',
        placeholder: 'Fornecedor',
        type: 'array_in_related',
        related: ['suppliers'],
        field_in_related: 'id',
        modelName: 'Supplier',
        cssColClass: 'col-md-4',
      },
      group_id: {
        field: 'product_group_id',
        placeholder: 'Grupo',
        type: 'dropdown',
        modelName: 'ProductGroup',
        cssColClass: 'col-md-3',
      },
      category_id: {
        field: 'product_category_id',
        placeholder: 'Categoria',
        type: 'dropdown',
        modelName: 'ProductCategory',
        cssColClass: 'col-md-3',
      },
      order: {
        field: 'order',
        placeholder: 'Classificar',
        type: 'order',
        cssColClass: 'col-md-2',
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
  public barcode: string
  
  @column()
  public reference: string

  @column()
  public min_stock: number

  @column()
  public images: any
  
  @column()
  public sale_price: number

  @column()
  public description: string

  @column()
  public status: string

  @column()
  public last_cost: number

  @column()
  public avg_cost: number

  @column()
  public margin_percent: number

  @column()
  public unit_in_id: number

  @belongsTo(() => ProductUnity, {
    localKey: 'id',
    foreignKey: 'unit_in_id'
  })
  public unit_in: BelongsTo<typeof ProductUnity>

  @column()
  public unit_out_id: number

  @belongsTo(() => ProductUnity, {
    localKey: 'id',
    foreignKey: 'unit_out_id'
  })
  public unit_out: BelongsTo<typeof ProductUnity>

  @column()
  public conversion_factor: number

  @column()
  public product_group_id: number

  @belongsTo(() => ProductGroup, {
    localKey: 'id',
    foreignKey: 'product_group_id'
  })
  public product_group: BelongsTo<typeof ProductGroup>

  @column()
  public product_category_id: number

  @hasMany(() => Stock, {
    localKey: 'id',
    foreignKey: 'product_id'
  })
  public stocks: HasMany<typeof Stock>

  @hasMany(() => ProductPrice, {
    localKey: 'id',
    foreignKey: 'product_id'
  })
  public prices: HasMany<typeof ProductPrice>

  @hasMany(() => ProductCost, {
    localKey: 'id',
    foreignKey: 'product_id'
  })
  public costs: HasMany<typeof ProductCost>

  @belongsTo(() => ProductCategory, {
    localKey: 'id',
    foreignKey: 'product_category_id'
  })
  public product_category: BelongsTo<typeof ProductCategory>

  @manyToMany(() => Supplier, {
    pivotTable: 'product_supplier'
  })
  public suppliers: ManyToMany<typeof Supplier>

  @column.dateTime({ serializeAs: null})
  public deletedAt: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @afterCreate()
  public static async createStock (product: Product) {
    let storages = await Storage.query()

    if(storages && storages.length > 0){
      await Promise.all(
        storages.map(async storage => {
          await Stock.create({
            product_id: product.id,
            storage_id: storage.id
          })
        })
      )
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
