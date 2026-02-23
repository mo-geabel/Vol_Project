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
    if (!enrollment_id || !date || !type || !surah_id || start_verse === undefined || end_verse === undefined) {
      return res.status(400).json({ message: 'Missing required tracking fields' });
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

    const newProgress = await prisma.quranProgress.create({
      data: {
        enrollment_id: Number(enrollment_id),
        date: new Date(date),
        type,
        surah_id: Number(surah_id),
        start_verse: Number(start_verse),
        end_verse: Number(end_verse),
        rating: rating ? Number(rating) : null,
      }
    });

    // Auto mark present
    await markPresentViaProgress(enrollment_id, date);
    
    // Evaluate 60% rule just in case the status transition affected limits
    await checkAttendanceSixtyPercentRule(enrollment_id, new Date(date));

    res.status(201).json(newProgress);
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
    const { enrollment_id, date, topic_name, notes } = req.body;

    if (!enrollment_id || !date || !topic_name) {
      return res.status(400).json({ message: 'Missing required theory tracking fields' });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: Number(enrollment_id) },
      include: { class: true }
    });

    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    if (req.user.role === 'teacher' && enrollment.class.teacher_id !== req.user.id) {
       return res.status(403).json({ message: 'Not authorized for this enrollment' });
    }

    const newProgress = await prisma.theoryProgress.create({
      data: {
        enrollment_id: Number(enrollment_id),
        date: new Date(date),
        topic_name,
        notes,
      }
    });

    // Auto mark present
    await markPresentViaProgress(enrollment_id, date);

    // Evaluate 60% rule
    await checkAttendanceSixtyPercentRule(enrollment_id, new Date(date));

    res.status(201).json(newProgress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProgressForEnrollment = async (req, res) => {
  try {
    const { id } = req.params; // enrollment ID

    const quran = await prisma.quranProgress.findMany({
      where: { enrollment_id: Number(id) },
      orderBy: { date: 'desc' }
    });
    const theory = await prisma.theoryProgress.findMany({
      where: { enrollment_id: Number(id) },
      orderBy: { date: 'desc' }
    });

    res.json({ quran, theory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  logQuranProgress,
  logTheoryProgress,
  getProgressForEnrollment
};
