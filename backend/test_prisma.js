const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const classIds = [1];
    
    const progressStats = await prisma.quranProgress.groupBy({
      by: ['enrollment_id'],
      where: {
        enrollment: { class_id: { in: classIds } }
      },
      _count: { _all: true },
      orderBy: { _count: { id: 'desc' } }, // Using id instead of _all
      take: 5
    });
    console.log("progressStats", progressStats);
    
  } catch (error) {
    console.error("PRISMA ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
