import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'

export default class extends BaseSeeder {
  public async run () {
    // Write your database queries inside the run method
    await User.create({
      name: 'Administrador',
      slug: 'administrador',
      password: 'adm-1234',
      email: 'adm@baseserver.com.br'
    })
  }
}
