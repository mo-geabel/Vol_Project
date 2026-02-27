const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

// @desc    Get attendance for all teachers on a specific date
// @route   GET /api/teacher-attendance/:date
// @access  Private (Admin)
const getTeachersAttendance = async (req, res) => {
  try {
    const { date } = req.params;

    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      select: { id: true, name: true }
    });

    const attendanceRecords = await prisma.teacherAttendance.findMany({
      where: { date: new Date(date) }
    });

    const mappedRecords = teachers.map(teacher => {
      const record = attendanceRecords.find(r => r.teacher_id === teacher.id);
      return {
        id: teacher.id,
        name: teacher.name,
        status: record ? record.status : 'Present',
        notes: record ? record.notes : ''
      };
    });

    res.json(mappedRecords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark teacher attendance (batch)
// @route   POST /api/teacher-attendance
// @access  Private (Admin)
const markTeachersAttendance = async (req, res) => {
  try {
    const { date, attendanceList } = req.body;

    if (!date || !attendanceList || !Array.isArray(attendanceList)) {
      return res.status(400).json({ message: 'Missing date or attendance list array' });
    }

    const dateObj = new Date(date);
    const results = [];

    for (const record of attendanceList) {
      if (!record.id || !record.status) continue;

      const upserted = await prisma.teacherAttendance.upsert({
        where: {
          teacher_id_date: {
            teacher_id: Number(record.id),
            date: dateObj,
          }
        },
        update: { 
          status: record.status,
          notes: record.notes || null
        },
        create: {
          teacher_id: Number(record.id),
          date: dateObj,
          status: record.status,
          notes: record.notes || null
        }
      });
      results.push(upserted);
    }

    res.status(200).json({
      message: 'Teacher attendance saved successfully',
      count: results.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTeachersAttendance,
  markTeachersAttendance,
};
