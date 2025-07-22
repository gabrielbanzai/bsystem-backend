import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, transform_pagination, where_slug_or_id } from 'App/Helpers'
import Department from 'App/Models/Department'
import EntityService from 'App/Services/EntityService'
import DepartmentValidator from 'App/Validators/DepartmentValidator'

export default class DepartmentsController {

    async index(ctx: HttpContextContract) {
        try {
            let { response } = ctx
            let departments: any = Department.query()
            departments.preload('permissions')
            departments = await Department.listFiltersPaginate(ctx, departments)
            departments = transform_pagination(departments.toJSON())
            const filters = await generate_filters_to_send(Department)
            return response.status(200).send({...departments, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
        const enServ: EntityService = new EntityService();
        let trx = await Database.beginGlobalTransaction()
        try {
            const { request, response } = ctx
            const { name, permissions } = await request.validate(DepartmentValidator)
            const department = await Department.create({name}, trx)
            await enServ.slugfy('Department', department, trx)
            if(permissions && Array.isArray(permissions)){
                await department.related('permissions').sync(permissions, undefined, trx)
            }
            await trx.commit()
            return response.status(200).send({data: department})
        } catch (error) {
            throw error
        }
    }

    async show(ctx: HttpContextContract) {
        try {
            const { params : { id }, response } = ctx
            const department = await where_slug_or_id(Department, id)
            await department.load('permissions')
            return response.status(200).send({data: department})
        } catch (error) {
            throw error
        }
    }

    async update(ctx: HttpContextContract) {
      const enServ: EntityService = new EntityService();
      const trx = await Database.beginGlobalTransaction()
        try {
            const { params : { id }, request, response } = ctx
            const { name, permissions } = request.all()
            const department = await where_slug_or_id(Department, id, trx)
            if(!department){
                return response.status(404).send({
                    message: 'Departamento não encontrado'
                })
            }
            department.merge({name})
            await department.save(trx)
            await enServ.slugfy('Department', department, trx)
            if(permissions && Array.isArray(permissions)){
                await department.related('permissions').sync(permissions, undefined, trx)
            }
            await trx.commit()
            return response.status(200).send({data: department})
        } catch (error) {
            throw error
        }
    }

    async destroy(ctx: HttpContextContract) {
        try {
            const { params : { id }, response } = ctx
            const department = await where_slug_or_id(Department, id)
            await department.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }

}

