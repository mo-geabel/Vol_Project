const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all system settings
exports.getSettings = async (req, res) => {
  try {
    const settingsList = await prisma.systemSetting.findMany();
    
    // Transform list of {key, value} into a single object
    const settings = settingsList.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    // Default values if settings are not set
    const defaultSettings = {
      mosqueName: 'Mosque Educational Management System',
      mosqueAddress: '',
      mosquePhone: '',
      attendanceThreshold: 60,
      academicYearStart: new Date().getFullYear().toString()
    };

    res.json({ ...defaultSettings, ...settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

// Update system settings (accepts key-value pairs in body)
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    
    // We'll perform updates in a transaction to ensure atomicity
    const updatePromises = Object.entries(updates).map(([key, value]) => {
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    });

    await Promise.all(updatePromises);
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
};
