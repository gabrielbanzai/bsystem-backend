import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Stock from 'App/Models/Stock'
import StockService from 'App/Services/StockService'
import { list_filters, generate_filters_to_send, transform_pagination } from 'App/Helpers'
import Database from '@ioc:Adonis/Lucid/Database'

export default class StocksController {

    /**
     * Lista todos os estoques com paginação
     * Parâmetros:
     * - page: número da página (opcional, padrão: 1)
     * - limit: itens por página (opcional, padrão: 50)
     * - storage_id: ID do armazém (opcional, usa principal se não informado)
     * - product_search: termo de busca (opcional)
     */
    async index(ctx: HttpContextContract) {
        try {
            const { request, response } = ctx
            const requestFilters = request.all()
            
            let stocks: any = Stock.query()
            
            // Filtro de storage
            stocks.whereHas('storage', builder => {
                if(requestFilters.storage_id){
                    builder.where('id', parseInt(requestFilters.storage_id))
                } else {
                    builder.where('principal_storage', 1)
                }
            })
            
            // Preload dos relacionamentos necessários
            stocks.preload('product')
            stocks.preload('storage')
            
            // Usar listFiltersPaginate para paginação e filtros
            stocks = await Stock.listFiltersPaginate(ctx, stocks)
            stocks = transform_pagination(stocks.toJSON())
            const filters = await generate_filters_to_send(Stock)
            
            return response.status(200).send({...stocks, filters})
            
        } catch (error) {
            throw error
        }
    }

    /**
     * Busca estoque por produto usando filtros genéricos
     * Suporta busca inteligente em name, description, barcode, reference
     * Parâmetros: 
     * - product_search: termo de busca (obrigatório)
     * - storage_id: ID do armazém (opcional, usa principal se não informado)
     */
    async searchProducts(ctx: HttpContextContract) {
        try {
            const { request, response } = ctx
            const requestFilters = request.all()
            
            // Se não há termo de busca, retorna erro
            if (!requestFilters.product_search) {
                return response.status(400).send({
                    error: 'Parâmetro product_search é obrigatório'
                })
            }

            let query = Stock.query()
            
            // Aplicar filtros genéricos do modelo
            query = list_filters(Stock.filters, query, requestFilters)
            
            // Filtro de storage com lógica específica
            query.whereHas('storage', builder => {
                if(requestFilters.storage_id){
                    builder.where('id', parseInt(requestFilters.storage_id))
                } else {
                    builder.where('principal_storage', 1)
                }
            })
            
            // Preload dos relacionamentos necessários
            query.preload('product')
            query.preload('storage')
            query.preload('transactions', builder => {
                builder.preload('purchase_order')
                       .preload('sale')
                       .preload('sale_order')
                       .preload('user', userBuilder => 
                           userBuilder.select('id', 'name', 'slug', 'avatar')
                       )
                       .orderBy('id', 'desc')
            })
            
            const stocks = await query.first()
            
            return response.status(200).send({
                data: stocks || null
            })
            
        } catch (error) {
            throw error
        }
    }

    /**
     * Busca produtos para autocomplete
     * Retorna lista de produtos que combinam com o termo de busca
     */
    async search(ctx: HttpContextContract) {
        try {
            const { request, response } = ctx
            const { term, storage_id, limit = 10 } = request.all()
            
            if (!term || term.trim().length < 2) {
                return response.status(200).send({ data: [] })
            }
            
            let query = Stock.query()
            
            // Usar o filtro genérico para busca
            const searchFilters = { product_search: term.trim() }
            query = list_filters(Stock.filters, query, searchFilters)
            
            // Filtro de storage
            query.whereHas('storage', builder => {
                if(storage_id){
                    builder.where('id', parseInt(storage_id))
                } else {
                    builder.where('principal_storage', 1)
                }
            })
            
            query.preload('product')
            query.limit(parseInt(limit))
            
            const stocks = await query
            
            // Formatear resposta para autocomplete
            const suggestions = stocks.map(stock => ({
                id: stock.id,
                reference: stock.product.reference,
                barcode: stock.product.barcode,
                name: stock.product.name,
                description: stock.product.description,
                display: `${stock.product.reference || stock.product.barcode} - ${stock.product.name}`,
                quantity: stock.quantity,
                quantity_reserved: stock.quantity_reserved,
                available: stock.quantity - stock.quantity_reserved
            }))
            
            return response.status(200).send({ 
                data: suggestions 
            })
            
        } catch (error) {
            throw error
        }
    }

    /**
     * Ajusta a quantidade de estoque de um produto
     * Requer permissão 'ajustar-estoques'
     * Parâmetros:
     * - quantity: nova quantidade do estoque
     * - reason: motivo do ajuste
     */
    async adjust(ctx: HttpContextContract) {
        const { request, response, auth, params } = ctx
        const trx = await Database.beginGlobalTransaction()
        
        try {
            const stockId = parseInt(params.id)
            const { quantity, reason } = request.all()
            
            // Validações básicas
            if (!stockId || isNaN(stockId)) {
                return response.status(400).send({
                    error: 'ID do estoque inválido'
                })
            }
            
            if (quantity === undefined || quantity === null || quantity < 0) {
                return response.status(400).send({
                    error: 'Quantidade deve ser um número maior ou igual a zero'
                })
            }
            
            if (!reason || reason.trim() === '') {
                return response.status(400).send({
                    error: 'Motivo do ajuste é obrigatório'
                })
            }
            
            // Buscar o estoque com suas relações
            const stock = await Stock.query({ client: trx })
                .where('id', stockId)
                .preload('product')
                .preload('storage')
                .first()
            
            if (!stock) {
                return response.status(404).send({
                    error: 'Estoque não encontrado'
                })
            }
            
            // Verificar se a nova quantidade é diferente da atual
            if (quantity === stock.quantity) {
                return response.status(400).send({
                    error: 'A quantidade informada é igual à quantidade atual do estoque'
                })
            }
            
            // Verificar se há reservas que impedem o ajuste para baixo
            if (quantity < stock.quantity_reserved) {
                return response.status(400).send({
                    error: `Não é possível ajustar para ${quantity} unidades. Existem ${stock.quantity_reserved} unidades reservadas.`
                })
            }
            
            // Usar o serviço de estoque para fazer o ajuste
            const stockService = new StockService()
            const adjustedStock = await stockService.adjustStock(
                stock,
                quantity,
                reason.trim(),
                auth.user!.id,
                trx
            )
            
            // Recarregar o estoque com transações atualizadas
            await adjustedStock.load('transactions', builder => {
                builder.preload('purchase_order')
                       .preload('sale')
                       .preload('sale_order')
                       .preload('user', userBuilder => 
                           userBuilder.select('id', 'name', 'slug', 'avatar')
                       )
                       .orderBy('id', 'desc')
            })
            
            await trx.commit()
            
            return response.status(200).send({
                data: adjustedStock,
                message: 'Estoque ajustado com sucesso'
            })
            
        } catch (error) {
            throw error
        }
    }

    /**
     * Transfere quantidade de estoque entre armazéns
     * Requer permissão 'transferir-estoques'
     * Parâmetros:
     * - target_storage_id: ID do armazém de destino
     * - quantity: quantidade a ser transferida
     * - reason: motivo da transferência
     */
    async transfer(ctx: HttpContextContract) {
        const { request, response, auth, params } = ctx
        const trx = await Database.beginGlobalTransaction()
        
        try {
            const stockId = parseInt(params.id)
            const { target_storage_id, quantity, reason } = request.all()
            
            // Validações básicas
            if (!stockId || isNaN(stockId)) {
                return response.status(400).send({
                    error: 'ID do estoque inválido'
                })
            }
            
            if (!target_storage_id || isNaN(parseInt(target_storage_id))) {
                return response.status(400).send({
                    error: 'ID do armazém de destino é obrigatório e deve ser um número válido'
                })
            }
            
            if (quantity === undefined || quantity === null || quantity <= 0) {
                return response.status(400).send({
                    error: 'Quantidade deve ser um número maior que zero'
                })
            }
            
            if (!reason || reason.trim() === '') {
                return response.status(400).send({
                    error: 'Motivo da transferência é obrigatório'
                })
            }
            
            // Buscar o estoque de origem com suas relações
            const sourceStock = await Stock.query({ client: trx })
                .where('id', stockId)
                .preload('product')
                .preload('storage')
                .first()
            
            if (!sourceStock) {
                return response.status(404).send({
                    error: 'Estoque de origem não encontrado'
                })
            }
            
            // Verificar se não está tentando transferir para o mesmo armazém
            if (sourceStock.storage_id === parseInt(target_storage_id)) {
                return response.status(400).send({
                    error: 'Não é possível transferir para o mesmo armazém de origem'
                })
            }
            
            // Verificar se há quantidade suficiente disponível
            const availableQuantity = sourceStock.quantity - sourceStock.quantity_reserved
            if (quantity > availableQuantity) {
                return response.status(400).send({
                    error: `Quantidade insuficiente disponível. Disponível: ${availableQuantity}, Solicitado: ${quantity}`
                })
            }
            
            // Verificar se o armazém de destino existe
            const Storage = (await import('App/Models/Storage')).default
            const targetStorage = await Storage.query({ client: trx })
                .where('id', parseInt(target_storage_id))
                .first()
            
            if (!targetStorage) {
                return response.status(404).send({
                    error: 'Armazém de destino não encontrado'
                })
            }
            
            // Usar o serviço de estoque para fazer a transferência
            const stockService = new StockService()
            const { sourceStock: updatedSourceStock, targetStock } = await stockService.transferStock(
                sourceStock,
                parseInt(target_storage_id),
                quantity,
                reason.trim(),
                auth.user!.id,
                trx
            )
            
            // Recarregar os estoques com transações atualizadas
            await updatedSourceStock.load('transactions', builder => {
                builder.preload('purchase_order')
                       .preload('sale')
                       .preload('sale_order')
                       .preload('user', userBuilder => 
                           userBuilder.select('id', 'name', 'slug', 'avatar')
                       )
                       .orderBy('id', 'desc')
            })
            
            await targetStock.load('transactions', builder => {
                builder.preload('purchase_order')
                       .preload('sale')
                       .preload('sale_order')
                       .preload('user', userBuilder => 
                           userBuilder.select('id', 'name', 'slug', 'avatar')
                       )
                       .orderBy('id', 'desc')
            })
            
            await targetStock.load('storage')
            
            await trx.commit()
            
            return response.status(200).send({
                data: {
                    sourceStock: updatedSourceStock,
                    targetStock: targetStock
                },
                message: `Transferência realizada com sucesso: ${quantity} unidades transferidas para ${targetStorage.name}`
            })
            
        } catch (error) {
            throw error
        }
    }

}
