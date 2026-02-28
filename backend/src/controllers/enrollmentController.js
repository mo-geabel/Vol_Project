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

// @desc    Get enrollment oversight analytics
// @route   GET /api/enrollments/oversight
// @access  Private/Admin
const getEnrollmentOversight = async (req, res) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const filterYear = year ? Number(year) : now.getFullYear();
    const filterMonth = month ? Number(month) : now.getMonth() + 1; // 1-indexed

    const monthYear = `${filterYear}-${String(filterMonth).padStart(2, '0')}`;
    
    // Get Quranic enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: {
        class: { type: 'Quran' }
      },
      include: {
        student: { select: { name: true } },
        class: { select: { class_name: true, schedule_settings: true } },
      }
    });

    const thresholdSetting = await prisma.systemSetting.findUnique({ where: { key: 'attendanceThreshold' } });
    const threshold = thresholdSetting ? Number(thresholdSetting.value) : 60;

    // Get filter month schedule for each class or default
    const schedules = await prisma.schedule.findMany({
      where: { month_year: monthYear }
    });

    const isCurrentMonth = filterYear === now.getFullYear() && filterMonth === (now.getMonth() + 1);

    const oversightData = await Promise.all(enrollments.map(async (e) => {
      // Find schedule for this class or use global default
      const schedule = schedules.find(s => s.class_id === e.class_id) || 
                       schedules.find(s => s.class_id === null) || 
                       { month_year: monthYear, weekend_config: [5, 6], manual_overrides: {} };

      // Re-use calculation logic
      const calculateActivePassed = (monthYearStr, weekendConfig, manualOverrides) => {
        const [y, m] = monthYearStr.split('-').map(Number);
        const numDaysInMonth = new Date(y, m, 0).getDate();
        const overrides = manualOverrides || {};
        const compareDay = isCurrentMonth ? now.getDate() : numDaysInMonth;
        let passed = 0;

        for (let d = 1; d <= numDaysInMonth; d++) {
          if (d > compareDay) break;
          const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dateObj = new Date(y, m - 1, d);
          const dayOfWeek = dateObj.getDay();
          let isActive = overrides[dateStr] ? (overrides[dateStr] === 'Active') : !weekendConfig.includes(dayOfWeek);
          if (isActive) passed++;
        }
        return passed;
      };

      const activePassed = calculateActivePassed(schedule.month_year, schedule.weekend_config, schedule.manual_overrides);
      
      const absentCount = await prisma.attendance.count({
        where: {
          enrollment_id: e.id,
          status: 'Absent',
          date: {
            gte: new Date(filterYear, filterMonth - 1, 1),
            lte: new Date(filterYear, filterMonth, 0, 23, 59, 59)
          }
        }
      });

      const percentage = activePassed > 0 ? (absentCount / activePassed) * 100 : 0;
      
      // Grace Period Logic
      const regDate = new Date(e.createdAt);
      const isGracePeriod = regDate.getFullYear() === filterYear && regDate.getMonth() === (filterMonth - 1);

      return {
        id: e.id,
        studentName: e.student.name,
        className: e.class.class_name,
        status: e.status,
        absentCount,
        activeDays: activePassed,
        percentage: percentage.toFixed(1),
        isGracePeriod,
        isOverThreshold: percentage > threshold && !isGracePeriod
      };
    }));

    res.json({
      threshold,
      data: oversightData
    });
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
  getEnrollmentOversight,
};
