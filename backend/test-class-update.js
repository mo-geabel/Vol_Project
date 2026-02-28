const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const classId = 1; // Adjust if necessary
    const teacherId = 1; // Adjust if necessary

    console.log('Fetching class...');
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });
    console.log('Class exists:', !!classExists);

    if (!classExists) {
        console.log('No class found with id 1, skipping update test.');
        return;
    }

    console.log('Updating class teacher...');
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        teacher_id: teacherId,
      },
    });
    console.log('Update successful:', updatedClass);
  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
