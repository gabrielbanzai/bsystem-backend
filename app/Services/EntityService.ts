import { TransactionClientContract } from "@ioc:Adonis/Lucid/Database";
import { slug_parse } from "App/Helpers";

class EntityService {
  public async slugfy(modelName: string, entity: any, trx: TransactionClientContract | null = null){

    let model: any = await import(`App/Models/${modelName}`)

    // Gerando o slug inicial (transformando o nome em slug)
    const baseSlug = await slug_parse(entity.name || entity.title)

    // Verificando se o slug já existe
    let uniqueSlug = baseSlug;
    let counter = 1;

    let check = await model.default.query().where('slug', 'like', `%${baseSlug}%`).whereNot('id', entity.id)

    // Verifica se o slug já existe e incrementa o contador até encontrar um disponível
    while (check.some(entity => entity.slug === uniqueSlug)) {
      uniqueSlug = `${baseSlug}${counter}`;
      counter++;
    }

    entity.merge({slug: uniqueSlug})

    await entity.save(trx)

  }
}
export default EntityService
