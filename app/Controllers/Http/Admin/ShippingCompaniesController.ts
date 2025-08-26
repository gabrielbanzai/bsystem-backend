import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, sanitizeFields, transform_pagination, where_slug_or_id } from 'App/Helpers'
import Address from 'App/Models/Address'
import ShippingCompany from 'App/Models/ShippingCompany'
import EntityService from 'App/Services/EntityService'
import ShippingCompanyValidator from 'App/Validators/ShippingCompanyValidator'
import { schema } from '@ioc:Adonis/Core/Validator'
import { parse } from 'fast-csv'
import Application from '@ioc:Adonis/Core/Application'
import fs from 'fs'

export default class ShippingCompaniesController {

    async index(ctx: HttpContextContract) {
        try {
            let { response, auth } = ctx
            let shipping_companies: any = ShippingCompany.query()
            if(auth.user && auth.user.id > 2){
              shipping_companies.whereNotIn('id', [1,2])
            }
            shipping_companies.preload('address')
            shipping_companies.preload('vehicles')
            shipping_companies = await ShippingCompany.listFiltersPaginate(ctx, shipping_companies)
            shipping_companies = transform_pagination(shipping_companies.toJSON())
            const filters = await generate_filters_to_send(ShippingCompany)
            return response.status(200).send({...shipping_companies, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
      const enServ: EntityService = new EntityService();
        let trx = await Database.beginGlobalTransaction()
        try {
            const { request, response } = ctx
            const { name } = await request.validate(ShippingCompanyValidator)
            const { trade_name, state_registration, contact_name, email, cpf_cnpj, phone, mobile_phone, obs, address } = request.all()
            const shipping_company = await ShippingCompany.create({name, trade_name, contact_name, state_registration, email, cpf_cnpj, phone, mobile_phone, obs}, trx)
            await enServ.slugfy('ShippingCompany', shipping_company, trx)

            if(address && Object.keys(address).length > 0){
                const newAddress = await Address.create(address, trx)
                shipping_company.merge({address_id: newAddress.id})
                await shipping_company.save()
            }

            // if(vehicles && Array.isArray(vehicles) && vehicles.length > 0){
            //     await Vehicle.createMany(vehicles, trx)
            // }

            await trx.commit()

            await shipping_company.load('vehicles')
            await shipping_company.load('address')

            return response.status(200).send({data: shipping_company})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const shipping_company = await where_slug_or_id(ShippingCompany, id)
            await shipping_company.load('address')
            await shipping_company.load('vehicles')
            return response.status(200).send({data: shipping_company})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
      const enServ: EntityService = new EntityService();
      const trx = await Database.beginGlobalTransaction()
        try {
            const { name } = request.all()
            const { trade_name, contact_name, state_registration, email, cpf_cnpj, phone, mobile_phone, obs, address } = request.all()
            const shipping_company = await where_slug_or_id(ShippingCompany, id, trx)
            if(!shipping_company){
                return response.status(404).send({
                    message: 'Transportadora não encontrada'
                })
            }
            shipping_company.merge({name, trade_name, contact_name, state_registration, email, cpf_cnpj, phone, mobile_phone, obs})
            if(address && Object.keys(address).length > 0){
                let shipping_companyAddress
                if(shipping_company.address_id){
                    shipping_companyAddress = await Address.find(shipping_company.address_id)
                    shipping_companyAddress.merge(address)
                    await shipping_companyAddress.save()
                }else{
                    shipping_companyAddress = await Address.create(address, trx)
                }
                shipping_company.merge({address_id: shipping_companyAddress.id})
                await shipping_company.save(trx)
            } 
            // if(vehicles && Array.isArray(vehicles) && vehicles.length > 0){
            //     await shipping_company.related('vehicles').query().delete(trx)
            //     await shipping_company.related('vehicles').createMany(vehicles, trx)
            // }
            await shipping_company.save(trx)
            await enServ.slugfy('ShippingCompany', shipping_company, trx)
            await trx.commit()

            await shipping_company.load('address')
            await shipping_company.load('vehicles')

            return response.status(200).send({data: shipping_company})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const shipping_company = await where_slug_or_id(ShippingCompany, id)
            await shipping_company.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }

    async updateStatus({ params : { id }, request, response }: HttpContextContract) {
    
        let {status} = request.all()
    
        try {
          let shipping_company = await ShippingCompany.findOrFail(id)
    
          shipping_company.merge({status})
    
          await shipping_company.save()
    
          return response.status(200).send({message: 'Status atualizado com sucesso!'})
    
        } catch (error) {
            throw error
        }
    
    }

    public async storeBatch({ request, response }: HttpContextContract) {
        const insertedItems: any[] = [];
        const skippedItems: any[] = [];
        const errorItems: any[] = [];
        // let totalRecords = 0;
        // let processedRecords = 0;
    
        // const userId = request.input('user_id'); // O ID do usuário autenticado
        // const statusChannel = `user:${userId}`; // Canal Redis específico do usuário
    
        try {
            const fileSchema = schema.create({
            file: schema.file({
                extnames: ['csv'],
            }),
            });
    
            const payload = await request.validate({ schema: fileSchema });
            const file = payload.file!;
    
            await file.move(Application.tmpPath());
    
            const stream = parse({ headers: true })
            .on('error', (error) => {
                console.error(error);
            })
            .on('data', async (row) => {
                // totalRecords++;
    
                try {
                const exists = await ShippingCompany.findBy('cpf_cnpj', row.cpf_cnpj);
    
                if (exists) {
                    skippedItems.push({ ...row, reason: 'Já existe' });
                    return;
                }
    
                const shipping_company = await ShippingCompany.create({
                    cpf_cnpj: sanitizeFields(row.cpf_cnpj),
                    name: row.nome_razao_social,
                    trade_name: row.nome_fantasia,
                    state_registration: sanitizeFields(row.inscricao_estadual),
                    email: row.email,
                    phone: sanitizeFields(row.telefone),
                    contact_name: row.contato,
                });
    
                const address = await Address.create({
                    street: row.rua,
                    number: row.numero,
                    district: row.bairro,
                    city: row.cidade,
                    uf: row.uf,
                    zipcode: sanitizeFields(row.cep),
                });
    
                shipping_company.address_id = address.id;
                await shipping_company.save();
    
                insertedItems.push(shipping_company.toJSON());
                } catch (error) {
                errorItems.push({ ...row, reason: error.message });
                }
    
                // processedRecords++;
    
                // Calculando o progresso
                //const progress = Math.floor((processedRecords / totalRecords) * 100);
    
                // Enviar o progresso pelo Redis para o canal do usuário
                //await Redis.publish(statusChannel, JSON.stringify({ type: 'progress', progress }));
    
            })
            .on('end', async () => {
                return response.ok({
                inserted: insertedItems.length,
                skipped: skippedItems.length,
                errors: errorItems.length,
                details: {
                    insertedItems,
                    skippedItems,
                    errorItems,
                },
                });
            });
    
            const readStream = Application.tmpPath(file.clientName);
            const fileStream = fs.createReadStream(readStream);
            fileStream.pipe(stream);
    
        } catch (error) {
            console.log(error);
            return response.status(500).send({ message: 'Erro ao processar o arquivo', error: error.message });
        }
    }

}

