const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  
  const deletedInvoiceItems = await prisma.invoiceItem.deleteMany({});
  console.log(`Deleted ${deletedInvoiceItems.count || 0} invoice items.`);

  const deletedPayments = await prisma.payment.deleteMany({});
  console.log(`Deleted ${deletedPayments.count || 0} payments.`);

  const deletedInvoices = await prisma.invoice.deleteMany({});
  console.log(`Deleted ${deletedInvoices.count || 0} invoices.`);

  const deletedCustomers = await prisma.customer.deleteMany({});
  console.log(`Deleted ${deletedCustomers.count || 0} customers.`);

  const deletedLogs = await prisma.activityLog.deleteMany({});
  console.log(`Deleted ${deletedLogs.count || 0} activity logs.`);

  const deletedRecurring = await prisma.recurringInvoice.deleteMany({});
  console.log(`Deleted ${deletedRecurring.count || 0} recurring invoices.`);

  console.log("Database successfully cleaned!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
