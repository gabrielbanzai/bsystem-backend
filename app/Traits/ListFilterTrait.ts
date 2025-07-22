// app/Traits/ListFilterTrait.ts
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { list_filters } from 'App/Helpers'

export function applyListFilterTrait(model: any) {
  model.listFilters = async function (ctx: HttpContextContract, currentQuery: any) {
    const { request } = ctx
    return list_filters(this.filters, currentQuery, request.all())
  }

  model.listFiltersPaginate = async function (ctx: HttpContextContract, currentQuery: any) {
    const { request, pagination } = ctx
    const query = list_filters(this.filters, currentQuery, request.all())
    return await query.paginate(pagination.page, pagination.limit)
  }
}
