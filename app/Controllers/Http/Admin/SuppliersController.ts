import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, sanitizeFields, transform_pagination, where_slug_or_id } from 'App/Helpers'
import Address from 'App/Models/Address'
import Supplier from 'App/Models/Supplier'
import EntityService from 'App/Services/EntityService'
import SupplierValidator from 'App/Validators/SupplierValidator'
import { schema } from '@ioc:Adonis/Core/Validator'
import { parse } from 'fast-csv'
import Application from '@ioc:Adonis/Core/Application'
import fs from 'fs'

export default class SuppliersController {

    async index(ctx: HttpContextContract) {
        try {
            let { response, auth } = ctx
            let suppliers: any = Supplier.query()
            if(auth.user && auth.user.id > 2){
              suppliers.whereNotIn('id', [1,2])
            }
            suppliers.preload('address')
            suppliers = await Supplier.listFiltersPaginate(ctx, suppliers)
            suppliers = transform_pagination(suppliers.toJSON())
            const filters = await generate_filters_to_send(Supplier)
            return response.status(200).send({...suppliers, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
      const enServ: EntityService = new EntityService();
        let trx = await Database.beginGlobalTransaction()
        try {
            const { request, response } = ctx
            const { name } = await request.validate(SupplierValidator)
            const { trade_name, state_registration, contact_name, email, cpf_cnpj, phone, mobile_phone, obs, address } = request.all()
            const supplier = await Supplier.create({name, trade_name, contact_name, state_registration, email, cpf_cnpj, phone, mobile_phone, obs}, trx)
            await enServ.slugfy('Supplier', supplier, trx)

            if(address && Object.keys(address).length > 0){
                const newAddress = await Address.create(address, trx)
                supplier.merge({address_id: newAddress.id})
                await supplier.save()
            }

            await trx.commit()
            await supplier.load('address')
            return response.status(200).send({data: supplier})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const supplier = await where_slug_or_id(Supplier, id)
            await supplier.load('address')
            return response.status(200).send({data: supplier})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
      const enServ: EntityService = new EntityService();
      const trx = await Database.beginGlobalTransaction()
        try {
            const { name } = request.all()
            const { trade_name, contact_name, state_registration, email, cpf_cnpj, phone, mobile_phone, obs, status, address } = request.all()
            const supplier = await where_slug_or_id(Supplier, id, trx)
            if(!supplier){
                return response.status(404).send({
                    message: 'Fornecedor não encontrado'
                })
            }
            supplier.merge({name, trade_name, contact_name, state_registration, email, cpf_cnpj, phone, mobile_phone, status, obs})
            if(address && Object.keys(address).length > 0){
                let supplierAddress
                if(supplier.address_id){
                    supplierAddress = await Address.find(supplier.address_id)
                    supplierAddress.merge(address)
                    await supplierAddress.save()
                }else{
                    supplierAddress = await Address.create(address, trx)
                }
                supplier.merge({address_id: supplierAddress.id})
                await supplier.save(trx)
            }
            await supplier.save(trx)
            await enServ.slugfy('Supplier', supplier, trx)
            await trx.commit()
            await supplier.load('address')
            return response.status(200).send({data: supplier})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const supplier = await where_slug_or_id(Supplier, id)
            await supplier.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }

    async updateStatus({ params : { id }, request, response }: HttpContextContract) {
    
        let {status} = request.all()
    
        try {
          let supplier = await Supplier.findOrFail(id)
    
          supplier.merge({status})
    
          await supplier.save()
    
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
                const exists = await Supplier.findBy('cpf_cnpj', row.cpf_cnpj);
    
                if (exists) {
                    skippedItems.push({ ...row, reason: 'Já existe' });
                    return;
                }
    
                const supplier = await Supplier.create({
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
    
                supplier.address_id = address.id;
                await supplier.save();
    
                insertedItems.push(supplier.toJSON());
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

