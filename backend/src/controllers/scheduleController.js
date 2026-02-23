const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

// Helper: Calculate Active Days metrics
const calculateActiveDays = (monthYearStr, weekendConfig, manualOverrides) => {
  const [year, month] = monthYearStr.split('-').map(Number);
  // Get number of days in the month
  const numDaysInMonth = new Date(year, month, 0).getDate();
  const overrides = manualOverrides || {};

  let totalActive = 0;
  let activePassed = 0;
  
  // Use server current time for 'Passed' logic
  const now = new Date();
  const currentDay = now.getDate();
  const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;

  for (let d = 1; d <= numDaysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0 (Sun) to 6 (Sat)
    
    let isActive = false;

    // Check manual override first
    if (overrides[dateStr]) {
      isActive = overrides[dateStr] === 'Active';
    } else {
      // Default rule: active if NOT in weekendConfig
      isActive = !weekendConfig.includes(dayOfWeek);
    }

    if (isActive) {
      totalActive++;
      if (isCurrentMonth) {
        if (d <= currentDay) activePassed++;
      } else if (now > dateObj) {
        // past month entirely
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

// @desc    Get schedule (and active metrics) for a month
// @route   GET /api/schedules/:monthYear
// @access  Private
const getSchedule = async (req, res) => {
  try {
    const { monthYear } = req.params; // Format: "YYYY-MM"
    const { class_id } = req.query; // optional, for manual theory classes

    // Determine query context
    const whereClause = {
      month_year: monthYear,
    };
    if (class_id) {
      whereClause.class_id = Number(class_id);
    } else {
      whereClause.class_id = null; // Global Quran schedule
    }

    let schedule = await prisma.schedule.findFirst({ where: whereClause });

    // If no schedule exists, provide a default object structure (but don't save to DB until explicit)
    if (!schedule) {
       schedule = {
          month_year: monthYear,
          weekend_config: [5, 6], // default Friday, Saturday
          manual_overrides: {},
          class_id: class_id ? Number(class_id) : null,
       };
    }

    // Calculate metrics
    const metrics = calculateActiveDays(
      schedule.month_year, 
      schedule.weekend_config, 
      schedule.manual_overrides
    );

    res.json({
      schedule,
      metrics
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create or update schedule
// @route   POST /api/schedules
// @access  Private/Admin
const setupSchedule = async (req, res) => {
  try {
    const { month_year, weekend_config, manual_overrides, class_id } = req.body;

    if (!month_year || !weekend_config) {
      return res.status(400).json({ message: 'Missing required configuration' });
    }

    // Check if exists
    const whereClause = {
      month_year,
      class_id: class_id ? Number(class_id) : null
    };

    let schedule = await prisma.schedule.findFirst({ where: whereClause });

    if (schedule) {
      schedule = await prisma.schedule.update({
        where: { id: schedule.id },
        data: {
          weekend_config,
          manual_overrides: manual_overrides || {},
        },
      });
    } else {
      schedule = await prisma.schedule.create({
        data: {
          month_year,
          weekend_config,
          manual_overrides: manual_overrides || {},
          class_id: class_id ? Number(class_id) : null
        },
      });
    }

    const metrics = calculateActiveDays(
      schedule.month_year, 
      schedule.weekend_config, 
      schedule.manual_overrides
    );

    res.json({ schedule, metrics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSchedule,
  setupSchedule,
};
