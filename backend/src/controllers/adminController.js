const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const [userCount, studentCount, classCount, enrollmentCount] = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
      prisma.class.count(),
      prisma.enrollment.count(),
    ]);

    res.json({
      users: userCount,
      students: studentCount,
      classes: classCount,
      enrollments: enrollmentCount,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAdminStats,
};
