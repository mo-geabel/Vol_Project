const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Get class progress report for a period
// @route   GET /api/reports/progress/:classId
// @access  Private/Admin
const getClassProgressReport = async (req, res) => {
  try {
    const { classId } = req.params;
    const { month, year } = req.query;

    if (!year) {
      return res.status(400).json({ message: 'Year is required' });
    }

    // Define date range
    let startDate, endDate;
    if (month && month !== 'all') {
      startDate = new Date(year, month, 1);
      endDate = new Date(year, Number(month) + 1, 0, 23, 59, 59);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    }

    // Fetch class with enrollments and students
    const classData = await prisma.class.findUnique({
      where: { id: Number(classId) },
      include: {
        enrollments: {
          include: {
            student: true,
            quran_progress: {
              where: {
                date: {
                  gte: startDate,
                  lte: endDate
                }
              },
              orderBy: { date: 'asc' }
            },
            attendances: {
              where: {
                date: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          }
        }
      }
    });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Process report data for each student
    const reportData = classData.enrollments.map(enrollment => {
      const { student, quran_progress, attendances } = enrollment;

      // Calculate Age
      let age = null;
      if (student.date_of_birth) {
        const birthDate = new Date(student.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      // Hifz Progress
      const hifzRecords = quran_progress.filter(p => p.type === 'Hifz');
      const hifzStart = hifzRecords.length > 0 ? hifzRecords[0] : null;
      const hifzEnd = hifzRecords.length > 0 ? hifzRecords[hifzRecords.length - 1] : null;

      // Muraja Progress
      const murajaRecords = quran_progress.filter(p => p.type === 'Muraja');
      const murajaStart = murajaRecords.length > 0 ? murajaRecords[0] : null;
      const murajaEnd = murajaRecords.length > 0 ? murajaRecords[murajaRecords.length - 1] : null;

      // Attendance Metrics
      const activeDays = attendances.filter(a => a.status === 'Present').length;
      const absentDays = attendances.filter(a => a.status === 'Absent').length;

      return {
        student_id: student.id,
        name: student.name,
        age: age,
        hifz: {
          start: hifzStart ? { surah_id: hifzStart.surah_id, verse: hifzStart.start_verse, date: hifzStart.date } : null,
          end: hifzEnd ? { surah_id: hifzEnd.surah_id, verse: hifzEnd.end_verse, date: hifzEnd.date } : null
        },
        muraja: {
          start: murajaStart ? { surah_id: murajaStart.surah_id, verse: murajaStart.start_verse, date: murajaStart.date } : null,
          end: murajaEnd ? { surah_id: murajaEnd.surah_id, verse: murajaEnd.end_verse, date: murajaEnd.date } : null
        },
        attendance: {
          activeDays,
          absentDays
        }
      };
    });

    // Fetch surah names for mapping on frontend or here
    const surahs = await prisma.quranMetadata.findMany();
    const surahMap = surahs.reduce((acc, s) => {
      acc[s.surah_id] = s.surah_name;
      return acc;
    }, {});

    // Attach surah names
    const finalReport = reportData.map(student => ({
      ...student,
      hifz: {
        ...student.hifz,
        start: student.hifz.start ? { ...student.hifz.start, surah_name: surahMap[student.hifz.start.surah_id] } : null,
        end: student.hifz.end ? { ...student.hifz.end, surah_name: surahMap[student.hifz.end.surah_id] } : null,
      },
      muraja: {
        ...student.muraja,
        start: student.muraja.start ? { ...student.muraja.start, surah_name: surahMap[student.muraja.start.surah_id] } : null,
        end: student.muraja.end ? { ...student.muraja.end, surah_name: surahMap[student.muraja.end.surah_id] } : null,
      }
    }));

    res.json({
      className: classData.class_name,
      period: { startDate, endDate },
      report: finalReport
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getClassProgressReport
};
