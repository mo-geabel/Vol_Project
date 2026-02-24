const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient({});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      }
    });

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { name, username, role, password } = req.body;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (role) updateData.role = role;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const userExists = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    await prisma.user.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: 'User removed and unassigned from any classes' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
