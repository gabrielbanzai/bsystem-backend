import Database, { TransactionClientContract } from "@ioc:Adonis/Lucid/Database"

class ProductService {
  
  async calculateProductCosts(productId: number, trx?: TransactionClientContract) {
    const db = trx || Database

    // 1. Calcular custo médio ponderado com base nos registros com quantity > 0 (ou seja, vieram de compras)
    const avgResult = await db
      .from('product_costs')
      .where('product_id', productId)
      .andWhere('quantity', '>', 0) // ignora registros manuais sem quantidade
      .select(
        db.raw('SUM(price * quantity) as total_cost'),
        db.raw('SUM(quantity) as total_quantity')
      )
      .first()

    const totalCost = Number(avgResult?.total_cost || 0)
    const totalQty = Number(avgResult?.total_quantity || 0)

    const avgCost = totalQty > 0 ? Math.floor(totalCost / totalQty) : 0

    // 2. Obter o último custo com base no registro mais recente (manual ou compra)
    const lastResult = await db
      .from('product_costs')
      .where('product_id', productId)
      .orderBy('created_at', 'desc')
      .select('price')
      .first()

    const lastCost = Number(lastResult?.price || 0)

    return {
      avgCost,
      lastCost,
    }
  }

}
export default ProductService
