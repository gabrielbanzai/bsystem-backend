import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { transform_pagination, generate_filters_to_send } from 'App/Helpers'
import Storage from 'App/Models/Storage'

export default class StoragesController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let storages: any = Storage.query()
            storages = await Storage.listFiltersPaginate(ctx, storages)
            storages = transform_pagination(storages.toJSON())
            const filters = await generate_filters_to_send(Storage)
            return response.status(200).send({...storages, filters})
        } catch (error) {
            throw error
        }
    }

}
