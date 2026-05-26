const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== USERS ===");
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  });
  console.log(users);

  console.log("=== INVOICES ===");
  const invoices = await prisma.invoice.findMany({
    take: 10,
    select: { id: true, invoiceNumber: true, userId: true, billToName: true }
  });
  console.log(invoices);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
