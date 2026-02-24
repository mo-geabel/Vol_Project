const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private (Admin or Teacher)
const getClasses = async (req, res) => {
  try {
    let classes;
    
    if (req.user.role === 'admin') {
      // Admin sees all classes
      classes = await prisma.class.findMany({
        include: {
          teacher: { select: { id: true, name: true } },
        },
      });
    } else {
      // Teacher sees only their assigned classes
      classes = await prisma.class.findMany({
        where: { teacher_id: req.user.id },
        include: {
          teacher: { select: { id: true, name: true } },
        },
      });
    }

    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single class
// @route   GET /api/classes/:id
// @access  Private
const getClassById = async (req, res) => {
  try {
    const classData = await prisma.class.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        teacher: { select: { id: true, name: true } },
      },
    });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Role check: Teacher can only view if assigned
    if (req.user.role === 'teacher' && classData.teacher_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this class' });
    }

    res.json(classData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new class
// @route   POST /api/classes
// @access  Private/Admin
const createClass = async (req, res) => {
  try {
    const { class_name, type, teacher_id, schedule_settings } = req.body;

    if (!class_name || !type || !teacher_id) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    const newClass = await prisma.class.create({
      data: {
        class_name,
        type,
        teacher_id: teacher_id ? Number(teacher_id) : null,
        schedule_settings: schedule_settings || {},
      },
    });

    res.status(201).json(newClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private/Admin
const updateClass = async (req, res) => {
  try {
    const { class_name, type, teacher_id, schedule_settings } = req.body;

    const classExists = await prisma.class.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!classExists) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const updatedClass = await prisma.class.update({
      where: { id: Number(req.params.id) },
      data: {
        class_name: class_name || classExists.class_name,
        type: type || classExists.type,
        teacher_id: teacher_id !== undefined ? (teacher_id ? Number(teacher_id) : null) : classExists.teacher_id,
        schedule_settings: schedule_settings || classExists.schedule_settings,
      },
    });

    res.json(updatedClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
const deleteClass = async (req, res) => {
  try {
    const classId = Number(req.params.id);
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Use a transaction to delete all related data safely
    await prisma.$transaction(async (tx) => {
      // 1. Delete progress records related to enrollments in this class
      const enrollments = await tx.enrollment.findMany({
        where: { class_id: classId },
        select: { id: true }
      });
      const enrollmentIds = enrollments.map(e => e.id);

      if (enrollmentIds.length > 0) {
        await tx.attendance.deleteMany({ where: { enrollment_id: { in: enrollmentIds } } });
        await tx.quranProgress.deleteMany({ where: { enrollment_id: { in: enrollmentIds } } });
        await tx.theoryProgress.deleteMany({ where: { enrollment_id: { in: enrollmentIds } } });
        await tx.enrollment.deleteMany({ where: { id: { in: enrollmentIds } } });
      }

      // 2. Delete class schedules
      await tx.schedule.deleteMany({ where: { class_id: classId } });

      // 3. Delete the class itself
      await tx.class.delete({ where: { id: classId } });
    });

    res.json({ message: 'Class and all related records removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
};
