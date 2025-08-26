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
        hide_client: true
      },
      {
        name: 'Criar Departamentos',
        slug: 'criar-departamentos',
        hide_client: true,
      },
      {
        name: 'Editar Departamentos',
        slug: 'editar-departamentos',
        hide_client: true,
      },
      {
        name: 'Deletar Departamentos',
        slug: 'deletar-departamentos',
        hide_client: true,
      },
      // Perfis - Categorias de acesso que podem ser adicionadas a departamentos
      {
        name: 'Visualizar Cargos',
        slug: 'visualizar-cargos',
        hide_client: true,
      },
      {
        name: 'Criar Cargos',
        slug: 'criar-cargos',
        hide_client: true,
      },
      {
        name: 'Editar Cargos',
        slug: 'editar-cargos',
        hide_client: true,
      },
      {
        name: 'Deletar Cargos',
        slug: 'deletar-cargos',
        hide_client: true,
      },
      // Vendedores - Vendedores são usuários comuns, mas criados em uma tela específica nos moldes que o tipo do usuário precisa ter
      {
        name: 'Visualizar Vendedores',
        slug: 'visualizar-vendedores',
        hide_client: false,
      },
      {
        name: 'Criar Vendedores',
        slug: 'criar-vendedores',
        hide_client: false,
      },
      {
        name: 'Editar Vendedores',
        slug: 'editar-vendedores',
        hide_client: false,
      },
      {
        name: 'Deletar Vendedores',
        slug: 'deletar-vendedores',
        hide_client: false,
      },

      // Clientes
      {
        name: 'Visualizar Clientes',
        slug: 'visualizar-clientes',
        hide_client: false,
      },
      {
        name: 'Criar Clientes',
        slug: 'criar-clientes',
        hide_client: false,
      },
      {
        name: 'Editar Clientes',
        slug: 'editar-clientes',
        hide_client: false,
      },
      {
        name: 'Deletar Clientes',
        slug: 'deletar-clientes',
        hide_client: false,
      },

      // Fornecedores
      {
        name: 'Visualizar Fornecedores',
        slug: 'visualizar-fornecedores',
        hide_client: false,
      },
      {
        name: 'Criar Fornecedores',
        slug: 'criar-fornecedores',
        hide_client: false,
      },
      {
        name: 'Editar Fornecedores',
        slug: 'editar-fornecedores',
        hide_client: false,
      },
      {
        name: 'Deletar Fornecedores',
        slug: 'deletar-fornecedores',
        hide_client: false,
      },

      // // Transportadoras
      // {
      //   name: 'Visualizar Transportadoras',
      //   slug: 'visualizar-transportadoras',
      //   hide_client: false,
      // },
      // {
      //   name: 'Criar Transportadoras',
      //   slug: 'criar-transportadoras',
      //   hide_client: false,
      // },
      // {
      //   name: 'Editar Transportadoras',
      //   slug: 'editar-transportadoras',
      //   hide_client: false,
      // },
      // {
      //   name: 'Deletar Transportadoras',
      //   slug: 'deletar-transportadoras',
      //   hide_client: false,
      // },

      //Pedidos de Compra
      {
        name: 'Visualizar Pedidos de Compra',
        slug: 'visualizar-pedidos-de-compra',
        hide_client: false,
      },
      {
        name: 'Criar Pedidos de Compra',
        slug: 'criar-pedidos-de-compra',
        hide_client: false,
      },
      {
        name: 'Editar Pedidos de Compra',
        slug: 'editar-pedidos-de-compra',
        hide_client: false,
      },
      {
        name: 'Deletar Pedidos de Compra',
        slug: 'deletar-pedidos-de-compra',
        hide_client: false,
      },

      //Orçamentos
      {
        name: 'Visualizar Orçamentos',
        slug: 'visualizar-orcamentos',
        hide_client: false,
      },
      {
        name: 'Criar Orçamentos',
        slug: 'criar-orcamentos',
        hide_client: false,
      },
      {
        name: 'Editar Orçamentos',
        slug: 'editar-orcamentos',
        hide_client: false,
      },
      {
        name: 'Deletar Orçamentos',
        slug: 'deletar-orcamentos',
        hide_client: false,
      },

      //Vendas
      {
        name: 'Visualizar Vendas',
        slug: 'visualizar-vendas',
        hide_client: false,
      },
      {
        name: 'Criar Vendas',
        slug: 'criar-vendas',
        hide_client: false,
      },
      {
        name: 'Editar Vendas',
        slug: 'editar-vendas',
        hide_client: false,
      },
      {
        name: 'Deletar Vendas',
        slug: 'deletar-vendas',
        hide_client: false,
      },

      //Produtos
      {
        name: 'Visualizar Produtos',
        slug: 'visualizar-produtos',
        hide_client: false,
      },
      {
        name: 'Criar Produtos',
        slug: 'criar-produtos',
        hide_client: false,
      },
      {
        name: 'Editar Produtos',
        slug: 'editar-produtos',
        hide_client: false,
      },
      {
        name: 'Deletar Produtos',
        slug: 'deletar-produtos',
        hide_client: false,
      },

      //Estoques
      {
        name: 'Visualizar Estoques',
        slug: 'visualizar-estoques',
        hide_client: false,
      },
      {
        name: 'Criar Estoques',
        slug: 'criar-estoques',
        hide_client: false,
      },
      {
        name: 'Editar Estoques',
        slug: 'editar-estoques',
        hide_client: false,
      },
      {
        name: 'Deletar Estoques',
        slug: 'deletar-estoques',
        hide_client: false,
      },
      {
        name: 'Ajustar Estoques',
        slug: 'ajustar-estoques',
        hide_client: false,
      },

      // //Veículos
      // {
      //   name: 'Visualizar Veículos',
      //   slug: 'visualizar-veiculos',
      //   hide_client: false,
      // },
      // {
      //   name: 'Criar Veículos',
      //   slug: 'criar-veiculos',
      //   hide_client: false,
      // },
      // {
      //   name: 'Editar Veículos',
      //   slug: 'editar-veiculos',
      //   hide_client: false,
      // },
      // {
      //   name: 'Deletar Veículos',
      //   slug: 'deletar-veiculos',
      //   hide_client: false,
      // },

      //Unidades
      {
        name: 'Visualizar Unidades',
        slug: 'visualizar-unidades',
        hide_client: false,
      },
      {
        name: 'Criar Unidades',
        slug: 'criar-unidades',
        hide_client: false,
      },
      {
        name: 'Editar Unidades',
        slug: 'editar-unidades',
        hide_client: false,
      },
      {
        name: 'Deletar Unidades',
        slug: 'deletar-unidades',
        hide_client: false,
      },

      //Grupos
      {
        name: 'Visualizar Grupos',
        slug: 'visualizar-grupos',
        hide_client: false,
      },
      {
        name: 'Criar Grupos',
        slug: 'criar-grupos',
        hide_client: false,
      },
      {
        name: 'Editar Grupos',
        slug: 'editar-grupos',
        hide_client: false,
      },
      {
        name: 'Deletar Grupos',
        slug: 'deletar-grupos',
        hide_client: false,
      },

      //Categorias
      {
        name: 'Visualizar Categorias',
        slug: 'visualizar-categorias',
        hide_client: false,
      },
      {
        name: 'Criar Categorias',
        slug: 'criar-categorias',
        hide_client: false,
      },
      {
        name: 'Editar Categorias',
        slug: 'editar-categorias',
        hide_client: false,
      },
      {
        name: 'Deletar Categorias',
        slug: 'deletar-categorias',
        hide_client: false,
      },

      //Acréscimos (Pagamentos)
      {
        name: 'Visualizar Acréscimos',
        slug: 'visualizar-acrescimos',
        hide_client: false,
      },
      {
        name: 'Criar Acréscimos',
        slug: 'criar-acrescimos',
        hide_client: false,
      },
      {
        name: 'Editar Acréscimos',
        slug: 'editar-acrescimos',
        hide_client: false,
      },
      {
        name: 'Deletar Acréscimos',
        slug: 'deletar-acrescimos',
        hide_client: false,
      },
      //Remessas de pagamento (Pagamentos)
      {
        name: 'Visualizar Remessas de pagamento',
        slug: 'visualizar-remessas-de-pagamento',
        hide_client: false,
      },
      {
        name: 'Criar Remessas de pagamento',
        slug: 'criar-remessas-de-pagamento',
        hide_client: false,
      },
      {
        name: 'Editar Remessas de pagamento',
        slug: 'editar-remessas-de-pagamento',
        hide_client: false,
      },
      {
        name: 'Deletar Remessas de pagamento',
        slug: 'deletar-remessas-de-pagamento',
        hide_client: false,
      },
      //Pagamentos
      {
        name: 'Visualizar Pagamentos',
        slug: 'visualizar-pagamentos',
        hide_client: false,
      },
      {
        name: 'Criar Pagamentos',
        slug: 'criar-pagamentos',
        hide_client: false,
      },
      {
        name: 'Editar Pagamentos',
        slug: 'editar-pagamentos',
        hide_client: false,
      },
      {
        name: 'Deletar Pagamentos',
        slug: 'deletar-pagamentos',
        hide_client: false,
      },
      //Métodos de Pagamento
      {
        name: 'Visualizar Métodos de Pagamento',
        slug: 'visualizar-metodos-de-pagamento',
        hide_client: false,
      },
      {
        name: 'Criar Métodos de Pagamento',
        slug: 'criar-metodos-de-pagamento',
        hide_client: false,
      },
      {
        name: 'Editar Métodos de Pagamento',
        slug: 'editar-metodos-de-pagamento',
        hide_client: false,
      },
      {
        name: 'Deletar Métodos de Pagamento',
        slug: 'deletar-metodos-de-pagamento',
        hide_client: false,
      },
      //Armazenamentos
      {
        name: 'Visualizar Armazenamentos',
        slug: 'visualizar-armazenamentos',
        hide_client: false,
      },
      {
        name: 'Criar Armazenamentos',
        slug: 'criar-armazenamentos',
        hide_client: false,
      },
      {
        name: 'Editar Armazenamentos',
        slug: 'editar-armazenamentos',
        hide_client: false,
      },
      {
        name: 'Deletar Armazenamentos',
        slug: 'deletar-armazenamentos',
        hide_client: false,
      },

      //Remessas de cobrança (Pagamentos)
      {
        name: 'Visualizar Remessas de cobrança',
        slug: 'visualizar-remessas-de-cobranca',
        hide_client: false,
      },
      {
        name: 'Criar Remessas de cobrança',
        slug: 'criar-remessas-de-cobranca',
        hide_client: false,
      },
      {
        name: 'Editar Remessas de cobrança',
        slug: 'editar-remessas-de-cobranca',
        hide_client: false,
      },
      {
        name: 'Deletar Remessas de cobrança',
        slug: 'deletar-remessas-de-cobranca',
        hide_client: false,
      },
      //Cobranças
      {
        name: 'Visualizar Cobranças',
        slug: 'visualizar-cobrancas',
        hide_client: false,
      },
      {
        name: 'Criar Cobranças',
        slug: 'criar-cobrancas',
        hide_client: false,
      },
      {
        name: 'Editar Cobranças',
        slug: 'editar-cobrancas',
        hide_client: false,
      },
      {
        name: 'Deletar Cobranças',
        slug: 'deletar-cobrancas',
        hide_client: false,
      },
      //Técnicos
      {
        name: 'Visualizar Técnicos',
        slug: 'visualizar-tecnicos',
        hide_client: false,
      },
      {
        name: 'Criar Técnicos',
        slug: 'criar-tecnicos',
        hide_client: false,
      },
      {
        name: 'Editar Técnicos',
        slug: 'editar-tecnicos',
        hide_client: false,
      },
      {
        name: 'Deletar Técnicos',
        slug: 'deletar-tecnicos',
        hide_client: false,
      },
      //Serviços
      {
        name: 'Visualizar Serviços',
        slug: 'visualizar-servicos',
        hide_client: false,
      },
      {
        name: 'Criar Serviços',
        slug: 'criar-servicos',
        hide_client: false,
      },
      {
        name: 'Editar Serviços',
        slug: 'editar-servicos',
        hide_client: false,
      },
      {
        name: 'Deletar Serviços',
        slug: 'deletar-servicos',
        hide_client: false,
      },
    ])
  }
}
