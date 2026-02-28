const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({});
const app = express();

app.use(cors());
app.use(express.json());

// Main entry route
app.get('/', (req, res) => {
  res.json({ message: 'Mosque Educational Management System API (JavaScript)' });
});

app.use('/auth', require('./routes/authRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/classes', require('./routes/classRoutes'));
app.use('/students', require('./routes/studentRoutes'));
app.use('/enrollments', require('./routes/enrollmentRoutes'));
app.use('/schedules', require('./routes/scheduleRoutes'));
app.use('/progress', require('./routes/progressRoutes'));
app.use('/attendance', require('./routes/attendanceRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/teacher', require('./routes/teacherRoutes'));
app.use('/settings', require('./routes/settingsRoutes'));
app.use('/teacher-attendance', require('./routes/teacherAttendanceRoutes'));
app.use('/reports', require('./routes/reportRoutes'));

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
