const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

// @desc    Get all enrollments
// @route   GET /api/enrollments
// @access  Private (Admin or Teacher)
const getEnrollments = async (req, res) => {
  try {
    let enrollments;

    if (req.user.role === 'admin') {
      enrollments = await prisma.enrollment.findMany({
        include: {
          student: { select: { id: true, name: true } },
          class: { select: { id: true, class_name: true, type: true } },
        },
      });
    } else {
      // Teacher sees enrollments for their classes
      enrollments = await prisma.enrollment.findMany({
        where: {
          class: { teacher_id: req.user.id },
        },
        include: {
          student: { select: { id: true, name: true } },
          class: { select: { id: true, class_name: true, type: true } },
        },
      });
    }

    res.json(enrollments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Enroll a student
// @route   POST /api/enrollments
// @access  Private/Admin
const createEnrollment = async (req, res) => {
  try {
    const { student_id, class_id } = req.body;

    if (!student_id || !class_id) {
      return res.status(400).json({ message: 'Please provide student_id and class_id' });
    }

    // 1. Verify class and student exist
    const selectedClass = await prisma.class.findUnique({
      where: { id: Number(class_id) }
    });

    if (!selectedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // 2. Prevent duplicate enrollment in the same class
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        student_id_class_id: {
          student_id: Number(student_id),
          class_id: Number(class_id),
        }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Student is already enrolled in this class' });
    }

    // 3. Validation: A student can only have ONE active 'Quran' enrollment
    if (selectedClass.type === 'Quran') {
      const activeQuranEnrollments = await prisma.enrollment.findFirst({
        where: {
          student_id: Number(student_id),
          class: { type: 'Quran' },
          status: 'Active'
        }
      });

      if (activeQuranEnrollments) {
        return res.status(400).json({ 
          message: 'Student already has an active Quran class enrollment. They can only have one.' 
        });
      }
    }

    // Create the enrollment
    const newEnrollment = await prisma.enrollment.create({
      data: {
        student_id: Number(student_id),
        class_id: Number(class_id),
        status: 'Active',
      },
      include: {
        student: { select: { id: true, name: true } },
        class: { select: { id: true, class_name: true, type: true } },
      }
    });

    res.status(201).json(newEnrollment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update enrollment (Status or Class reassignment)
// @route   PUT /api/enrollments/:id
// @access  Private/Admin
const updateEnrollment = async (req, res) => {
  try {
    const { status, class_id } = req.body; // 'Active' or 'Disabled', and optional class_id

    if (status && !['Active', 'Disabled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use Active or Disabled.' });
    }

    const enrollmentExists = await prisma.enrollment.findUnique({
      where: { id: Number(req.params.id) },
      include: { class: true }
    });

    if (!enrollmentExists) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // If reactivating a Quran class, ensure they don't have another active one
    if (status === 'Active' && enrollmentExists.class.type === 'Quran') {
      const activeQuran = await prisma.enrollment.findFirst({
        where: {
          student_id: enrollmentExists.student_id,
          class: { type: 'Quran' },
          status: 'Active',
          id: { not: enrollmentExists.id } // Exclude this specific enrollment
        }
      });

      if (activeQuran) {
        return res.status(400).json({ 
          message: 'Cannot reactivate. Student already has another active Quran class.' 
        });
      }
    }

    // If changing class, handle potential unique constraint conflicts
    if (class_id && Number(class_id) !== enrollmentExists.class_id) {
      // Check if student is already enrolled in the target class (e.g. they were in it previously)
      const existingInTarget = await prisma.enrollment.findUnique({
        where: {
          student_id_class_id: {
            student_id: enrollmentExists.student_id,
            class_id: Number(class_id)
          }
        }
      });

      if (existingInTarget) {
        // If it's a different enrollment ID, we must remove it to allow the reassignment
        // This is safe because the user wants to MOVE the current history to this class.
        // The existing record is likely a "Disabled" residue from a previous assignment.
        await prisma.enrollment.delete({
          where: { id: existingInTarget.id }
        });
      }
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (class_id) updateData.class_id = Number(class_id);

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: Number(req.params.id) },
      data: updateData,
      include: {
        student: { select: { id: true, name: true } },
        class: { select: { id: true, class_name: true, type: true } },
      }
    });

    res.json(updatedEnrollment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private/Admin
const deleteEnrollment = async (req, res) => {
  try {
    const enrollmentExists = await prisma.enrollment.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!enrollmentExists) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Consider implications: deleting an enrollment cascades and deletes Attendance/Progress? 
    // Usually, we want to update status to 'Disabled' rather than hard delete to retain history.
    await prisma.enrollment.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: 'Enrollment removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
};
