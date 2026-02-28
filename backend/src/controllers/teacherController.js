const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

// @desc    Get teacher dashboard stats
// @route   GET /api/teacher/stats
// @access  Private/Teacher
const getTeacherStats = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const [classCount, totalEnrollments, disabledEnrollments] = await Promise.all([
      prisma.class.count({
        where: { teacher_id: teacherId }
      }),
      prisma.enrollment.count({
        where: { class: { teacher_id: teacherId }, status: 'Active' }
      }),
      prisma.enrollment.count({
        where: { class: { teacher_id: teacherId }, status: 'Disabled' }
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
      students: totalEnrollments - disabledEnrollments,
      disabledStudents: disabledEnrollments,
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
        enrollments: { select: { status: true } }
      }
    });

    const formattedClasses = classes.map(c => {
      const total = c.enrollments.length;
      const disabled = c.enrollments.filter(e => e.status === 'Disabled').length;
      return {
        id: c.id,
        name: c.class_name,
        type: c.type,
        studentCount: total - disabled,
        disabledCount: disabled
      };
    });

    res.json(formattedClasses);
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get teacher's top students
// @route   GET /api/teacher/top-students
// @access  Private/Teacher
const getTeacherTopStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;
    // Get class IDs for this teacher
    const teacherClasses = await prisma.class.findMany({
      where: { teacher_id: teacherId },
      select: { id: true }
    });
    const classIds = teacherClasses.map(c => c.id);

    if (classIds.length === 0) {
      return res.json({ attendance: [], performance: [] });
    }

    // Instead of total top 3, get the BEST student PER CLASS for attendance
    const attendanceStats = await prisma.attendance.groupBy({
      by: ['enrollment_id'],
      where: {
        status: 'Present',
        enrollment: { class_id: { in: classIds } }
      },
      _count: { status: true }
    });

    const attEnrollmentIds = attendanceStats.map(a => a.enrollment_id);
    const attEnrollments = await prisma.enrollment.findMany({
      where: { id: { in: attEnrollmentIds } },
      include: { student: true, class: true }
    });

    const classAttendanceMap = {};
    attendanceStats.forEach(stat => {
      const enr = attEnrollments.find(e => e.id === stat.enrollment_id);
      if (!enr) return;
      const classId = enr.class_id;
      
      if (!classAttendanceMap[classId] || classAttendanceMap[classId].score < stat._count.status) {
        classAttendanceMap[classId] = {
          id: enr.student_id,
          name: enr.student.name,
          class: enr.class.class_name,
          type: enr.class.type,
          present_count: stat._count.status,
          score: stat._count.status
        };
      }
    });
    
    const topAttendance = Object.values(classAttendanceMap).slice(0, 3); // Top 3 class reps

    // Best student PER CLASS for performance
    const progressStats = await prisma.quranProgress.groupBy({
      by: ['enrollment_id', 'type'],
      where: {
        enrollment: { class_id: { in: classIds } }
      },
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

    const perfEnrollmentIds = Object.keys(scores).map(id => Number(id));
    const perfEnrollments = await prisma.enrollment.findMany({
      where: { id: { in: perfEnrollmentIds } },
      include: { student: true, class: true }
    });

    const classPerformanceMap = {};
    Object.entries(scores).forEach(([enrollmentId, scoreData]) => {
      const enr = perfEnrollments.find(e => e.id === Number(enrollmentId));
      if (!enr) return;
      const classId = enr.class_id;

      if (!classPerformanceMap[classId] || classPerformanceMap[classId].score < scoreData.total) {
        classPerformanceMap[classId] = {
          id: enr.student_id,
          name: enr.student.name,
          class: enr.class.class_name,
          type: enr.class.type,
          progress_count: scoreData.pos,
          score: scoreData.total
        };
      }
    });

    const topPerformance = Object.values(classPerformanceMap).slice(0, 3); // Top 3 class reps

    // Best Rated student PER CLASS
    const ratedStats = await prisma.quranProgress.groupBy({
      by: ['enrollment_id'],
      where: {
        enrollment: { class_id: { in: classIds } },
        rating: { not: null }
      },
      _avg: { rating: true },
      _count: { rating: true }
    });

    // Valid ratings (>= 3 records)
    const validRatings = ratedStats.filter(r => r._count.rating >= 3);
    
    const ratedEnrollmentIds = validRatings.map(r => r.enrollment_id);
    const ratedEnrollments = await prisma.enrollment.findMany({
      where: { id: { in: ratedEnrollmentIds } },
      include: { student: true, class: true }
    });

    const classRatedMap = {};
    validRatings.forEach(stat => {
      const enr = ratedEnrollments.find(e => e.id === stat.enrollment_id);
      if (!enr) return;
      const classId = enr.class_id;

      if (!classRatedMap[classId] || classRatedMap[classId].score < stat._avg.rating) {
        classRatedMap[classId] = {
          id: enr.student_id,
          name: enr.student.name,
          class: enr.class.class_name,
          type: enr.class.type,
          avg_rating: stat._avg.rating?.toFixed(1) || 0,
          score: stat._avg.rating
        };
      }
    });

    const topRated = Object.values(classRatedMap).slice(0, 3); // Top 3 class reps

    res.json({ attendance: topAttendance, performance: topPerformance, rated: topRated });
  } catch (error) {
    console.error('Error fetching teacher top students:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get teacher dashboard graphs
// @route   GET /api/teacher/graphs
// @access  Private/Teacher
const getTeacherDashboardGraphs = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const teacherClasses = await prisma.class.findMany({
      where: { teacher_id: teacherId },
      select: { id: true }
    });
    const classIds = teacherClasses.map(c => c.id);

    // Get last 7 active dates for Quranic
    const quranActive = await prisma.attendance.findMany({
      where: { enrollment: { class_id: { in: classIds }, class: { type: { not: 'Theory' } } } },
      distinct: ['date'],
      orderBy: { date: 'desc' },
      select: { date: true },
      take: 7
    });

    // Get last 7 active dates for Theory
    const theoryActive = await prisma.attendance.findMany({
      where: { enrollment: { class_id: { in: classIds }, class: { type: 'Theory' } } },
      distinct: ['date'],
      orderBy: { date: 'desc' },
      select: { date: true },
      take: 7
    });

    const quranDatesObj = quranActive.map(a => a.date);
    const theoryDatesObj = theoryActive.map(a => a.date);
    const allRelevantDates = [...quranDatesObj, ...theoryDatesObj];

    const quranDaysMap = {};
    const theoryDaysMap = {};

    [...quranDatesObj].sort((a, b) => a - b).forEach(d => {
      const dateStr = d.toISOString().split('T')[0];
      quranDaysMap[dateStr] = { date: dateStr, present: 0, absent: 0, excused: 0 };
    });

    [...theoryDatesObj].sort((a, b) => a - b).forEach(d => {
      const dateStr = d.toISOString().split('T')[0];
      theoryDaysMap[dateStr] = { date: dateStr, present: 0, absent: 0, excused: 0 };
    });

    if (allRelevantDates.length > 0) {
      const attendances = await prisma.attendance.groupBy({
        by: ['date', 'status', 'enrollment_id'],
        where: { 
          date: { in: allRelevantDates },
          enrollment: { class_id: { in: classIds } }
        },
        _count: { status: true }
      });

      const enrollmentIds = [...new Set(attendances.map(a => a.enrollment_id))];
      const enrollments = await prisma.enrollment.findMany({
        where: { id: { in: enrollmentIds } },
        include: { class: { select: { type: true } } }
      });

      attendances.forEach(a => {
        const enr = enrollments.find(e => e.id === a.enrollment_id);
        if (!enr) return;

        const mapToUse = enr.class.type === 'Theory' ? theoryDaysMap : quranDaysMap;
        const dateStr = a.date.toISOString().split('T')[0];
        
        if (mapToUse[dateStr]) {
          if (a.status === 'Present') mapToUse[dateStr].present += a._count.status;
          if (a.status === 'Absent') mapToUse[dateStr].absent += a._count.status;
          if (a.status === 'Excused') mapToUse[dateStr].excused += a._count.status;
        }
      });
    }

    res.json({
      attendanceTrend: Object.values(quranDaysMap), // Keeps backwards compat
      quranTrend: Object.values(quranDaysMap),
      theoryTrend: Object.values(theoryDaysMap)
    });
  } catch (error) {
    console.error('Error fetching teacher graphs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTeacherStats,
  getTeacherClasses,
  getTeacherTopStudents,
  getTeacherDashboardGraphs
};
