import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Storage from 'App/Models/Storage'

export default class extends BaseSeeder {
  public async run () {
    // Write your database queries inside the run method
    await Storage.create({
      name: 'Estoque principal',
      slug: 'estoque-principal',
      principal_storage: true,
      purchase_enabled: true,
    })
    await Storage.create({
      name: 'Consumo interno',
      slug: 'consumo-interno',
      principal_storage: false,
      purchase_enabled: true,
    })
    await Storage.create({
      name: 'Trocas',
      slug: 'trocas',
      principal_storage: false,
      purchase_enabled: false,
    })
    await Storage.create({
      name: 'Perdas',
      slug: 'perdas',
      principal_storage: false,
      purchase_enabled: false,
    })
  }
}
