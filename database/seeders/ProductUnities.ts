import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import ProductUnity from 'App/Models/ProductUnity'

export default class extends BaseSeeder {
  public async run () {
    // Write your database queries inside the run method
    await ProductUnity.create({
      name: 'Unidade',
      slug: 'unidade',
      abbreviation: 'UN',
      plural: 'Unidades',
    })
    await ProductUnity.create({
      name: 'Metro',
      slug: 'metro',
      abbreviation: 'MT',
      plural: 'Metros',
    })
    await ProductUnity.create({
      name: 'Peça',
      slug: 'peca',
      abbreviation: 'PC',
      plural: 'Peças',
    })
    await ProductUnity.create({
      name: 'Pacote',
      slug: 'pacote',
      abbreviation: 'PA',
      plural: 'Pacotes',
    })
    await ProductUnity.create({
      name: 'Rolo',
      slug: 'rolo',
      abbreviation: 'RO',
      plural: 'Rolos',
    })
    await ProductUnity.create({
      name: 'Jogo',
      slug: 'jogo',
      abbreviation: 'JO',
      plural: 'Jogos',
    })
    await ProductUnity.create({
      name: 'Quilograma',
      slug: 'quilograma',
      abbreviation: 'KG',
      plural: 'Quilogramas',
    })
    await ProductUnity.create({
      name: 'Metro quadrado',
      slug: 'metro-quadrado',
      abbreviation: 'M2',
      plural: 'Metros quadrados',
    })
    await ProductUnity.create({
      name: 'Caixa',
      slug: 'caixa',
      abbreviation: 'CA',
      plural: 'Caixas',
    })
  }
}
