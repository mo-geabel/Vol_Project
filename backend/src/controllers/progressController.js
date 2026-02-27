const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});
const { checkAttendanceSixtyPercentRule } = require('../services/attendanceService');

// Helper to deduce logic for when a progress is added, mark them present explicitly if not already.
const markPresentViaProgress = async (enrollment_id, date) => {
  const dateObj = new Date(date);
  
  const existingMode = await prisma.attendance.findUnique({
    where: {
      enrollment_id_date: {
        enrollment_id: Number(enrollment_id),
        date: dateObj
      }
    }
  });

  if (!existingMode) {
    await prisma.attendance.create({
      data: {
        enrollment_id: Number(enrollment_id),
        date: dateObj,
        status: 'Present'
      }
    });
  } else if (existingMode.status !== 'Present') {
    await prisma.attendance.update({
      where: { id: existingMode.id },
      data: { status: 'Present' }
    });
  }
};

// @desc    Log Quran Progress
// @route   POST /api/progress/quran
// @access  Private
const logQuranProgress = async (req, res) => {
  try {
    const { enrollment_id, date, type, surah_id, start_verse, end_verse, rating } = req.body;

    // validation
    const isNotPrepared = type === 'NotPreparedHifz' || type === 'NotPreparedMuraja';
    if (!enrollment_id || !date || !type) {
      return res.status(400).json({ message: 'Missing required tracking fields' });
    }

    if (!isNotPrepared && (!surah_id || start_verse === undefined || end_verse === undefined)) {
      return res.status(400).json({ message: 'Missing required Hifz/Muraja fields' });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: Number(enrollment_id) },
      include: { class: true }
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Role check
    if (req.user.role === 'teacher' && enrollment.class.teacher_id !== req.user.id) {
       return res.status(403).json({ message: 'Not authorized for this enrollment' });
    }

    // Check for existing record of the same category (Hifz or Muraja)
    const hifzTypes = ['Hifz', 'NotPreparedHifz'];
    const murajaTypes = ['Muraja', 'NotPreparedMuraja'];
    const searchTypes = hifzTypes.includes(type) ? hifzTypes : murajaTypes;

    const existingProgress = await prisma.quranProgress.findFirst({
      where: {
        enrollment_id: Number(enrollment_id),
        date: new Date(date),
        type: { in: searchTypes }
      }
    });

    let progressResult;
    if (existingProgress) {
      // Update existing
      progressResult = await prisma.quranProgress.update({
        where: { id: existingProgress.id },
        data: {
          type,
          surah_id: surah_id ? Number(surah_id) : null,
          start_verse: start_verse !== undefined ? Number(start_verse) : null,
          end_verse: end_verse !== undefined ? Number(end_verse) : null,
          rating: rating ? Number(rating) : null,
        }
      });
    } else {
      // Create new
      progressResult = await prisma.quranProgress.create({
        data: {
          enrollment_id: Number(enrollment_id),
          date: new Date(date),
          type,
          surah_id: surah_id ? Number(surah_id) : null,
          start_verse: start_verse !== undefined ? Number(start_verse) : null,
          end_verse: end_verse !== undefined ? Number(end_verse) : null,
          rating: rating ? Number(rating) : null,
        }
      });
    }

    // Auto mark present
    await markPresentViaProgress(enrollment_id, date);
    
    // Evaluate 60% rule just in case the status transition affected limits
    await checkAttendanceSixtyPercentRule(enrollment_id, new Date(date));

    res.status(201).json(progressResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Log Theory Progress
// @route   POST /api/progress/theory
// @access  Private
const logTheoryProgress = async (req, res) => {
  try {
    const { class_id, date, topic_name, pages_read, notes } = req.body;

    if (!class_id || !date || !topic_name) {
      return res.status(400).json({ message: 'Missing required theory tracking fields' });
    }

    const classInfo = await prisma.class.findUnique({
      where: { id: Number(class_id) }
    });

    if (!classInfo) return res.status(404).json({ message: 'Class not found' });

    if (req.user.role === 'teacher' && classInfo.teacher_id !== req.user.id) {
       return res.status(403).json({ message: 'Not authorized for this class' });
    }

    const existingProgress = await prisma.theoryProgress.findUnique({
      where: {
        class_id_date: {
          class_id: Number(class_id),
          date: new Date(date)
        }
      }
    });

    let progressResult;
    if (existingProgress) {
      progressResult = await prisma.theoryProgress.update({
        where: { id: existingProgress.id },
        data: {
          topic_name,
          pages_read: pages_read !== undefined ? Number(pages_read) : null,
          notes,
        }
      });
    } else {
      progressResult = await prisma.theoryProgress.create({
        data: {
          class_id: Number(class_id),
          date: new Date(date),
          topic_name,
          pages_read: pages_read !== undefined ? Number(pages_read) : null,
          notes,
        }
      });
    }

    res.status(201).json(progressResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Log "Not Prepared" Progress
// @route   POST /api/progress/not-prepared
// @access  Private
const logNotPrepared = async (req, res) => {
  try {
    const { enrollment_id, date, type } = req.body;
    console.log('logNotPrepared body:', req.body);

    if (!enrollment_id || !date || !type) {
      return res.status(400).json({ message: 'Missing required tracking fields' });
    }

    if (type !== 'NotPreparedHifz' && type !== 'NotPreparedMuraja') {
      return res.status(400).json({ message: 'Invalid NotPrepared type' });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: Number(enrollment_id) },
      include: { class: true }
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Role check
    if (req.user.role === 'teacher' && enrollment.class.teacher_id !== req.user.id) {
       return res.status(403).json({ message: 'Not authorized for this enrollment' });
    }

    // Check for existing record of the same category
    const hifzTypes = ['Hifz', 'NotPreparedHifz'];
    const murajaTypes = ['Muraja', 'NotPreparedMuraja'];
    const searchTypes = type === 'NotPreparedHifz' ? hifzTypes : murajaTypes;

    const existingProgress = await prisma.quranProgress.findFirst({
      where: {
        enrollment_id: Number(enrollment_id),
        date: new Date(date),
        type: { in: searchTypes }
      }
    });

    let progressResult;
    if (existingProgress) {
      progressResult = await prisma.quranProgress.update({
        where: { id: existingProgress.id },
        data: {
          type,
          surah_id: null,
          start_verse: null,
          end_verse: null,
          rating: null,
        }
      });
    } else {
      progressResult = await prisma.quranProgress.create({
        data: {
          enrollment_id: Number(enrollment_id),
          date: new Date(date),
          type,
          surah_id: null,
          start_verse: null,
          end_verse: null,
          rating: null,
        }
      });
    }

    // Auto mark present
    await markPresentViaProgress(enrollment_id, date);
    
    // Evaluate 60% rule
    await checkAttendanceSixtyPercentRule(enrollment_id, new Date(date));

    res.status(201).json(progressResult);
  } catch (error) {
    console.error('ERROR in logNotPrepared:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProgressForEnrollment = async (req, res) => {
  try {
    const { id } = req.params; // enrollment ID

    const [quran, attendance, enrollment] = await Promise.all([
      prisma.quranProgress.findMany({
        where: { enrollment_id: Number(id) },
        orderBy: { date: 'desc' }
      }),
      prisma.attendance.findMany({
        where: { enrollment_id: Number(id) },
        orderBy: { date: 'desc' }
      }),
      prisma.enrollment.findUnique({
        where: { id: Number(id) },
        include: {
          student: true,
          class: true
        }
      })
    ]);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    let theory = [];
    if (enrollment.class.type === 'Theory') {
      theory = await prisma.theoryProgress.findMany({
        where: { class_id: enrollment.class_id },
        orderBy: { date: 'desc' }
      });
    }

    res.json({ enrollment, quran, theory, attendance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

const getClassDailyProgress = async (req, res) => {
  try {
    const { classId, date } = req.params;

    const classInfo = await prisma.class.findUnique({
      where: { id: Number(classId) },
      select: { type: true }
    });

    if (!classInfo) {
      return res.status(404).json({ message: 'Class not found' });
    }

    let progress;
    if (classInfo.type === 'Theory') {
      progress = await prisma.theoryProgress.findUnique({
        where: {
          class_id_date: {
            class_id: Number(classId),
            date: new Date(date)
          }
        }
      });
      // Wrap it in a single-item array or just return it. 
      // For consistency with Quran, let's keep it as is, but the frontend will handle it.
      // Actually, if it's one record, let's just send it.
    } else {
      progress = await prisma.quranProgress.findMany({
        where: {
          enrollment: {
            class_id: Number(classId)
          },
          date: new Date(date)
        },
        include: {
          enrollment: {
            select: {
              id: true,
              student_id: true
            }
          }
        }
      });
    }

    res.json(progress);
  } catch (error) {
    console.error('Error in getClassDailyProgress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSurahs = async (req, res) => {
  try {
    const surahs = await prisma.quranMetadata.findMany({
      orderBy: { surah_id: 'asc' }
    });
    res.json(surahs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  logQuranProgress,
  logNotPrepared,
  logTheoryProgress,
  getClassDailyProgress,
  getProgressForEnrollment,
  getSurahs
};
