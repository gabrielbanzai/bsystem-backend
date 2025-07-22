import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Department from 'App/Models/Department'

export default class extends BaseSeeder {
  public async run () {
    // Write your database queries inside the run method
    await Department.create({
      name: 'Gestão do Sistema',
      slug: 'gestao-do-sistema'
    })

    await Department.create({
      name: 'Operadores do Sistema',
      slug: 'operadores-do-sistema'
    })
  }
}
