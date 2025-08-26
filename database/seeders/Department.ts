import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Department from 'App/Models/Department'

export default class extends BaseSeeder {
  public async run () {
    // Write your database queries inside the run method
    await Department.create({
      name: 'Gestão do sistema',
      slug: 'gestao-do-sistema'
    })

    await Department.create({
      name: 'Operadores do sistema',
      slug: 'operadores-do-sistema'
    })

    await Department.create({
      name: 'Financeiro',
      slug: 'financeiro'
    })

    await Department.create({
      name: 'Compras',
      slug: 'compras'
    })

    await Department.create({
      name: 'Vendas',
      slug: 'vendas'
    })

    await Department.create({
      name: 'Departamento técnico',
      slug: 'departamento-tecnico'
    })

  }
}
