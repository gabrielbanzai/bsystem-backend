import Application from '@ioc:Adonis/Core/Application'
import Env from '@ioc:Adonis/Core/Env'

import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, slug_parse, transform_pagination, where_slug_or_id } from 'App/Helpers'
import User from 'App/Models/User'
import AuthService from 'App/Services/AuthService'
import EntityService from 'App/Services/EntityService'
import path from 'path'
import fs from 'fs'
import Address from 'App/Models/Address'

export default class UsersController {

  async index(ctx: HttpContextContract) {
      try {
          let { response } = ctx
          let users: any = User.query()
          .preload('permissions')
          .preload('department')
          .preload('position')
          .whereNot('id', 1)
          users = await User.listFiltersPaginate(ctx , users)
          users = transform_pagination(users.toJSON())
          users.data = users.data.map(user => {
            return {
              id: user.id,
              name: user.name,
              slug: user.slug,
              email: user.email,
              cpf_cnpj: user.cpf_cnpj,
              phone: user.phone,
              position_id: user.position_id,
              position: user.position,
              department_id: user.department_id,
              department: user.department,
              avatar: user.avatar,
              permissions: user.permissions,
              status: user.status,
              created_at: user.createdAt
            }
          })

          const filters = await generate_filters_to_send(User)

          return response.status(200).send({...users, filters})
      } catch (error) {
          throw error
      }
  }

  async store( { request, response }: HttpContextContract) {

    const enServ: EntityService = new EntityService();
    const trx = await Database.beginGlobalTransaction()
    const authServ : AuthService = new AuthService()

    try {
        const { name, email, cpf_cnpj, birthday, address, trade_name, state_registration, phone, mobile_phone, contact_name, comission_percent, discount_percent, obs, comission_type, permissions, position_id, department_id } = await request.all()

        const user = await User.create({
          name, email, cpf_cnpj, trade_name, state_registration, phone, mobile_phone, contact_name, comission_percent, discount_percent, comission_type, obs, position_id, department_id, birthday
        }, trx)

        await enServ.slugfy('User', user, trx)

        if(Array.isArray(permissions)){
            await user.related('permissions').sync(permissions, undefined, trx)
        }

        if(address && Object.keys(address).length > 0){
          const newAddress = await Address.create(address, trx)
          user.merge({address_id: newAddress.id})
          await user.save()
        }
        await user.load('permissions')
        await user.load('department')
        await user.load('position')
        await user.load('address')

        await trx.commit()
        await authServ.resetPassword(user)
        return response.status(200).send({data: user})
    } catch (error) {
        // if(trx){
        //   await trx.rollback()
        // }
        throw error
    }

  }

  async show({ params : { id }, response }: HttpContextContract) {
      try {
          let user = await where_slug_or_id(User, id)
          await user.load('permissions')
          await user.load('address')
          await user.load('department', dpquery => {
              dpquery.preload('permissions')
          })
          await user.load('position', (psquery) => {
            psquery.preload('permissions')
          })
          user.password = null
          return response.status(200).send({data: user})
      } catch (error) {
          throw error
      }

  }

  async update({ params : { id }, request, response }: HttpContextContract) {

      const enServ: EntityService = new EntityService();
      const trx = await Database.beginGlobalTransaction()

      try {
          const { name, email, cpf_cnpj, trade_name, state_registration, phone, mobile_phone, contact_name, comission_percent, discount_percent, obs, comission_type, permissions, position_id, department_id } = await request.all()
          const { birthday, address } = request.all()
          const user = await where_slug_or_id(User, id, trx)
          user.merge({name, email, cpf_cnpj, trade_name, state_registration, phone, mobile_phone, contact_name, comission_percent, discount_percent, obs, comission_type, position_id, department_id, birthday})
          await user.save()
          await enServ.slugfy('User', user, trx)

          if(Array.isArray(permissions)){
              await user.related('permissions').sync(permissions, undefined, trx)
          }

          if(address && Object.keys(address).length > 0){
            let userAddress
            if(user.address_id){
                userAddress = await Address.find(user.address_id)
                userAddress.merge(address)
                await userAddress.save()
            }else{
                userAddress = await Address.create(address, trx)
            }
            user.merge({address_id: userAddress.id})
            await user.save()
          }
          await user.load('permissions')
          await user.load('department')
          await user.load('position')
          await user.load('address')

          await trx.commit()
          return response.status(200).send({data: user})
      } catch (error) {
          // if(trx){
          //   await trx.rollback()
          // }
          throw error
      }

  }

  async destroy({ params : { id }, response }: HttpContextContract) {
      try {
          const user = await where_slug_or_id(User, id)
          await user.softDelete()
          return response.status(200).send({})
      } catch (error) {
          throw error
      }

  }

  async updateProfile({ params : { id }, request, response }: HttpContextContract) {

    const trx = await Database.beginGlobalTransaction()

    try {
        const  name = await request.input('name')
        const  birthday = await request.input('birthday')
        const  phone = await request.input('phone')
        const file = request.file('file', {
          size: '1mb',
          extnames: ['jpg', 'jpeg', 'webp', 'png'],
        });
        const  password = await request.input('password')
        const  password_confirmation = await request.input('password_confirmation')
        const user = await where_slug_or_id(User, id, trx)
        const slug: string = await slug_parse(name)
        user.merge({name, slug})

        if(birthday){
          user.merge({birthday})
        }

        if(phone){
          user.merge({phone})
        }

        if(password){
          if(password != password_confirmation){
            return response.status(400).send({message: 'Senha e confirmação de senha não combinam.'})
          }

          user.merge({password})
        }

        if(file){

          const outputDir = Application.publicPath('uploads');
          const uniqueName = `user_avatar_${user.id}.${file.extname}`;
          const outputPath = path.join(outputDir);
          const avatar_url = `${Env.get('SERVER_URL')}/uploads/${uniqueName}`
          if(user.avatar){
            let file = await fs.readFileSync(`${Application.publicPath('uploads')}/${uniqueName}`)
            if(file){
              await fs.unlinkSync(`${Application.publicPath('uploads')}/${uniqueName}`)
            }
          }
          await file.move(outputPath)
          user.merge({avatar: avatar_url})
        }

        await user.save()
        await user.load('department', trx)
        await user.load('position', trx)

        await trx.commit()
        return response.status(200).send({data: user})
    } catch (error) {
        throw error
    }

  }

  async updateStatus({ params : { id }, request, response }: HttpContextContract) {

    let {status} = request.all()

    try {
      let user = await User.findOrFail(id)

      user.merge({status})

      await user.save()

      return response.status(200).send({message: 'Status atualizado com sucesso!'})

    } catch (error) {
        throw error
    }

  }
}
