import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Position from 'App/Models/Position'

export default class extends BaseSeeder {
  public async run () {
    // Write your database queries inside the run method
    await Position.create({
      name: 'Gestor',
      slug: 'gestor'
    })

    await Position.create({
      name: 'Operador Júnior',
      slug: 'operador-junior'
    })

    await Position.create({
      name: 'Operador Pleno',
      slug: 'opreador-pleno'
    })

    await Position.create({
      name: 'Operador Sênior',
      slug: 'opreador-senior'
    })

  }
}
