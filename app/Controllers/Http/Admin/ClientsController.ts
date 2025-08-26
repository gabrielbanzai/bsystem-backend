import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { generate_filters_to_send, sanitizeFields, transform_pagination, where_slug_or_id } from 'App/Helpers'
import Address from 'App/Models/Address'
import Client from 'App/Models/Client'
import EntityService from 'App/Services/EntityService'
import ClientValidator from 'App/Validators/ClientValidator'
import { schema } from '@ioc:Adonis/Core/Validator'
import { parse } from 'fast-csv'
import Application from '@ioc:Adonis/Core/Application'
import fs from 'fs'
// import Redis from '@ioc:Adonis/Addons/Redis'

export default class ClientsController {

    async index(ctx: HttpContextContract) {
        try {
            let { response, auth } = ctx
            let clients: any = Client.query()
            if(auth.user && auth.user.id > 2){
              clients.whereNotIn('id', [1,2])
            }
            clients.preload('address')
            clients = await Client.listFiltersPaginate(ctx, clients)
            clients = transform_pagination(clients.toJSON())
            const filters = await generate_filters_to_send(Client)
            return response.status(200).send({...clients, filters})
        } catch (error) {
            throw error
        }
    }

    async store(ctx: HttpContextContract) {
      const enServ: EntityService = new EntityService();
        let trx = await Database.beginGlobalTransaction()
        try {
            const { request, response } = ctx
            const { name } = await request.validate(ClientValidator)
            const { trade_name, state_registration, contact_name, email, cpf_cnpj, phone, mobile_phone, obs, address } = request.all()
            const client = await Client.create({name, trade_name, contact_name, state_registration, email, cpf_cnpj, phone, mobile_phone, obs}, trx)
            await enServ.slugfy('Client', client, trx)

            if(address && Object.keys(address).length > 0){
                const newAddress = await Address.create(address, trx)
                client.merge({address_id: newAddress.id})
                await client.save()
            }

            await trx.commit()
            return response.status(200).send({data: client})
        } catch (error) {
            throw error
        }
    }

    async show({ params : { id }, response }: HttpContextContract) {
        try {
            const client = await where_slug_or_id(Client, id)
            await client.load('address')
            return response.status(200).send({data: client})
        } catch (error) {
            throw error
        }
    }

    async update({ params : { id }, request, response }: HttpContextContract) {
      const enServ: EntityService = new EntityService();
      const trx = await Database.beginGlobalTransaction()
        try {
            const { name, trade_name, contact_name, state_registration, email, cpf_cnpj, phone, mobile_phone, obs, status, address } = request.all()
            const client = await where_slug_or_id(Client, id, trx)
            if(!client){
                return response.status(404).send({
                    message: 'Cliente não encontrado'
                })
            }
            client.merge({name, trade_name, contact_name, state_registration, email, cpf_cnpj, phone, mobile_phone, status, obs})
            if(address && Object.keys(address).length > 0){
                let clientAddress
                if(client.address_id){
                    clientAddress = await Address.find(client.address_id)
                    clientAddress.merge(address)
                    await clientAddress.save()
                }else{
                    clientAddress = await Address.create(address, trx)
                }
                client.merge({address_id: clientAddress.id})
                await client.save(trx)
            }
            await client.save(trx)
            await enServ.slugfy('Client', client, trx)
            await trx.commit()
            return response.status(200).send({data: client})
        } catch (error) {
            throw error
        }
    }

    async destroy({ params : { id }, response }: HttpContextContract) {
        try {
            const client = await where_slug_or_id(Client, id)
            await client.softDelete()
            return response.status(200).send({})
        } catch (error) {
            throw error
        }

    }

    async updateStatus({ params : { id }, request, response }: HttpContextContract) {
    
        let {status} = request.all()
    
        try {
          let client = await Client.findOrFail(id)
    
          client.merge({status})
    
          await client.save()
    
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
                const exists = await Client.findBy('cpf_cnpj', row.cpf_cnpj);
    
                if (exists) {
                  skippedItems.push({ ...row, reason: 'Já existe' });
                  return;
                }
    
                const client = await Client.create({
                  cpf_cnpj: sanitizeFields(row.cpf_cnpj),
                  name: row.nome_razao_social,
                  trade_name: row.nome_fantasia,
                  state_registration: sanitizeFields(row.inscricao_estadual),
                  email: row.email,
                  phone: sanitizeFields(row.telefone),
                  mobile_phone: sanitizeFields(row.celular),
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
    
                client.address_id = address.id;
                await client.save();
    
                insertedItems.push(client.toJSON());
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
    

    // async storeBatch({ request, response }: HttpContextContract) {
    //     const enServ: EntityService = new EntityService();
    //     const insertedItems: any[] = []
    //     const skippedItems: any[] = []
    //     const errorItems: any[] = []
    //     let totalRecords = 0;  // Total de registros
    //     let processedRecords = 0; // Registros processados
    
    //     try {
    //         const fileSchema = schema.create({
    //             file: schema.file({
    //                 extnames: ['csv'],
    //             }),
    //         });
    
    //         const payload = await request.validate({ schema: fileSchema });
    //         const file = payload.file!
    
    //         await file.move(Application.tmpPath())
    
    //         const stream = parse({ headers: true })
    //             .on('error', (error) => {
    //                 console.error(error);
    //             })
    //             .on('data', async (row) => {
    //                 totalRecords++;  // Incrementa o total de registros a cada linha
    
    //                 try {
    //                     const exists = await Client.findBy('cpf_cnpj', row.cpf_cnpj)
    
    //                     if (exists) {
    //                         skippedItems.push({ ...row, reason: 'Já existe' })
    //                         return
    //                     }
    
    //                     const client = await Client.create({
    //                         cpf_cnpj: sanitizeFields(row.cpf_cnpj),
    //                         name: row.nome_razao_social,
    //                         trade_name: row.nome_fantasia,
    //                         state_registration: sanitizeFields(row.inscricao_estadual),
    //                         email: row.email,
    //                         phone: sanitizeFields(row.telefone),
    //                         contact_name: row.contato,
    //                         obs: row.obs,
    //                     })
    
    //                     await enServ.slugfy('Client', client)
    
    //                     const address = await Address.create({
    //                         street: row.rua,
    //                         number: row.numero,
    //                         complement: row.complemento,
    //                         district: row.bairro,
    //                         city: row.cidade,
    //                         uf: row.uf,
    //                         zipcode: sanitizeFields(row.cep)
    //                     })
    
    //                     client.merge({ address_id: address.id })
    //                     await client.save()
    
    //                     insertedItems.push(client.toJSON())
    
    //                 } catch (error) {
    //                     errorItems.push({ ...row, reason: error.message })
    //                 }
    
    //                 processedRecords++;  // Incrementa o número de registros processados
    //             })
    //             .on('end', async () => {
    //                 console.log(`Processado ${totalRecords} registros`);
    //                 // Quando o processamento acabar, respondemos com os totais
    //                 return response.ok({
    //                     inserted: insertedItems.length,
    //                     skipped: skippedItems.length,
    //                     errors: errorItems.length,
    //                     details: {
    //                         insertedItems,
    //                         skippedItems,
    //                         errorItems,
    //                     },
    //                 });
    //             });
    
    //         const readStream = Application.tmpPath(file.clientName);
    //         const fileStream = fs.createReadStream(readStream);
    //         fileStream.pipe(stream);
    
    //     } catch (error) {
    //         console.log(error);
    //         return response.status(500).send({ message: 'Erro ao processar o arquivo', error: error.message });
    //     }
    // }
    
    

}

