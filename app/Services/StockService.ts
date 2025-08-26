import Product from "App/Models/Product"
import SaleItem from "App/Models/SaleItem"
import SaleOrderItem from "App/Models/SaleOrderItem"
import ServiceProduct from "App/Models/ServiceProduct"
import Stock from "App/Models/Stock"
import StockTransaction from "App/Models/StockTransaction"

class StockService {
  //Efetua as transações no Estoque ao confirmar um pedido de compra
  public async transact_purchase_order(purchase_order, storage_id, user_id, trx){
    await Promise.all(
      purchase_order.items.map(async item => {

        let stock = item.product?.stocks.find(x => x.storage_id = storage_id)

        let transaction = await StockTransaction.create({
            quantity: item.quantity*item.product.conversion_factor,
            balance: 0,
            user_id: user_id,
            type: 'in',
            reason: `Pedido de compra ${purchase_order.id} Confirmado`,
            product_id: item.product_id,
            stock_id: stock?.id,
            purchase_order_id: purchase_order.id,
        }, trx)

        if(transaction){

            if(stock){

                let stock_final = (stock.quantity+transaction.quantity) - stock.quantity_reserved

                stock.merge({
                    quantity: stock_final
                })

                transaction.merge({
                    balance: stock_final
                })

                await stock.save()
                await transaction.save()

            }
            
        }
      })
    )
  }

  //Efetua as transações na reserva do estoque ao criar um orçamento
  public async transact_place_stock_reserve(sale_order, item, user_id, trx){
    let stock = await Stock.query(trx).where('product_id', item.product_id).firstOrFail()

    stock.merge({
        quantity_reserved: stock.quantity_reserved+item.quantity
    })

    await stock.save()

    let stockLeft = (item.product?.stocks[0]?.quantity - item.product?.stocks[0]?.quantity_reserved - item.quantity)

    await StockTransaction.create({
        quantity: item.quantity,
        balance: stockLeft,
        user_id: user_id,
        type: 'reserve',
        reason: `Orçamento ${sale_order.id} Gerado`,
        product_id: item.product_id,
        stock_id: item.product?.stocks[0].id,
        sale_order_id: sale_order.id,
    }, trx)
  }
  
  //Efetua as transações de ajuste na reserva de estoque ao se alterar os itens de um orçamento
  public async transact_adjust_stock_reserve(sale_order, items, user_id, trx){
    // 🔹 Carrega os itens atuais da venda
    await sale_order.load('items');
    const oldItems = sale_order.items;

    // 🔹 Criar um mapa dos itens antigos para fácil acesso
    //const oldItemsMap = new Map(oldItems.map(item => [item.product_id, item]));

    // 🔹 Ajustar a reserva no estoque
    for (const oldItem of oldItems) {
        const stock = await Stock.query(trx).where('product_id', oldItem.product_id).firstOrFail();
        stock.merge({ quantity_reserved: stock.quantity_reserved - oldItem.quantity });
        await stock.save();
    }

    // 🔹 Apaga os itens antigos
    await sale_order.related('items').query().delete();

    let items_total = 0;

    // 🔹 Criar os novos itens e ajustar o estoque
    for (const item of items) {
      let product = await Product.findOrFail(item.product_id);

      await SaleOrderItem.create({
          sale_order_id: sale_order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          discount_price: item.discount_price,
          unit_price: product.sale_price,
          total: item.quantity * product.sale_price - item.discount_price,
      }, trx);

      items_total += product.sale_price * item.quantity;
        
      // 🔹 Atualizar o estoque com a nova quantidade reservada
      const stock = await Stock.query(trx).where('product_id', item.product_id).whereHas('storage', builder => builder.where('principal_storage', 1)).firstOrFail();
      let stockReserve = stock.quantity_reserved + item.quantity
      stock.merge({ quantity_reserved: stockReserve });
      await stock.save();

      // let stockTransactionReserve = await StockTransaction.query().where('sale_order_id', sale_order.id).where('product_id', item.product_id).first()

      await StockTransaction.create({
        quantity: item.quantity,
        balance: stock.quantity - stockReserve,
        user_id: user_id,
        type: 'reserve-adjust',
        reason: `Orçamento ${sale_order.id} Alterado`,
        product_id: item.product_id,
        stock_id: item.product?.stocks[0].id,
        sale_order_id: sale_order.id,
      }, trx)
      
    }

    sale_order.merge({
      items_total,
      total: items_total
    });

    await sale_order.save();
  }

  //Efetua as transações na reserva do estoque ao criar uma venda
  public async transact_place_stock_reserve_sale(sale, item, user_id, trx){
    let stock = await Stock.query(trx).where('product_id', item.product_id).firstOrFail()

    stock.merge({
        quantity_reserved: stock.quantity_reserved+item.quantity
    })

    await stock.save()

    let stockLeft = (item.product?.stocks[0]?.quantity - item.product?.stocks[0]?.quantity_reserved - item.quantity)

    await StockTransaction.create({
        quantity: item.quantity,
        balance: stockLeft,
        user_id: user_id,
        type: 'reserve',
        reason: `Venda ${sale.id} Gerada`,
        product_id: item.product_id,
        stock_id: item.product?.stocks[0]?.id,
        sale_id: sale.id,
    }, trx)
  }

  //Efetua as transações de ajuste na reserva de estoque ao se alterar os itens de uma venda
  public async transact_adjust_stock_reserve_sale(sale, items, user_id, discount_price, shipping_total, trx){
    // 🔹 Carrega os itens atuais da venda
    await sale.load('items');
    const oldItems = sale.items;

    // 🔹 Criar um mapa dos itens antigos para fácil acesso
    //const oldItemsMap = new Map(oldItems.map(item => [item.product_id, item]));

    // 🔹 Ajustar a reserva no estoque
    for (const oldItem of oldItems) {
        const stock = await Stock.query(trx).where('product_id', oldItem.product_id).firstOrFail();
        stock.merge({ quantity_reserved: stock.quantity_reserved - oldItem.quantity });
        await stock.save();
    }

    // 🔹 Apaga os itens antigos
    await sale.related('items').query().delete();

    let items_total = 0;

    // 🔹 Criar os novos itens e ajustar o estoque
    for (const item of items) {
      let product = await Product.findOrFail(item.product_id);

      await SaleItem.create({
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: item.quantity,
          discount_price: item.discount_price,
          unit_price: product.sale_price,
          total: item.quantity * product.sale_price - item.discount_price,
      }, trx);

      let item_total = product.sale_price * item.quantity;

      items_total += item_total
        
      // 🔹 Atualizar o estoque com a nova quantidade reservada
      const stock = await Stock.query(trx).where('product_id', item.product_id).firstOrFail();
      let stockReserve = stock.quantity_reserved + item.quantity
      stock.merge({ quantity_reserved: stockReserve });
      await stock.save();

      await StockTransaction.create({
          quantity: item.quantity,
          balance: stock.quantity - stockReserve,
          user_id: user_id,
          type: 'reserve-adjust',
          reason: `Venda ${sale.id} Alterada`,
          product_id: item.product_id,
          stock_id: item.product?.stocks[0].id,
          sale_id: sale.id,
      }, trx)
    }

    sale.merge({
      items_total,
      discount_price,
      total: (items_total + shipping_total) - discount_price,
    });

    await sale.save();
  }

  //Efetua o cancelamento de uma reserva para volta do estoque normal, usado ao concretizar uma venda
  public async transact_cancel_stock_reserve(sale, user_id, trx){
    for (const item of sale.items) {
      const stock = await Stock.findOrFail(item.product?.stocks[0].id);

      let stockQuantity = (stock.quantity - item.quantity - (stock.quantity_reserved - item.quantity))

      // 🔹 Zera a reserva da quantidade do item
      await StockTransaction.create({
        quantity: item.quantity,
        balance: stock.quantity,
        user_id: user_id,
        type: 'reserve-cancel',
        reason: `Venda ${sale.id} Confirmada`,
        product_id: item.product_id,
        stock_id: stock.id,
        sale_id: sale.id,
      }, trx);

      // 🔹 Cria a transação de saída do estoque
      await StockTransaction.create({
          quantity: item.quantity,
          balance: stockQuantity,
          user_id: user_id,
          type: 'out',
          reason: `Venda ${sale.id} Concluída`,
          product_id: item.product_id,
          stock_id: stock.id,
          sale_id: sale.id,
      }, trx);

      // 🔹 Atualiza o estoque: reduz a quantidade e remove da reserva
      stock.merge({
          quantity: stockQuantity,
          quantity_reserved: stock.quantity_reserved - item.quantity, // Removendo da reserva
      });

      await stock.save();
  }
  }

  //Efetua as transações na reserva do estoque ao criar um seviço
  public async transact_place_stock_reserve_service(service, item, user_id, trx){
    let stock = await Stock.query(trx).where('product_id', item.product_id).firstOrFail()

    stock.merge({
        quantity_reserved: stock.quantity_reserved+item.quantity
    })

    await stock.save()

    let stockLeft = (item.product?.stocks[0]?.quantity - item.product?.stocks[0]?.quantity_reserved - item.quantity)

    await StockTransaction.create({
        quantity: item.quantity,
        balance: stockLeft,
        user_id: user_id,
        type: 'reserve',
        reason: `Serviço ${service.id} Gerado`,
        product_id: item.product_id,
        stock_id: item.product?.stocks[0]?.id,
        service_id: service.id,
    }, trx)
  }

  //Efetua as transações de ajuste na reserva de estoque ao se alterar os itens de um serviço
  public async transact_adjust_stock_reserve_service(service, items, user_id, discount_price, trx){
    // 🔹 Carrega os itens atuais da venda
    await service.load('products');
    const oldItems = service.products;

    // 🔹 Criar um mapa dos itens antigos para fácil acesso
    //const oldItemsMap = new Map(oldItems.map(item => [item.product_id, item]));

    // 🔹 Ajustar a reserva no estoque
    for (const oldItem of oldItems) {
        const stock = await Stock.query(trx).where('product_id', oldItem.product_id).firstOrFail();
        stock.merge({ quantity_reserved: stock.quantity_reserved - oldItem.quantity });
        await stock.save();
    }

    // 🔹 Apaga os itens antigos
    await service.related('products').query().delete();

    let items_total = 0;

    // 🔹 Criar os novos itens e ajustar o estoque
    for (const item of items) {
      let product = await Product.findOrFail(item.product_id);

      await ServiceProduct.create({
          service_id: service.id,
          product_id: item.product_id,
          quantity: item.quantity,
          discount_price: item.discount_price,
          unit_price: product.sale_price,
          total: item.quantity * product.sale_price - item.discount_price,
      }, trx);

      let item_total = product.sale_price * item.quantity;

      items_total += item_total
        
      // 🔹 Atualizar o estoque com a nova quantidade reservada
      const stock = await Stock.query(trx).where('product_id', item.product_id).firstOrFail();
      let stockReserve = stock.quantity_reserved + item.quantity
      stock.merge({ quantity_reserved: stockReserve });
      await stock.save();

      await StockTransaction.create({
          quantity: item.quantity,
          balance: stock.quantity - stockReserve,
          user_id: user_id,
          type: 'reserve-adjust',
          reason: `Serviço ${service.id} Alterado`,
          product_id: item.product_id,
          stock_id: item.product?.stocks[0].id,
          sale_id: service.id,
      }, trx)
    }

    service.merge({
      items_total,
      discount_price,
      total: (items_total) - discount_price,
    });

    await service.save();

    return items_total
  }

  //Efetua o cancelamento de uma reserva para volta do estoque normal, usado ao concretizar um serviço
  public async transact_cancel_stock_reserve_service(service, user_id, trx){
    for (const item of service.products) {
      const stock = await Stock.findOrFail(item.product?.stocks[0].id);

      let stockQuantity = (stock.quantity - item.quantity - (stock.quantity_reserved - item.quantity))

      // 🔹 Zera a reserva da quantidade do item
      await StockTransaction.create({
        quantity: item.quantity,
        balance: stock.quantity,
        user_id: user_id,
        type: 'reserve-cancel',
        reason: `Serviço ${service.id} Confirmado`,
        product_id: item.product_id,
        stock_id: stock.id,
        service_id: service.id,
      }, trx);

      // 🔹 Cria a transação de saída do estoque
      await StockTransaction.create({
          quantity: item.quantity,
          balance: stockQuantity,
          user_id: user_id,
          type: 'out',
          reason: `Serviço ${service.id} Concluído`,
          product_id: item.product_id,
          stock_id: stock.id,
          service_id: service.id,
      }, trx);

      // 🔹 Atualiza o estoque: reduz a quantidade e remove da reserva
      stock.merge({
          quantity: stockQuantity,
          quantity_reserved: stock.quantity_reserved - item.quantity, // Removendo da reserva
      });

      await stock.save();
    }
  }

  /**
   * Ajusta a quantidade de estoque de um produto
   * Cria uma transação de ajuste e atualiza o estoque
   * @param stock - Instância do estoque a ser ajustado
   * @param newQuantity - Nova quantidade do estoque
   * @param reason - Motivo do ajuste
   * @param userId - ID do usuário que está fazendo o ajuste
   * @param trx - Transação do banco de dados
   * @returns Stock - Estoque atualizado
   */
  public async adjustStock(stock: Stock, newQuantity: number, reason: string, userId: number, trx: any) {
    try {
      const oldQuantity = stock.quantity
      const difference = newQuantity - oldQuantity
      
      // Calcular o novo saldo disponível (quantidade - reservas)
      const newBalance = newQuantity - stock.quantity_reserved
      
      // Criar a transação de ajuste
      await StockTransaction.create({
        quantity: Math.abs(difference),
        balance: newBalance,
        user_id: userId,
        type: 'adjust',
        reason: reason,
        product_id: stock.product_id,
        stock_id: stock.id
      }, trx)
      
      // Atualizar o estoque com a nova quantidade
      stock.merge({
        quantity: newQuantity
      })
      
      await stock.save()
      
      // Log da operação
      console.log(`Estoque ajustado: Produto ${stock.product_id}, de ${oldQuantity} para ${newQuantity} (${difference >= 0 ? '+' : ''}${difference})`)
      
      return stock
      
    } catch (error) {
      console.error('Erro no ajuste de estoque:', error)
      throw new Error('Falha ao processar ajuste de estoque')
    }
  }

  /**
   * Transfere quantidade de estoque entre dois armazéns
   * Cria duas transações: uma de saída no estoque origem e uma de entrada no estoque destino
   * @param sourceStock - Estoque de origem
   * @param targetStorageId - ID do armazém de destino
   * @param quantity - Quantidade a ser transferida
   * @param reason - Motivo da transferência
   * @param userId - ID do usuário que está fazendo a transferência
   * @param trx - Transação do banco de dados
   * @returns {sourceStock, targetStock} - Estoques atualizados
   */
  public async transferStock(sourceStock: Stock, targetStorageId: number, quantity: number, reason: string, userId: number, trx: any) {
    try {
      // Verificar se há quantidade suficiente disponível (não reservada)
      const availableQuantity = sourceStock.quantity - sourceStock.quantity_reserved
      if (quantity > availableQuantity) {
        throw new Error(`Quantidade insuficiente disponível. Disponível: ${availableQuantity}, Solicitado: ${quantity}`)
      }

      // Buscar ou criar o estoque de destino
      let targetStock = await Stock.query(trx)
        .where('product_id', sourceStock.product_id)
        .where('storage_id', targetStorageId)
        .first()

      if (!targetStock) {
        // Criar novo estoque no armazém de destino
        targetStock = await Stock.create({
          product_id: sourceStock.product_id,
          storage_id: targetStorageId,
          quantity: 0,
          quantity_reserved: 0
        }, trx)
      }

      // Calcular novos saldos
      const newSourceQuantity = sourceStock.quantity - quantity
      const newTargetQuantity = targetStock.quantity + quantity
      const newSourceBalance = newSourceQuantity - sourceStock.quantity_reserved
      const newTargetBalance = newTargetQuantity - targetStock.quantity_reserved

      // Criar transação de saída no estoque origem
      await StockTransaction.create({
        quantity: quantity,
        balance: newSourceBalance,
        user_id: userId,
        type: 'transfer',
        reason: `${reason} - Saída para armazém ${targetStorageId}`,
        product_id: sourceStock.product_id,
        stock_id: sourceStock.id
      }, trx)

      // Criar transação de entrada no estoque destino
      await StockTransaction.create({
        quantity: quantity,
        balance: newTargetBalance,
        user_id: userId,
        type: 'transfer',
        reason: `${reason} - Entrada do armazém ${sourceStock.storage_id}`,
        product_id: targetStock.product_id,
        stock_id: targetStock.id
      }, trx)

      // Atualizar as quantidades dos estoques
      sourceStock.merge({ quantity: newSourceQuantity })
      targetStock.merge({ quantity: newTargetQuantity })

      await sourceStock.save()
      await targetStock.save()

      // Log da operação
      console.log(`Transferência realizada: Produto ${sourceStock.product_id}, ${quantity} unidades do armazém ${sourceStock.storage_id} para ${targetStorageId}`)

      return { sourceStock, targetStock }

    } catch (error) {
      console.error('Erro na transferência de estoque:', error)
      throw new Error('Falha ao processar transferência de estoque: ' + error.message)
    }
  }
}
export default StockService
