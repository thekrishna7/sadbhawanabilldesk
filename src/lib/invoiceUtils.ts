import { db } from './db'

export async function getNextInvoiceNumber(userId: string): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId } })
  const formatPattern = user?.invoiceFormat || 'INV-{YYYY}-{000}'
  const count = await db.invoice.count({ where: { userId } })
  
  let candidateNum = count + 1
  
  const now = new Date()
  const year = now.getFullYear()
  const yy = String(year).slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  while (true) {
    let result = formatPattern
      .replace(/{YYYY}/g, String(year))
      .replace(/{YY}/g, yy)
      .replace(/{MM}/g, month)
      .replace(/{DD}/g, day)

    const seqMatch = result.match(/{0+}/)
    if (seqMatch) {
      const seq = seqMatch[0]
      const padLength = seq.length - 2
      const formattedNum = String(candidateNum).padStart(padLength, '0')
      result = result.replace(seq, formattedNum)
    }

    const existing = await db.invoice.findUnique({ where: { invoiceNumber: result } })
    if (!existing) {
      return result
    }
    candidateNum++
  }
}
