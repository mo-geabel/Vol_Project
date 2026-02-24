const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

// @desc    Get teacher dashboard stats
// @route   GET /api/teacher/stats
// @access  Private/Teacher
const getTeacherStats = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const [classCount, enrollmentCount] = await Promise.all([
      prisma.class.count({
        where: { teacher_id: teacherId }
      }),
      prisma.enrollment.count({
        where: {
          class: {
            teacher_id: teacherId
          }
        }
      })
    ]);

    // Simple pending actions: Classes that don't have attendance logged for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const classes = await prisma.class.findMany({
      where: { teacher_id: teacherId },
      select: { id: true }
    });

    const classIds = classes.map(c => c.id);
    
    // Check how many of these classes have NO attendance records for any student today
    const attendanceRecordsToday = await prisma.attendance.groupBy({
      by: ['enrollment_id'],
      where: {
        date: today,
        enrollment: {
          class_id: { in: classIds }
        }
      }
    });

    // This is a rough estimation of "Pending Actions"
    // For a better one, we'd compare against expected schedules, but this is a good start.
    const pendingActions = classIds.length > 0 && attendanceRecordsToday.length === 0 ? classIds.length : 0;

    res.json({
      classes: classCount,
      students: enrollmentCount,
      pendingActions: pendingActions
    });
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get teacher's assigned classes with student counts
// @route   GET /api/teacher/classes
// @access  Private/Teacher
const getTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const classes = await prisma.class.findMany({
      where: { teacher_id: teacherId },
      include: {
        _count: {
          select: { enrollments: true }
        }
      }
    });

    const formattedClasses = classes.map(c => ({
      id: c.id,
      name: c.class_name,
      type: c.type,
      studentCount: c._count.enrollments
    }));

    res.json(formattedClasses);
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTeacherStats,
  getTeacherClasses,
};
