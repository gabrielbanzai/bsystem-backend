import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import PaymentMethod from 'App/Models/PaymentMethod'

export default class extends BaseSeeder {
  public async run () {
    // Write your database queries inside the run method
    await PaymentMethod.createMany([
      {
        name: 'Boleto',
        slug: 'boleto'
      },
      {
        name: 'Cartão de crédito',
        slug: 'cartao-de-credito'
      },
      {
        name: 'Cartão de débito',
        slug: 'cartao-de-debito'
      },
      {
        name: 'Depósito bancário',
        slug: 'deposito-bancario'
      },
      {
        name: 'Dinheiro',
        slug: 'dinheiro'
      },
      {
        name: 'Pix',
        slug: 'pix'
      },
      {
        name: 'Transferência Bancária',
        slug: 'transferencia-bancaria'
      },
    ])
  }
}
