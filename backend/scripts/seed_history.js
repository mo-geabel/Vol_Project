const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { subDays, format } = require('date-fns');

async function seedHistory() {
  console.log('Seeding student with history...');

  // 1. Get a Teacher
  const teacher = await prisma.user.findFirst({ where: { role: 'teacher' } });
  if (!teacher) {
    console.error('No teacher found. Please run the main seed first.');
    return;
  }

  // 2. Create/Find a Quranic Class
  let quranClass = await prisma.class.findFirst({ where: { type: 'Quran', teacher_id: teacher.id } });
  if (!quranClass) {
    quranClass = await prisma.class.create({
      data: {
        class_name: 'Seed Test Class',
        type: 'Quran',
        teacher_id: teacher.id
      }
    });
  }

  // 3. Create Student
  const student = await prisma.student.create({
    data: {
      name: 'Yusuf Al-History',
      contact_info: '555-9999',
      parent_info: 'Parent of Yusuf'
    }
  });

  // 4. Enroll
  const enrollment = await prisma.enrollment.create({
    data: {
      student_id: student.id,
      class_id: quranClass.id,
      status: 'Active'
    }
  });

  console.log(`Student created: ${student.name} (ID: ${student.id})`);
  console.log(`Enrollment ID: ${enrollment.id}`);

  // 5. Generate 30 days of history
  const historyDays = 30;
  for (let i = historyDays; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Attendance (80% present)
    const status = Math.random() > 0.2 ? 'Present' : 'Absent';
    await prisma.attendance.create({
      data: {
        enrollment_id: enrollment.id,
        date: new Date(dateStr),
        status: status
      }
    });

    if (status === 'Present') {
      // Progress (mostly Hifz, some Not Prepared)
      const roll = Math.random();
      if (roll > 0.1) {
        // Log Hifz
        await prisma.quranProgress.create({
          data: {
            enrollment_id: enrollment.id,
            date: new Date(dateStr),
            type: 'Hifz',
            surah_id: 18, // Al-Kahf
            start_verse: 1 + (historyDays - i),
            end_verse: 3 + (historyDays - i),
            rating: Math.floor(Math.random() * 4) + 7 // 7 to 10
          }
        });
      } else {
        // Log Not Prepared
        await prisma.quranProgress.create({
          data: {
            enrollment_id: enrollment.id,
            date: new Date(dateStr),
            type: 'NotPreparedHifz'
          }
        });
      }
    }
  }

  console.log('Seeding history completed successfully!');
}

seedHistory()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
