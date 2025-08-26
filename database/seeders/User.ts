import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'

export default class extends BaseSeeder {
  public async run () {
    // Write your database queries inside the run method
    await User.create({
      name: 'Administrador',
      slug: 'administrador',
      password: 'Omg@1234Info',
      email: 'suporte@omegainformaticapa.com.br'
    })
    await User.create({
      name: 'Usuário Teste',
      slug: 'usuario-teste',
      password: '123456',
      email: 'teste@easycom.com'
    })
  }
}
