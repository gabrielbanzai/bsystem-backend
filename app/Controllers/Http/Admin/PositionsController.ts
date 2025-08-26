import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, slug_parse, transform_pagination, where_slug_or_id } from 'App/Helpers'
import Position from 'App/Models/Position'
import PositionValidator from 'App/Validators/PositionValidator'

export default class PositionsController {

    async index(ctx: HttpContextContract) {
        try {
            let { response, auth } = ctx
            let positions: any = Position.query().preload('department').preload('permissions')
            if(auth.user && auth.user.id > 2){
              positions.whereNotIn('id', [1,2])
            }
            positions = await Position.listFiltersPaginate(ctx, positions)
            positions = transform_pagination(positions.toJSON())
            const filters = await generate_filters_to_send(Position)
            return response.status(200).send({...positions, filters})
        } catch (error) {
            throw error
        }
    }

    async store({ request, response }: HttpContextContract) {
        const trx = await Database.beginGlobalTransaction()
        try {
            const { name, permissions, department_id } = await request.validate(PositionValidator)
            const slug: string = await slug_parse(name)
            const position = await Position.create({name,slug,department_id})
            if(permissions && Array.isArray(permissions)){
                await position.related('permissions').sync(permissions, undefined, trx)
            }
            await trx.commit()
            return response.status(200).send({data: position})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const position = await where_slug_or_id(Position, id)
            await position?.load('permissions')
            await position?.load('department', builder => {
                builder.preload('permissions')
            })
            return response.status(200).send({data: position})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
        const trx = await Database.beginGlobalTransaction()
        try {
            const { name, department_id, permissions } = await request.validate(PositionValidator)
            const slug: string = await slug_parse(name)
            const position = await where_slug_or_id(Position, id, trx)
            position.merge({name, slug, department_id})
            await position.save()
            if(permissions && Array.isArray(permissions)){
                await position.related('permissions').sync(permissions, undefined, trx)
            }
            await trx.commit()
            await position?.load('department')
            return response.status(200).send({data: position})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const position = await where_slug_or_id(Position, id)
            await position.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }
    }

}
