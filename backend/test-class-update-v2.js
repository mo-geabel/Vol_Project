const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Fetching classes...');
    const classes = await prisma.class.findMany({
      take: 1
    });

    if (classes.length === 0) {
      console.log('No classes found in the database.');
      return;
    }

    const cls = classes[0];
    console.log(`Found class: ${cls.class_name} (ID: ${cls.id}, Teacher ID: ${cls.teacher_id})`);

    // Try to update with a different teacher or the same one
    const newTeacherId = cls.teacher_id ? (cls.teacher_id === 1 ? 2 : 1) : 1;
    
    console.log(`Attempting to update class ID ${cls.id} with teacher ID ${newTeacherId}...`);
    const updatedClass = await prisma.class.update({
      where: { id: cls.id },
      data: {
        teacher_id: newTeacherId,
      },
    });
    console.log('Update successful:', updatedClass);

    // Try to update with NULL
    console.log(`Attempting to update class ID ${cls.id} with teacher ID NULL...`);
    const updatedClassNull = await prisma.class.update({
      where: { id: cls.id },
      data: {
        teacher_id: null,
      },
    });
    console.log('Update successful (NULL):', updatedClassNull);

  } catch (error) {
    console.error('Update failed with error:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
