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

// @desc    Get top performing students
// @route   GET /api/admin/top-students
// @access  Private/Admin
const getTopStudents = async (req, res) => {
  try {
    // Top 3 students by attendance
    const attendanceStats = await prisma.attendance.groupBy({
      by: ['enrollment_id'],
      where: { status: 'Present' },
      _count: { status: true },
      orderBy: { _count: { status: 'desc' } },
      take: 3
    });

    const enrollmentIds = attendanceStats.map(a => a.enrollment_id);
    const enrollments = await prisma.enrollment.findMany({
      where: { id: { in: enrollmentIds } },
      include: {
        student: true,
        class: true
      }
    });

    const topAttendance = attendanceStats.map(stat => {
      const enr = enrollments.find(e => e.id === stat.enrollment_id);
      return {
        id: enr?.student_id,
        name: enr?.student?.name,
        class: enr?.class?.class_name,
        present_count: stat._count.status
      };
    });

    // Students with most positive progress records (Hifz/Muraja), penalizing NotPrepared
    const progressStats = await prisma.quranProgress.groupBy({
      by: ['enrollment_id', 'type'],
      _count: { id: true }
    });

    const scores = {};
    progressStats.forEach(stat => {
      if (!scores[stat.enrollment_id]) scores[stat.enrollment_id] = { pos: 0, neg: 0, total: 0 };
      if (['Hifz', 'Muraja'].includes(stat.type)) {
        scores[stat.enrollment_id].pos += stat._count.id;
        scores[stat.enrollment_id].total += stat._count.id;
      } else {
        scores[stat.enrollment_id].neg += stat._count.id;
        scores[stat.enrollment_id].total -= stat._count.id; // penalty
      }
    });

    const topPerformers = Object.entries(scores)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 3);
    
    const perfEnrollmentIds = topPerformers.map(p => Number(p[0]));
    const perfEnrollments = await prisma.enrollment.findMany({
      where: { id: { in: perfEnrollmentIds } },
      include: { student: true, class: true }
    });

    const topPerformance = topPerformers.map(([enrollmentId, scoreData]) => {
      const enr = perfEnrollments.find(e => e.id === Number(enrollmentId));
      return {
        id: enr?.student_id,
        name: enr?.student?.name,
        class: enr?.class?.class_name,
        progress_count: scoreData.pos // Show the absolute positive records to user
      };
    });

    res.json({ attendance: topAttendance, performance: topPerformance });
  } catch (error) {
    console.error('Error fetching top students:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get data for dashboard graphs
// @route   GET /api/admin/graphs
// @access  Private/Admin
const getDashboardGraphs = async (req, res) => {
  try {
    // Example: Attendance over the last 7 days
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 6);
    lastWeek.setHours(0, 0, 0, 0);

    const attendances = await prisma.attendance.groupBy({
      by: ['date', 'status'],
      where: { date: { gte: lastWeek } },
      _count: { status: true },
      orderBy: { date: 'asc' }
    });

    // Format data for Recharts: [{ date: 'Mon', present: 10, absent: 2 }]
    const daysMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(lastWeek);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      daysMap[dateStr] = { date: dateStr, present: 0, absent: 0, excused: 0 };
    }

    attendances.forEach(a => {
      const dateStr = a.date.toISOString().split('T')[0];
      if (daysMap[dateStr]) {
        if (a.status === 'Present') daysMap[dateStr].present = a._count.status;
        if (a.status === 'Absent') daysMap[dateStr].absent = a._count.status;
        if (a.status === 'Excused') daysMap[dateStr].excused = a._count.status;
      }
    });

    res.json({
      attendanceTrend: Object.values(daysMap)
    });
  } catch (error) {
    console.error('Error fetching graphs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAdminStats,
  getTopStudents,
  getDashboardGraphs
};
