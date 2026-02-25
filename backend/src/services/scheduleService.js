const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

/**
 * Retrieves the appropriate schedule for a given class and month.
 * @param {string} monthYear - Format "YYYY-MM"
 * @param {number|null} classId - The ID of the class
 * @param {string} classType - "Quran" or "Theory"
 */
const getScheduleForClass = async (monthYear, classId, classType) => {
  const whereClause = {
    month_year: monthYear,
    class_id: classType === 'Theory' ? Number(classId) : null,
  };

  let schedule = await prisma.schedule.findFirst({ where: whereClause });

  if (!schedule) {
    schedule = {
      month_year: monthYear,
      weekend_config: [5, 6], // default Friday, Saturday
      manual_overrides: {},
      class_id: classType === 'Theory' ? Number(classId) : null,
    };
  }
  return schedule;
};

/**
 * Determines if a specific date is "Active" according to the schedule.
 * @param {Date} dateObj - The date to check
 * @param {number|null} classId - The ID of the class
 * @param {string} classType - "Quran" or "Theory"
 */
const isDateActive = async (dateObj, classId, classType) => {
  const monthYear = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
  const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  
  const schedule = await getScheduleForClass(monthYear, classId, classType);
  
  const dayOfWeek = dateObj.getDay();
  const overrides = schedule.manual_overrides || {};

  if (overrides[dateStr]) {
    return overrides[dateStr] === 'Active';
  }
  return !schedule.weekend_config.includes(dayOfWeek);
};

/**
 * Calculates active day metrics for a month.
 */
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

  const daysRemaining = totalActive - activePassed;

  return {
    total_active_days: totalActive,
    active_days_passed: activePassed,
    days_remaining: Math.max(0, daysRemaining),
  };
};

module.exports = {
  getScheduleForClass,
  isDateActive,
  calculateActiveDays
};
