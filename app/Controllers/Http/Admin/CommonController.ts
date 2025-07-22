import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import { parse } from 'fast-csv'
import Application from '@ioc:Adonis/Core/Application'
import fs from 'fs'
import Bank from 'App/Models/Bank'
import EntityService from 'App/Services/EntityService'

export default class CommonController {
 
  public async storeBatch({ request, response }: HttpContextContract) {
      const enServ: EntityService = new EntityService();
      const insertedItems: any[] = [];
      const skippedItems: any[] = [];
      const errorItems: any[] = [];
  
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
            try {
              const exists = await Bank.findBy('name', row.name);
  
              if (exists) {
                skippedItems.push({ ...row, reason: 'Já existe' });
                return;
              }
              
              let bank = await Bank.create({
                name: row.name,
                code: row.code
              })
              
              await enServ.slugfy('Bank', bank, null)

              insertedItems.push(bank.toJSON());
            } catch (error) {
              errorItems.push({ ...row, reason: error.message });
            }
  
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

