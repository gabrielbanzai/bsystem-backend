import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { generate_filters_to_send, slug_parse, transform_pagination, where_slug_or_id } from 'App/Helpers'
import Permission from 'App/Models/Permission'
import PermissionValidator from 'App/Validators/PermissionValidator'

export default class PermissionsController {

    async index(ctx: HttpContextContract) {
        try {

          let { response, auth } = ctx

          if(auth.user){
            let permissions: any = Permission.query().whereNot('id', 1).whereNot('hide_client', 1).whereNot('hide_admin', 1)
            permissions = await Permission.listFiltersPaginate(ctx, permissions)
            permissions = transform_pagination(permissions.toJSON())
            const filters = await generate_filters_to_send(Permission)
            return response.status(200).send({...permissions, filters})
          }

        } catch (error) {
            throw error
        }
    }

    async store({ request, response }: HttpContextContract) {
        try {
            const { name } = await request.validate(PermissionValidator)
            const slug: string = await slug_parse(name)
            const permission = await Permission.create({name,slug})
            return response.status(200).send({data: permission})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const permission = await where_slug_or_id(Permission, id)
            return response.status(200).send({data: permission})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
        try {
            const { name } = await request.validate(PermissionValidator)
            const slug: string = await slug_parse(name)
            const permission = await where_slug_or_id(Permission, id)
            permission?.merge({name, slug})
            await permission?.save()
            return response.status(200).send({data: permission})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const permission = await where_slug_or_id(Permission, id)
            if(permission){
                await permission.softDelete()
            }
            return response.status(200).send({})
        } catch (error) {
            throw error
        }
    }
}
