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
        teacher_id: Number(teacher_id),
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
        teacher_id: teacher_id ? Number(teacher_id) : classExists.teacher_id,
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
    const classExists = await prisma.class.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!classExists) {
      return res.status(404).json({ message: 'Class not found' });
    }

    await prisma.class.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: 'Class removed' });
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
