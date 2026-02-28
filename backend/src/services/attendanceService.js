const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

// Import calculation logic. In a larger app, extraction to a shared utility is better.
const calculateActiveDays = (monthYearStr, weekendConfig, manualOverrides) => {
  const [year, month] = monthYearStr.split('-').map(Number);
  const numDaysInMonth = new Date(year, month, 0).getDate();
  const overrides = manualOverrides || {};

  let totalActive = 0;
  let activePassed = 0;
  
  const now = new Date();
  const currentDay = now.getDate();
  const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;

  for (let d = 1; d <= numDaysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay(); 
    
    let isActive = false;
    if (overrides[dateStr]) {
      isActive = overrides[dateStr] === 'Active';
    } else {
      isActive = !weekendConfig.includes(dayOfWeek);
    }

    if (isActive) {
      totalActive++;
      if (isCurrentMonth) {
        if (d <= currentDay) activePassed++;
      } else if (now > dateObj) {
        activePassed++;
      }
    }
  }

  return { active_days_passed: activePassed };
};

const checkAttendanceSixtyPercentRule = async (enrollmentId, actionDate) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: Number(enrollmentId) },
      include: { class: true }
    });

    if (!enrollment || enrollment.status === 'Disabled') return;

    // Skip 60% rule for Theory classes - only apply to Quranic lessons
    if (enrollment.class.type === 'Theory') return;

    const monthYear = `${actionDate.getFullYear()}-${String(actionDate.getMonth() + 1).padStart(2, '0')}`;

    // Get the schedule to find active days passed. 
    // We prioritize class-specific schedule, then fallback to global (class_id: null)
    let schedule = await prisma.schedule.findFirst({
      where: {
        month_year: monthYear,
        OR: [
          { class_id: enrollment.class_id },
          { class_id: null }
        ]
      },
      orderBy: { class_id: 'desc' } // Prisma handles null as lowest, so non-null comes first
    });

    // Default if schedule is not set
    if (!schedule) {
      schedule = { month_year: monthYear, weekend_config: [5, 6], manual_overrides: {} };
    }

    // Counting logic
    const { active_days_passed } = calculateActiveDays(
      schedule.month_year,
      schedule.weekend_config,
      schedule.manual_overrides
    );

    if (active_days_passed === 0) return; // Prevent division by zero early in month

    // Grace Period Logic: If student registered in the SAME month as actionDate, skip the rule
    const registrationDate = new Date(enrollment.createdAt);
    const isSameMonth = registrationDate.getFullYear() === actionDate.getFullYear() &&
                        registrationDate.getMonth() === actionDate.getMonth();
    
    if (isSameMonth) {
      console.log(`[Auto-Oversight] Enrollment ID: ${enrollmentId} is in grace period (Registered this month). Skipping rule.`);
      return;
    }

    // Fetch dynamic threshold from settings (default to 60)
    const thresholdSetting = await prisma.systemSetting.findUnique({ where: { key: 'attendanceThreshold' } });
    const threshold = thresholdSetting ? Number(thresholdSetting.value) : 60;

    // Count Absent Days for this month
    const startOfMonth = new Date(actionDate.getFullYear(), actionDate.getMonth(), 1);
    const endOfMonth = new Date(actionDate.getFullYear(), actionDate.getMonth() + 1, 0, 23, 59, 59);

    const absentDaysCount = await prisma.attendance.count({
      where: {
        enrollment_id: Number(enrollmentId),
        status: 'Absent',
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    // Calculation
    const percentage = active_days_passed > 0 ? (absentDaysCount / active_days_passed) * 100 : 0;

    if (percentage > threshold) {
      // Disable enrollment automatically
      await prisma.enrollment.update({
        where: { id: Number(enrollmentId) },
        data: { status: 'Disabled' }
      });
      console.log(`[Auto-Oversight] Disabled Enrollment ID: ${enrollmentId} due to > ${threshold}% absence (Calculated: ${percentage.toFixed(1)}%).`);
    }

  } catch (error) {
    console.error('Error calculating 60% rule:', error);
  }
};

module.exports = {
  checkAttendanceSixtyPercentRule
};
