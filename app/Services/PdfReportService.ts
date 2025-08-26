import PDFDocument from 'pdfkit'
import { ResponseContract } from '@ioc:Adonis/Core/Response'
import fs from 'fs'
import path from 'path'
import { format } from 'date-fns'
import { formatCpfCnpj } from 'App/Helpers'

interface ReportOptions {
  title: string
  data: any | any[]
  columns: { label: string, key: string }[]
  fileName?: string
}

export default class PdfReportService {
  public static async generateProductsReport(response: ResponseContract, options: ReportOptions) {
    try {
      const { title, data, columns, fileName = 'relatorio.pdf' } = options

      const doc = new PDFDocument({ margin: 40, size: 'A4' })
      const tempPath = path.join(__dirname, `../../tmp/${Date.now()}_${fileName}`)
      const stream = fs.createWriteStream(tempPath)
      doc.pipe(stream)

      let page = 1
      const rowHeight = 12
      let y = 110

      const logoPath = path.join(__dirname, '../../public/uploads/logo_cliente.png')

      // Marca d’água
      const watermark = () => {
        const wmPath = path.join(__dirname, '../../public/uploads/logo_cliente.png')
        if (!fs.existsSync(wmPath)) return

        const pageWidth = doc.page.width
        const pageHeight = doc.page.height

        doc.save()
        doc.opacity(0.2)
        doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] })
        doc.image(
          wmPath,
          pageWidth / 2 - 200 + 60, 
          pageHeight / 2 - 150 + 50, 
          {
            width: 400,
            align: 'center',
            valign: 'center',
          }
        )
        doc.opacity(1)
        doc.restore()
      }

      // Cabeçalho
      const header = () => {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 30, { width: 50 }) // Logo aumentada
        }

        doc
          .fontSize(14)
          .fillColor('#000')
          .text(title, 200, 40)
          .fontSize(8)
          .text(`Gerado em: ${new Date().toLocaleString()}`, 200, 56)

        doc.moveTo(50, 80).lineTo(545, 80).stroke()
      }

      // Rodapé
      const footer = () => {
        doc.fontSize(8).fillColor('#000').text(`Página ${page}`, 50, 780, {
          align: 'center',
        })
      }

      // Largura da área útil (depois da margem)
      const usableWidth = doc.page.width - 100

      // Larguras proporcionais por chave
      const columnWidths: Record<string, number> = {
        reference: 0.10,
        name: 0.70,
        sale_price: 0.10,
        status: 0.10,
      }

      // Cálculo das posições X das colunas
      const columnPositions = (() => {
        let positions: number[] = []
        let currentX = 50
        columns.forEach((col) => {
          positions.push(currentX)
          currentX += usableWidth * columnWidths[col.key]
        })
        return positions
      })()

      // Cabeçalho da tabela
      const addTableHeader = () => {
        doc.fontSize(9).fillColor('#000').font('Helvetica-Bold')
        columns.forEach((col, i) => {
          const x = columnPositions[i]
          const width = usableWidth * columnWidths[col.key]
          doc.text(col.label, x, y, { width, ellipsis: true })
        })
        y += rowHeight
        doc.font('Helvetica')
      }

      // Linha da tabela
      const addTableRow = (row: any) => {
        columns.forEach((col, i) => {
          let text = String(row[col.key] ?? '')

          // Formatando o preço
          if (col.key === 'sale_price') {
            const raw = row[col.key]
            const priceNumber = Number(raw)

            if (!isNaN(priceNumber)) {
              const valor = priceNumber / 100
              text = `R$ ${valor.toFixed(2).replace('.', ',')}`
            } else {
              text = 'R$ 0,00' // valor padrão em caso de erro
            }
          }


          // Traduzindo o status
          if (col.key === 'status') {
            const status = row[col.key]
            text = status === 'active' ? 'Ativo' : status === 'blocked' ? 'Bloqueado' : status
          }

          const x = columnPositions[i]
          const width = usableWidth * columnWidths[col.key]
          doc.fontSize(9).text(text, x, y, { width, ellipsis: true })
        })

        y += rowHeight

        if (y > 750) {
          doc.addPage()
          page++
          y = 150
          watermark()
          header()
          footer()
          addTableHeader()
        }
      }

      // Execução
      watermark()
      header()
      footer()
      addTableHeader()

      data.forEach((row) => {
        addTableRow(row)
      })

      doc.end()

      return new Promise<void>((resolve) => {
        stream.on('finish', () => {
          response.attachment(tempPath, fileName)
          response.send(fs.readFileSync(tempPath))
          fs.unlinkSync(tempPath)
          resolve()
        })
      })
    } catch (error) {
      console.log(error)
    }
  }

  public static async generatePurchaseOrderReport(response: ResponseContract, pedido: any, user: { name: string }) {
    try {
      const fileName = `pedido-${pedido.id}-${Date.now()}.pdf`
      const doc = new PDFDocument({ margin: 40, size: 'A4' })
      const tempPath = path.join(__dirname, `../../tmp/${fileName}`)
      const stream = fs.createWriteStream(tempPath)
      doc.pipe(stream)

      const logoPath = path.join(__dirname, '../../public/uploads/logo_cliente.png')
      const rowHeight = 12
      const usableWidth = doc.page.width - 100
      let y = 130
      let page = 1

      const watermark = () => {
        const wmPath = path.join(__dirname, '../../public/uploads/logo_cliente.png')
        if (!fs.existsSync(wmPath)) return
        const pageWidth = doc.page.width
        const pageHeight = doc.page.height
        doc.save()
        doc.opacity(0.2)
        doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] })
        doc.image(wmPath, pageWidth / 2 - 200 + 60, pageHeight / 2 - 150 + 50, { width: 200 })
        doc.opacity(1)
        doc.restore()
      }

      const header = () => {
        const empresa = {
          name: 'POUSO ALEGRE TEC SOL',
          address: 'AVENIDA JACY LARAIA VIEIRA 135, BAIRRO SANTA LUCIA, POUSO ALEGRE-MG 37.554-053',
          cnpj: '29.752.274/0001-19',
          phone: '(35) 3025-3388 / (35) 3451-1360',
          email: 'tecsolaquecimentosolar@gmail.com'
        }

        doc.fontSize(9).fillColor('#000')

        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 30, { width: 50 })
        }

        doc
          .font('Helvetica-Bold')
          .text(empresa.name, 110, 30)
          .font('Helvetica')
          .text(`Endereço: ${empresa.address}`, 110, 45)
          .text(`CNPJ: ${empresa.cnpj}`, 110, 60)
          .text(`Tel: ${empresa.phone}`, 110, 75)
          .text(`E-mail: ${empresa.email}`, 110, 90)
          .text(`Emitido por: ${user.name} ${format(pedido.created_at, 'dd/MM/yyyy HH:mm:ss')}`, 110, 105)

        doc.moveTo(50, 120).lineTo(545, 120).stroke()
      }

      const footer = () => {
        doc.fontSize(8).fillColor('#000').text(`Página ${page}`, 50, 790, { align: 'center' })
      }

      const addInfoBlock = () => {
        const labelWidth = 110
        const valueX = 50 + labelWidth + 5
        const valueWidth = doc.page.width - valueX - 50

        doc.fontSize(10).fillColor('#000').font('Helvetica-Bold')

        const printLabelValue = (label: string, value: string) => {
          doc.font('Helvetica-Bold').text(label, 50, y, { width: labelWidth })
          doc.font('Helvetica').text(value, valueX, y, { width: valueWidth })
          y += Math.max(
            doc.heightOfString(label, { width: labelWidth }),
            doc.heightOfString(value, { width: valueWidth })
          ) + 5
        }

        printLabelValue('Pedido de compra Nº:', String(pedido.id))
        printLabelValue('Fornecedor:', pedido.supplier?.name ?? '-')
        printLabelValue('CPF/CNPJ:', formatCpfCnpj(pedido.supplier?.cpf_cnpj ?? '-'))
        // printLabelValue('Transportadora:', pedido.shipping_company?.name ?? '-')
        // printLabelValue('Condição de Pagamento:', `${pedido.payment_days} dias (${pedido.installments}x)`)        

        let paymentCondition = ''
        if (pedido.payment_days === 0) {
          paymentCondition = 'Imediato'
        } else {
          paymentCondition = `${pedido.payment_days} dias`
        }

        if (pedido.installments === 1) {
          paymentCondition += ' (à vista)'
        } else {
          paymentCondition += ` (${pedido.installments}x)`
        }

        printLabelValue('Condição de Pagamento:', paymentCondition)


        const statusMap: any = { pending: 'Pendente', done: 'Confirmado', canceled: 'Cancelado' }
        printLabelValue('Status:', statusMap[pedido.status] ?? pedido.status)
        printLabelValue('Comprador:', pedido.user?.name ?? user.name)

        doc.moveTo(50, y).lineTo(545, y).stroke()
        y += 20
      }

      const addProductTable = () => {
        const columns = [
          { label: 'Produto', key: 'name', width: 0.50 },
          { label: 'Quant.', key: 'quantity', width: 0.10 },
          { label: 'Unit.', key: 'unit', width: 0.10 },
          { label: 'Preço Unit.', key: 'unit_price', width: 0.10 },
          { label: 'Desconto', key: 'discount_price', width: 0.10 },
          { label: 'Total', key: 'total', width: 0.10 },
        ]

        const columnPositions = (() => {
          let positions: number[] = []
          let currentX = 50
          for (const col of columns) {
            positions.push(currentX)
            currentX += usableWidth * col.width
          }
          return positions
        })()

        const addTableHeader = () => {
          doc.fontSize(9).fillColor('#000').font('Helvetica-Bold')
          columns.forEach((col, i) => {
            const x = columnPositions[i]
            const width = usableWidth * col.width
            doc.text(col.label, x, y, { width })
          })
          y += rowHeight
          doc.font('Helvetica')
        }

        doc.fontSize(10).font('Helvetica-Bold').text('Itens', 50, y)
        y += rowHeight + 5
        addTableHeader()

        for (const item of pedido.items) {
          const product = item.product
          const fields = {
            name: product?.name ?? '-',
            quantity: item.quantity,
            unit: product?.unit_out?.abbreviation ?? '-',
            unit_price: `R$ ${(item.unit_price / 100).toFixed(2).replace('.', ',')}`,
            discount_price: `R$ ${(item.discount_price / 100).toFixed(2).replace('.', ',')}`,
            total: `R$ ${(item.total / 100).toFixed(2).replace('.', ',')}`,
          }

          let maxHeight = 0

          columns.forEach((col, i) => {
            const x = columnPositions[i]
            const width = usableWidth * col.width
            const text = String(fields[col.key])
            const height = doc.heightOfString(text, { width })
            doc.fontSize(9).font('Helvetica').text(text, x, y, { width })
            if (height > maxHeight) maxHeight = height
          })

          y += maxHeight + 2

          if (y + maxHeight + 10 > 750) {
            doc.addPage()
            page++
            y = 100
            watermark()
            header()
            footer()
            doc.fontSize(10).font('Helvetica-Bold').text('Itens (continuação)', 50, y)
            y += rowHeight + 5
            addTableHeader()
          }
        }

        y += 15
        doc.moveTo(50, y).lineTo(545, y).stroke()
        y += 10
      }

      const addTotalsAtEnd = () => {
        if (y + 60 > 750) {
          doc.addPage()
          page++
          y = 150
          watermark()
          header()
          footer()
        }

        doc.fontSize(13).font('Helvetica-Bold').text('Totais do Pedido', 50, y)
        y += rowHeight + 5

        const line = (label: string, value: string, bold = false, bigger = false) => {
          const size = bigger ? 13 : 11
          doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).text(label, 50, y)
          doc.text(value, 150, y)
          y += rowHeight + 2
        }

        line('Total Produtos:', `R$ ${(pedido.items_total / 100).toFixed(2).replace('.', ',')}`)
        line('Frete:', `R$ ${(pedido.shipping_total / 100).toFixed(2).replace('.', ',')}`)
        line('Desconto:', `R$ ${(pedido.discount_price / 100).toFixed(2).replace('.', ',')}`)
        line('Total Final:', `R$ ${(pedido.total / 100).toFixed(2).replace('.', ',')}`, true, true)

        y += 10
      }

      watermark()
      header()
      footer()
      addInfoBlock()
      addProductTable()
      addTotalsAtEnd()

      doc.end()

      return new Promise<void>((resolve) => {
        stream.on('finish', () => {
          response.attachment(tempPath, fileName)
          response.send(fs.readFileSync(tempPath))
          fs.unlinkSync(tempPath)
          resolve()
        })
      })
    } catch (error) {
      console.log(error)
    }
  }

  public static async generateSaleOrderReport(response: ResponseContract, sale: any, user: { name: string }) {
    try {
      const fileName = `venda-${sale.id}-${Date.now()}.pdf`
      const doc = new PDFDocument({ margin: 40, size: 'A4' })
      const tempPath = path.join(__dirname, `../../tmp/${fileName}`)
      const stream = fs.createWriteStream(tempPath)
      doc.pipe(stream)

      const logoPath = path.join(__dirname, '../../public/uploads/logo_cliente.png')
      const rowHeight = 12
      const usableWidth = doc.page.width - 100
      let y = 130
      let page = 1

      const watermark = () => {
        const wmPath = path.join(__dirname, '../../public/uploads/logo_cliente.png')
        if (!fs.existsSync(wmPath)) return
        const pageWidth = doc.page.width
        const pageHeight = doc.page.height
        doc.save()
        doc.opacity(0.2)
        doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] })
        doc.image(wmPath, pageWidth / 2 - 200 + 60, pageHeight / 2 - 150 + 50, { width: 200 })
        doc.opacity(1)
        doc.restore()
      }

      const header = () => {
        const empresa = {
          name: 'POUSO ALEGRE TEC SOL',
          address: 'AVENIDA JACY LARAIA VIEIRA 135, BAIRRO SANTA LUCIA, POUSO ALEGRE-MG 37.554-053',
          cnpj: '29.752.274/0001-19',
          phone: '(35) 3025-3388 / (35) 3451-1360',
          email: 'tecsolaquecimentosolar@gmail.com'
        }

        doc.fontSize(9).fillColor('#000')

        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 30, { width: 50 })
        }

        doc
          .font('Helvetica-Bold')
          .text(empresa.name, 110, 30)
          .font('Helvetica')
          .text(`Endereço: ${empresa.address}`, 110, 45)
          .text(`CNPJ: ${empresa.cnpj}`, 110, 60)
          .text(`Tel: ${empresa.phone}`, 110, 75)
          .text(`E-mail: ${empresa.email}`, 110, 90)
          .text(`Emitido por: ${user.name} ${format(sale.created_at, 'dd/MM/yyyy HH:mm:ss')}`, 110, 105)

        doc.moveTo(50, 120).lineTo(545, 120).stroke()
      }


      // const header = () => {
      //   if (fs.existsSync(logoPath)) {
      //     doc.image(logoPath, 50, 30, { width: 50 })
      //   }
      //   doc
      //     .fontSize(16)
      //     .fillColor('#000')
      //     .font('Helvetica-Bold')
      //     .text('Pedido de Venda', 200, 40)

      //   doc
      //     .fontSize(11)
      //     .font('Helvetica')
      //     .text(`Gerado por: ${user.name} - ${new Date().toLocaleString()}`, 200, 60)

      //   doc.moveTo(50, 80).lineTo(545, 80).stroke()
      // }

      const footer = () => {
        doc.fontSize(8).fillColor('#000').text(`Página ${page}`, 50, 790, { align: 'center' })
      }

      const addInfoBlock = () => {
        const labelWidth = 120
        const valueX = 50 + labelWidth + 5
        const valueWidth = doc.page.width - valueX - 50

        doc.fontSize(10).fillColor('#000').font('Helvetica-Bold')

        const printLabelValue = (label: string, value: string) => {
          doc.font('Helvetica-Bold').text(label, 50, y, { width: labelWidth })
          doc.font('Helvetica').text(value, valueX, y, { width: valueWidth })
          y += Math.max(
            doc.heightOfString(label, { width: labelWidth }),
            doc.heightOfString(value, { width: valueWidth })
          ) + 5
        }


        printLabelValue('Pedido de venda Nº:', String(sale.id))
        printLabelValue('Cliente:', sale.client?.name ?? '-')
        printLabelValue('CPF/CNPJ:', formatCpfCnpj(sale.client?.cpf_cnpj ?? '-'))

        // printLabelValue('Venda Nº:', String(sale.id))
        // printLabelValue('Cliente:', sale.client?.name ?? '-')
        // printLabelValue('Contato:', sale.client?.contact_name ?? '-')
        // printLabelValue('Documento:', sale.client?.cpf_cnpj ?? '-')
        // printLabelValue('Endereço:', `${sale.client?.address?.street}, ${sale.client?.address?.number} - ${sale.client?.address?.district}, ${sale.client?.address?.city} - ${sale.client?.address?.uf}`)
        // printLabelValue('Transportadora:', sale.shipping_company?.name ?? '-')
        // printLabelValue('Condição de Pagamento:', `${sale.payment_days} dias (${sale.installments}x)`)

        let paymentCondition = ''
        if (sale.payment_days === 0) {
          paymentCondition = 'Imediato'
        } else {
          paymentCondition = `${sale.payment_days} dias`
        }

        if (sale.installments === 1) {
          paymentCondition += ' (à vista)'
        } else {
          paymentCondition += ` (${sale.installments}x)`
        }

        printLabelValue('Condição de Pagamento:', paymentCondition)

        const statusMap: any = { pending: 'Pendente', done: 'Confirmado', canceled: 'Cancelado'  }
        printLabelValue('Status:', statusMap[sale.status] ?? sale.status)
        printLabelValue('Vendedor:', sale.user?.name ?? user.name)

        doc.moveTo(50, y).lineTo(545, y).stroke()
        y += 20
      }

      const addProductTable = () => {
        const columns = [
          { label: 'Produto', key: 'name', width: 0.50 },
          { label: 'Quant.', key: 'quantity', width: 0.10 },
          { label: 'Unit.', key: 'unit', width: 0.10 },
          { label: 'Preço Unit.', key: 'unit_price', width: 0.10 },
          { label: 'Desconto', key: 'discount_price', width: 0.10 },
          { label: 'Total', key: 'total', width: 0.10 },
        ]

        const columnPositions = (() => {
          let positions: number[] = []
          let currentX = 50
          for (const col of columns) {
            positions.push(currentX)
            currentX += usableWidth * col.width
          }
          return positions
        })()

        const addTableHeader = () => {
          doc.fontSize(9).fillColor('#000').font('Helvetica-Bold')
          columns.forEach((col, i) => {
            const x = columnPositions[i]
            const width = usableWidth * col.width
            doc.text(col.label, x, y, { width })
          })
          y += rowHeight
          doc.font('Helvetica')
        }

        doc.fontSize(10).font('Helvetica-Bold').text('Itens', 50, y)
        y += rowHeight + 5
        addTableHeader()

        for (const item of sale.items) {
          const product = item.product
          const fields = {
            name: product?.name ?? '-',
            quantity: item.quantity,
            unit: product?.unit_out?.abbreviation ?? '-',
            unit_price: `R$ ${(item.unit_price / 100).toFixed(2).replace('.', ',')}`,
            discount_price: `R$ ${(item.discount_price / 100).toFixed(2).replace('.', ',')}`,
            total: `R$ ${(item.total / 100).toFixed(2).replace('.', ',')}`,
          }

          let maxHeight = 0
          columns.forEach((col, i) => {
            const x = columnPositions[i]
            const width = usableWidth * col.width
            const text = String(fields[col.key])
            const height = doc.heightOfString(text, { width })
            doc.fontSize(9).font('Helvetica').text(text, x, y, { width })
            if (height > maxHeight) maxHeight = height
          })

          y += maxHeight + 2

          if (y + maxHeight + 10 > 750) {
            doc.addPage()
            page++
            y = 100
            watermark()
            header()
            footer()
            doc.fontSize(10).font('Helvetica-Bold').text('Itens (continuação)', 50, y)
            y += rowHeight + 5
            addTableHeader()
          }
        }

        y += 15
        doc.moveTo(50, y).lineTo(545, y).stroke()
        y += 10
      }

      const addTotalsAtEnd = () => {
        if (y + 60 > 750) {
          doc.addPage()
          page++
          y = 150
          watermark()
          header()
          footer()
        }

        doc.fontSize(13).font('Helvetica-Bold').text('Totais da Venda', 50, y)
        y += rowHeight + 5

        const line = (label: string, value: string, bold = false, bigger = false) => {
          const size = bigger ? 13 : 11
          doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).text(label, 50, y)
          doc.text(value, 150, y)
          y += rowHeight + 2
        }

        line('Total Produtos:', `R$ ${(sale.items_total / 100).toFixed(2).replace('.', ',')}`)
        line('Frete:', `R$ ${(sale.shipping_total / 100).toFixed(2).replace('.', ',')}`)
        line('Desconto:', `R$ ${(sale.discount_price / 100).toFixed(2).replace('.', ',')}`)
        line('Total Final:', `R$ ${(sale.total / 100).toFixed(2).replace('.', ',')}`, true, true)

        y += 10
      }

      watermark()
      header()
      footer()
      addInfoBlock()
      addProductTable()
      addTotalsAtEnd()

      doc.end()

      return new Promise<void>((resolve) => {
        stream.on('finish', () => {
          response.attachment(tempPath, fileName)
          response.send(fs.readFileSync(tempPath))
          fs.unlinkSync(tempPath)
          resolve()
        })
      })
    } catch (error) {
      console.log(error)
    }
  }
}