const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});
const { checkAttendanceSixtyPercentRule } = require('../services/attendanceService');

// @desc    Get attendance for a class on a specific date
// @route   GET /api/attendance/:classId/:date
// @access  Private (Teacher or Admin)
const getAttendance = async (req, res) => {
  try {
    const { classId, date } = req.params;

    // Verify access
    const classData = await prisma.class.findUnique({ where: { id: Number(classId) } });
    if (!classData) return res.status(404).json({ message: 'Class not found' });
    if (req.user.role === 'teacher' && classData.teacher_id !== req.user.id) {
       return res.status(403).json({ message: 'Not authorized for this class' });
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        enrollment: { class_id: Number(classId) },
        date: new Date(date),
      },
      include: {
        enrollment: {
          include: { student: { select: { id: true, name: true } } }
        }
      }
    });

    res.json(attendanceRecords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark attendance (batch)
// @route   POST /api/attendance
// @access  Private
const markAttendance = async (req, res) => {
  try {
    const { date, attendanceList } = req.body;
    // attendanceList is expected to be an array of objects: { enrollment_id, status }

    if (!date || !attendanceList || !Array.isArray(attendanceList)) {
      return res.status(400).json({ message: 'Missing date or attendance list array' });
    }

    const dateObj = new Date(date);
    const monthYear = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    // Use local year, month, date to match the format in manual_overrides (YYYY-MM-DD)
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    // Schedule check: Verify if the date is marked as Off/Passive
    if (attendanceList.length > 0) {
      const firstEnrollment = await prisma.enrollment.findUnique({
        where: { id: Number(attendanceList[0].enrollment_id) },
        include: { class: true }
      });

      if (firstEnrollment) {
        const schedule = await prisma.schedule.findFirst({
          where: {
            month_year: monthYear,
            class_id: firstEnrollment.class.type === 'Theory' ? firstEnrollment.class_id : null,
          }
        });

        if (schedule) {
          const dayOfWeek = dateObj.getDay();
          const overrides = schedule.manual_overrides || {};
          let isActive = false;

          if (overrides[dateStr]) {
            isActive = overrides[dateStr] === 'Active';
          } else {
            isActive = !schedule.weekend_config.includes(dayOfWeek);
          }

          if (!isActive) {
            return res.status(400).json({ 
              message: `Cannot mark attendance for a day (${dateStr}) that is set as OFF in the schedule.` 
            });
          }
        }
      }
    }

    const results = [];

    for (const record of attendanceList) {
      if (!record.enrollment_id || !record.status) continue;

      // Upsert record: if exists for day, update status, else create
      const upserted = await prisma.attendance.upsert({
        where: {
          enrollment_id_date: {
            enrollment_id: Number(record.enrollment_id),
            date: dateObj,
          }
        },
        update: { status: record.status },
        create: {
          enrollment_id: Number(record.enrollment_id),
          date: dateObj,
          status: record.status,
        }
      });
      results.push(upserted);

      // Immediately execute the 60% rule limit check for each student evaluated
      await checkAttendanceSixtyPercentRule(record.enrollment_id, dateObj);
    }

    res.status(200).json({
      message: 'Attendance saved successfully',
      count: results.length,
      records: results
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAttendance,
  markAttendance,
};
