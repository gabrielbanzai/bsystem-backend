import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination, where_slug_or_id } from 'App/Helpers'
import Position from 'App/Models/Position'
import EntityService from 'App/Services/EntityService'
import PositionValidator from 'App/Validators/PositionValidator'

export default class PositionsController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let positions: any = Position.query().preload('department').preload('permissions')
            positions = await Position.listFiltersPaginate(ctx, positions)
            positions = transform_pagination(positions.toJSON())
            const filters = await generate_filters_to_send(Position)
            return response.status(200).send({...positions, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        const enServ: EntityService = new EntityService();
        let trx = await Database.beginGlobalTransaction()
        try {
            const { request, response } = ctx
            const { name, department_id, permissions } = await request.validate(PositionValidator)
            const position = await Position.create({name, department_id}, trx)
            await enServ.slugfy('Position', position, trx)
            if(permissions && Array.isArray(permissions)){
                await position.related('permissions').sync(permissions, undefined, trx)
            }
            await trx.commit()
            return response.status(200).send({data: position})
        } catch (error) {
            throw error
        }
    }

    async show(ctx: HttpContextContract) {
        try {
            const { params : { id }, response } = ctx
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

    async update(ctx: HttpContextContract) {
      const enServ: EntityService = new EntityService();
      const trx = await Database.beginGlobalTransaction()
        try {
            const { params : { id }, request, response } = ctx
            const { name, department_id, permissions } = request.all()
            const position = await where_slug_or_id(Position, id, trx)
            if(!position){
                return response.status(404).send({
                    message: 'Cargo não encontrado'
                })
            }
            position.merge({name, department_id})
            await position.save(trx)
            await enServ.slugfy('Position', position, trx)
            if(permissions && Array.isArray(permissions)){
                await position.related('permissions').sync(permissions, undefined, trx)
            }
            await trx.commit()
            return response.status(200).send({data: position})
        } catch (error) {
            throw error
        }
    }

    async destroy(ctx: HttpContextContract) {
        try {
            const { params : { id }, response } = ctx
            const position = await where_slug_or_id(Position, id)
            await position.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }

}
