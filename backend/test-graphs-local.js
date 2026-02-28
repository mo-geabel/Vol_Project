const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

async function testGraphs() {
    const quranActive = await prisma.attendance.findMany({
      where: { enrollment: { class: { type: { not: 'Theory' } } } },
      distinct: ['date'],
      orderBy: { date: 'desc' },
      select: { date: true },
      take: 7
    });

    const theoryActive = await prisma.attendance.findMany({
      where: { enrollment: { class: { type: 'Theory' } } },
      distinct: ['date'],
      orderBy: { date: 'desc' },
      select: { date: true },
      take: 7
    });

    const quranDatesObj = quranActive.map(a => a.date);
    const theoryDatesObj = theoryActive.map(a => a.date);
    const allRelevantDates = [...quranDatesObj, ...theoryDatesObj];

    const quranDaysMap = {};
    const theoryDaysMap = {};

    [...quranDatesObj].sort((a, b) => a - b).forEach(d => {
      const dateStr = d.toISOString().split('T')[0];
      quranDaysMap[dateStr] = { date: dateStr, present: 0, absent: 0, excused: 0 };
    });

    [...theoryDatesObj].sort((a, b) => a - b).forEach(d => {
      const dateStr = d.toISOString().split('T')[0];
      theoryDaysMap[dateStr] = { date: dateStr, present: 0, absent: 0, excused: 0 };
    });

    console.log("Quran dates map init:", quranDaysMap);
    console.log("Theory dates map init:", theoryDaysMap);

    if (allRelevantDates.length > 0) {
      const attendances = await prisma.attendance.groupBy({
        by: ['date', 'status', 'enrollment_id'],
        where: { date: { in: allRelevantDates } },
        _count: { status: true }
      });

      const enrollmentIds = [...new Set(attendances.map(a => a.enrollment_id))];
      const enrollments = await prisma.enrollment.findMany({
        where: { id: { in: enrollmentIds } },
        include: { class: { select: { type: true } } }
      });

      attendances.forEach(a => {
        const enr = enrollments.find(e => e.id === a.enrollment_id);
        if (!enr) return;

        const mapToUse = enr.class.type === 'Theory' ? theoryDaysMap : quranDaysMap;
        const dateStr = a.date.toISOString().split('T')[0];
        
        if (mapToUse[dateStr]) {
          if (a.status === 'Present') mapToUse[dateStr].present += a._count.status;
          if (a.status === 'Absent') mapToUse[dateStr].absent += a._count.status;
          if (a.status === 'Excused') mapToUse[dateStr].excused += a._count.status;
        }
      });
    }

    console.log("Quran final:", Object.values(quranDaysMap));
    console.log("Theory final:", Object.values(theoryDaysMap));
    process.exit(0);
}
testGraphs();
