import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import {  where_slug_or_id } from 'App/Helpers'
import Configuration from 'App/Models/Configuration'
import EntityService from 'App/Services/EntityService'

export default class ConfigurationsController {

    async index(ctx: HttpContextContract) {
        try {

            let { response } = ctx

            let configurations = await Configuration.query()
            return response.status(200).send({data: configurations})

        } catch (error) {
            throw error
        }
    }

    async store({ request, response }: HttpContextContract) {
        const enServ: EntityService = new EntityService();
        let trx = await Database.beginGlobalTransaction()
        try {
            const { name, value_text, value_integer, value_decimal, value_boolean, value_json } = await request.all()
            const configuration = await Configuration.create({name, value_text, value_integer, value_decimal, value_boolean, value_json}, trx)
            await enServ.slugfy('Configuration', configuration, trx)

            await trx.commit()
            return response.status(200).send({data: configuration})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const configuration = await where_slug_or_id(Configuration, id)
            return response.status(200).send({data: configuration})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
        const enServ: EntityService = new EntityService();
        let trx = await Database.beginGlobalTransaction()
        try {
            const { name, value_text, value_integer, value_decimal, value_boolean, value_json } = await request.all()
            const configuration = await where_slug_or_id(Configuration, id)
            configuration?.merge({name, value_text, value_integer, value_decimal, value_boolean, value_json})
            await configuration?.save()
            await enServ.slugfy('Configuration', configuration, trx)
            await trx.commit()
            return response.status(200).send({data: configuration})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const configuration = await where_slug_or_id(Configuration, id)
            await configuration.delete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }
    }
}
