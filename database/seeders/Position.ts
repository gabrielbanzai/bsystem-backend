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
      name: 'Operador júnior',
      slug: 'operador-junior'
    })
    
    await Position.create({
      name: 'Operador pleno',
      slug: 'opreador-pleno'
    })

    await Position.create({
      name: 'Operador sênior',
      slug: 'opreador-senior'
    })

    await Position.create({
      name: 'Analista de financeiro',
      slug: 'comprador'
    })

    await Position.create({
      name: 'Comprador',
      slug: 'comprador'
    })

    await Position.create({
      name: 'Vendedor',
      slug: 'vendedor'
    })

    await Position.create({
      name: 'Técnico',
      slug: 'tecnico'
    })
  }
}
