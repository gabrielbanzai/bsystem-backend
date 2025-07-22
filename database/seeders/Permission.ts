import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Permission from 'App/Models/Permission'

export default class extends BaseSeeder {
  public async run () {
    // Write your database queries inside the run method
    await Permission.createMany([
      {
        name: 'Master',
        slug: 'master',
        hide_admin: true,
        hide_client: true
      },
      //Usuários
      {
        name: 'Visualizar Usuários',
        slug: 'visualizar-usuarios',
        hide_client: false
      },
      {
        name: 'Criar Usuários',
        slug: 'criar-usuarios',
        hide_client: false
      },
      {
        name: 'Editar Usuários',
        slug: 'editar-usuarios',
        hide_client: false
      },
      {
        name: 'Deletar Usuários',
        slug: 'deletar-usuarios',
        hide_client: false
      },
      // Departamentos
      {
        name: 'Visualizar Departamentos',
        slug: 'visualizar-departamentos',
        hide_client: false
      },
      {
        name: 'Criar Departamentos',
        slug: 'criar-departamentos',
        hide_client: false,
      },
      {
        name: 'Editar Departamentos',
        slug: 'editar-departamentos',
        hide_client: false,
      },
      {
        name: 'Deletar Departamentos',
        slug: 'deletar-departamentos',
        hide_client: false,
      },
      // Perfis - Categorias de acesso que podem ser adicionadas a departamentos
      {
        name: 'Visualizar Cargos',
        slug: 'visualizar-cargos',
        hide_client: false,
      },
      {
        name: 'Criar Cargos',
        slug: 'criar-cargos',
        hide_client: false,
      },
      {
        name: 'Editar Cargos',
        slug: 'editar-cargos',
        hide_client: false,
      },
      {
        name: 'Deletar Cargos',
        slug: 'deletar-cargos',
        hide_client: false,
      },
    ])
  }
}
