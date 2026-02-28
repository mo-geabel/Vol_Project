const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const [userCount, studentCount, classCount, enrollmentCount] = await Promise.all([
      prisma.user.count({ where: { status: 'Active' } }),
      prisma.student.count({ where: { status: 'Active' } }),
      prisma.class.count(),
      prisma.enrollment.count({ where: { status: 'Active' } }),
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
        type: enr?.class?.type,
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
        type: enr?.class?.type,
        progress_count: scoreData.pos // Show the absolute positive records to user
      };
    });

    // Best Rated Students (Quranic only)
    const ratedStats = await prisma.quranProgress.groupBy({
      by: ['enrollment_id'],
      where: { rating: { not: null } },
      _avg: { rating: true },
      _count: { rating: true }
    });

    // Only consider students with at least 3 ratings to avoid 1-time 10s
    const validRatings = ratedStats.filter(r => r._count.rating >= 3)
                                   .sort((a, b) => b._avg.rating - a._avg.rating)
                                   .slice(0, 3);
                                   
    const ratedEnrollmentIds = validRatings.map(r => r.enrollment_id);
    const ratedEnrollments = await prisma.enrollment.findMany({
      where: { id: { in: ratedEnrollmentIds } },
      include: { student: true, class: true }
    });

    const topRated = validRatings.map(stat => {
      const enr = ratedEnrollments.find(e => e.id === stat.enrollment_id);
      return {
        id: enr?.student_id,
        name: enr?.student?.name,
        class: enr?.class?.class_name,
        type: enr?.class?.type,
        avg_rating: stat._avg.rating?.toFixed(1) || 0
      };
    });

    // Best Teacher Attendance
    const teacherAttendanceStats = await prisma.teacherAttendance.groupBy({
      by: ['teacher_id'],
      where: { status: 'Present' },
      _count: { status: true },
      orderBy: { _count: { status: 'desc' } },
      take: 3
    });

    const teacherIds = teacherAttendanceStats.map(stat => stat.teacher_id);
    const teachers = await prisma.user.findMany({
      where: { id: { in: teacherIds } },
      select: { id: true, name: true }
    });

    const topTeachers = teacherAttendanceStats.map(stat => {
      const teacher = teachers.find(t => t.id === stat.teacher_id);
      return {
        id: teacher?.id,
        name: teacher?.name,
        present_count: stat._count.status
      };
    });

    res.json({ 
      attendance: topAttendance, 
      performance: topPerformance,
      rated: topRated,
      teachers: topTeachers 
    });
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
    // 1. Get last 7 active dates for Quranic
    const quranActiveDates = await prisma.attendance.findMany({
      where: { enrollment: { class: { type: { not: 'Theory' } } } },
      distinct: ['date'],
      orderBy: { date: 'desc' },
      select: { date: true },
      take: 7
    });

    // 2. Get last 7 active dates for Theory
    const theoryActiveDates = await prisma.attendance.findMany({
      where: { enrollment: { class: { type: 'Theory' } } },
      distinct: ['date'],
      orderBy: { date: 'desc' },
      select: { date: true },
      take: 7
    });

    const quranDatesList = quranActiveDates.map(a => a.date);
    const theoryDatesList = theoryActiveDates.map(a => a.date);

    // 3. Fetch attendance for Quranic active dates
    const quranAttendances = await prisma.attendance.groupBy({
      by: ['date', 'status'],
      where: { 
        date: { in: quranDatesList },
        enrollment: { class: { type: { not: 'Theory' } } }
      },
      _count: { status: true }
    });

    // 4. Fetch attendance for Theory active dates
    const theoryAttendances = await prisma.attendance.groupBy({
      by: ['date', 'status'],
      where: { 
        date: { in: theoryDatesList },
        enrollment: { class: { type: 'Theory' } }
      },
      _count: { status: true }
    });

    // Format helper
    const formatTrend = (datesList, attendanceData) => {
      const map = {};
      [...datesList].sort((a, b) => a - b).forEach(d => {
        const dateStr = d.toISOString().split('T')[0];
        map[dateStr] = { date: dateStr, present: 0, absent: 0, excused: 0 };
      });

      attendanceData.forEach(a => {
        const dateStr = a.date.toISOString().split('T')[0];
        if (map[dateStr]) {
          if (a.status === 'Present') map[dateStr].present = a._count.status;
          if (a.status === 'Absent') map[dateStr].absent = a._count.status;
          if (a.status === 'Excused') map[dateStr].excused = a._count.status;
        }
      });
      return Object.values(map);
    };

    const quranTrend = formatTrend(quranDatesList, quranAttendances);
    const theoryTrend = formatTrend(theoryDatesList, theoryAttendances);

    res.json({
      quranTrend,
      theoryTrend,
      attendanceTrend: quranTrend // Fallback/Legacy support
    });
  } catch (error) {
    console.error('Error fetching graphs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get database usage status
// @route   GET /api/admin/db-status
// @access  Private/Admin
const getDatabaseStatus = async (req, res) => {
  try {
    // Query for database size in bytes
    const dbName = process.env.DATABASE_URL.split('/').pop().split('?')[0];
    const result = await prisma.$queryRaw`SELECT pg_database_size(current_database()) as size_bytes`;
    const sizeBytes = Number(result[0].size_bytes);
    
    // Neon free tier limit: 500 MiB = 500 * 1024 * 1024 bytes
    const limitBytes = 500 * 1024 * 1024;
    const usagePercent = (sizeBytes / limitBytes) * 100;

    res.json({
      sizeBytes,
      limitBytes,
      usagePercent: Math.min(usagePercent, 100),
      isFull: usagePercent >= 95
    });
  } catch (error) {
    console.error('Error fetching database status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAdminStats,
  getTopStudents,
  getDashboardGraphs,
  getDatabaseStatus
};
