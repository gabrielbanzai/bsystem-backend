/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Redis from '@ioc:Adonis/Addons/Redis';
import Route from '@ioc:Adonis/Core/Route'
import NotificationService from 'App/Services/NotificationService';
import { format } from 'date-fns';

Route.get('/notifications', async (ctx) => {
  const wsServ: NotificationService = new NotificationService()
  const { user_id } = ctx.request.all()
  if(ctx.auth && ctx.auth.user){
    let nots = await wsServ.getNotifications(user_id ? user_id : ctx.auth.user.id.toString())
    return ctx.response.send(nots)
  }
}).middleware(['auth'])

Route.post('/notify', async (ctx) => {
  //await Redis.del(`notifications:1`)
  const { message } = ctx.request.all()
  if(ctx.auth && ctx.auth.user){
    const wsServ: NotificationService = new NotificationService()

    let data = {"type":"teste","data":{"message":message}, "read": "false", "created_at": format(new Date(), 'yyyy-MM-dd HH:mm:ss')}

    await wsServ.storeNotification(ctx.auth.user.id.toString(), data)
  }
  //await Redis.del(`notifications:1`)
}).middleware(['auth'])

Route.post('/notify-read', async (ctx) => {

  if(ctx.auth && ctx.auth.user){
    const { notification_id } = ctx.request.all()
    const channel = `notifications:${ctx.auth.user.id}`

    let user_notifications = await Redis.lrange(channel, 0, -1)
    let user_notificationsArr: any[] = user_notifications.map(n => {
      return JSON.parse(n)
    })
    if(user_notifications && user_notifications.length > 0){
      user_notificationsArr = user_notificationsArr.filter(x => x.id != notification_id)
    }

    await Redis.del(channel)
    await Promise.all(
      user_notificationsArr.map(
        async not => {
          await Redis.rpush(channel, JSON.stringify(not));
        }
      )
    )
    await Redis.publish(channel, JSON.stringify(user_notificationsArr));
  }
  //await Redis.del(`notifications:1`)
}).middleware(['auth'])

Route.delete('/notifications', async (ctx) => {
  if(ctx.auth && ctx.auth.user){
    const channel = `notifications:${ctx.auth.user.id}`

    await Redis.del(channel)

    await Redis.publish(channel, JSON.stringify([]));
  }
}).middleware(['auth'])

Route.group(() => {
  Route.post('/login', 'AuthController.login')
  Route.post('/logout', 'AuthController.logout')//.middleware(['auth'])
  Route.post('/request-password', 'AuthController.requestPassword')
  Route.post('/request-password/validate', 'AuthController.validateRequestPassword')
  Route.post('/request-password/change', 'AuthController.changePassword')
}).prefix('/auth')

Route.group(() => {

  Route.post('/upload-csv', 'Admin/CommonController.storeBatch')

  Route.get('/dashboard', 'Admin/DashboardController.index')

   //Configurações
   Route.resource('/configurations', 'Admin/ConfigurationsController')

  //Usuários
  Route.put('/users/:id/update-status', 'Admin/UsersController.updateStatus')
  Route.put('/profile/:id', 'Admin/UsersController.updateProfile')
  Route.resource('/users', 'Admin/UsersController')
  
  //Cargos
  Route.resource('/positions', 'Admin/PositionsController')

  //Departamentos
  Route.resource('/departments', 'Admin/DepartmentsController')

  //Permissões
  Route.resource('/permissions', 'Admin/PermissionsController')

  //Clientes
  Route.put('/clients/:id/update-status', 'Admin/ClientsController.updateStatus')
  Route.post('/clients/upload-csv', 'Admin/ClientsController.storeBatch')
  Route.resource('/clients', 'Admin/ClientsController')

  //Fornecedores
  Route.put('/suppliers/:id/update-status', 'Admin/SuppliersController.updateStatus')
  Route.post('/suppliers/upload-csv', 'Admin/SuppliersController.storeBatch')
  Route.resource('/suppliers', 'Admin/SuppliersController')

  //Transportadoras
  Route.put('/shipping-companies/:id/update-status', 'Admin/ShippingCompaniesController.updateStatus')
  Route.post('/shipping-companies/upload-csv', 'Admin/ShippingCompaniesController.storeBatch')
  Route.resource('/shipping-companies', 'Admin/ShippingCompaniesController')

  //Veículos
  Route.resource('/vehicles', 'Admin/VehiclesController')

  //Unidades de produtos
  Route.resource('/product-unities', 'Admin/ProductUnitiesController')

  //Grupos de produtos
  Route.resource('/product-groups', 'Admin/ProductGroupsController')

  //Categorias de produtos
  Route.resource('/product-categories', 'Admin/ProductCategoriesController')

  //Produtos
  Route.resource('/products', 'Admin/ProductsController')
  Route.post('/products/:id/upload-image', 'Admin/ProductsController.uploadImage')
  Route.put('/products/:id/update-cost', 'Admin/ProductsController.updateCost')
  Route.get('/products/:searchString/search', 'Admin/ProductsController.search')
  Route.get('/products/:supplier_id/search-by-supplier', 'Admin/ProductsController.searchBySupplier')
  Route.post('/products/upload-csv', 'Admin/ProductsController.storeBatch')
  Route.get('/products-report', 'Admin/ProductsController.report')

  //Estoque
  Route.get('/stocks/search', 'Admin/StocksController.search') // Nova rota para autocomplete
  Route.get('/stocks/search-products', 'Admin/StocksController.searchProducts') // Rota para busca específica de produtos (ficha de estoque)
  Route.get('/stocks', 'Admin/StocksController.index') // Listagem geral de estoques (lista de estoques)
  Route.patch('/stocks/:id/adjust', 'Admin/StocksController.adjust') // Ajustar estoque
  Route.patch('/stocks/:id/transfer', 'Admin/StocksController.transfer') // Transferir estoque

  //Armazenamentos
  Route.get('/storages', 'Admin/StoragesController.index')

  //Pedidos de Compra
  Route.get('/purchase-orders/:id/emit', 'Admin/PurchaseOrdersController.emitPDF')
  Route.post('/purchase-orders/:id/confirm', 'Admin/PurchaseOrdersController.confirm')
  Route.resource('/purchase-orders', 'Admin/PurchaseOrdersController')

  //Orçamentos
  Route.post('/sale-orders/:id/confirm', 'Admin/SaleOrdersController.confirm')
  Route.resource('/sale-orders', 'Admin/SaleOrdersController')

  //Vendas
  Route.get('/sales/:id/emit', 'Admin/SalesController.emitPDF')
  Route.post('/sales/:id/confirm', 'Admin/SalesController.confirm')
  Route.resource('/sales', 'Admin/SalesController')
  
  Route.post('/upload/single', 'FilesController.singleUpload')
  Route.post('/upload/multiple', 'FilesController.multipleUpload')

  //Métodos de pagamento
  Route.resource('/payment-methods', 'Admin/PaymentMethodsController')

  //Faturas de pagamentos
  Route.get('/ap-invoices/:id/done', 'Admin/ApInvoicesController.done')
  Route.resource('/ap-invoices', 'Admin/ApInvoicesController')

  //Pagamentos
  Route.get('/ap-payments/:id/done', 'Admin/ApPaymentsController.done')
  Route.resource('/ap-payments', 'Admin/ApPaymentsController')

  //Acréscimos de Pagamentos
  Route.resource('/ap-charges', 'Admin/ApChargesController')

  //Faturas de cobranças
  Route.get('/ar-invoices/:id/done', 'Admin/ArInvoicesController.done')
  Route.resource('/ar-invoices', 'Admin/ArInvoicesController')

  //Cobranças
  Route.get('/ar-receipts/:id/done', 'Admin/ArReceiptsController.done')
  Route.resource('/ar-receipts', 'Admin/ArReceiptsController')

  //Acréscimos de Cobranças
  Route.resource('/ar-charges', 'Admin/ArChargesController')

  //Serviços
  Route.post('/services/:id/confirm', 'Admin/ServicesController.confirm')
  Route.resource('/services', 'Admin/ServicesController')
  
  //Tipos de Serviços
  Route.resource('/service-types', 'Admin/ServiceTypesController')

}).prefix('/admin').middleware(['auth'])

Route.group(() => {}).prefix('/client').middleware(['auth'])
