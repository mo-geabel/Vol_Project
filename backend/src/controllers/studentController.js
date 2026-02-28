const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Admin or Teacher)
const getStudents = async (req, res) => {
  try {
    let students;
    
    if (req.user.role === 'admin') {
      students = await prisma.student.findMany({
        where: { status: 'Active' },
        include: {
          enrollments: {
            include: {
              class: true
            }
          }
        }
      });
    } else {
      // Teacher only sees students enrolled in their classes
      students = await prisma.student.findMany({
        where: {
          status: 'Active',
          enrollments: {
            some: {
              class: {
                teacher_id: req.user.id,
              },
            },
          },
        },
        include: {
          enrollments: {
            include: {
              class: true
            }
          }
        }
      });
    }

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res) => {
  try {
    const student = await prisma.student.findFirst({
      where: { 
        id: Number(req.params.id),
        status: 'Active'
      },
      include: {
        enrollments: {
          include: {
            class: true,
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Role check: Teacher can only view if student is in their class
    if (req.user.role === 'teacher') {
      const isEnrolledInTeacherClass = student.enrollments.some(
        (e) => e.class.teacher_id === req.user.id
      );
      if (!isEnrolledInTeacherClass) {
        return res.status(403).json({ message: 'Not authorized for this student' });
      }
    }

    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Private/Admin
const createStudent = async (req, res) => {
  try {
    const { name, contact_info, parent_info, date_of_birth } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please add a name' });
    }

    const newStudent = await prisma.student.create({
      data: {
        name,
        contact_info,
        parent_info,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
      },
    });

    res.status(201).json(newStudent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private/Admin
const updateStudent = async (req, res) => {
  try {
    const { name, contact_info, parent_info, date_of_birth } = req.body;

    const studentExists = await prisma.student.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!studentExists) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Role check: Teacher can only update if student is in their class
    if (req.user.role === 'teacher') {
      const studentWithEnrollments = await prisma.student.findUnique({
        where: { id: Number(req.params.id) },
        include: { enrollments: { include: { class: true } } }
      });
      
      const isEnrolledInTeacherClass = studentWithEnrollments.enrollments.some(
        (e) => e.class.teacher_id === req.user.id
      );
      
      if (!isEnrolledInTeacherClass) {
        return res.status(403).json({ message: 'Not authorized for this student' });
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id: Number(req.params.id) },
      data: {
        name: name || studentExists.name,
        contact_info: contact_info !== undefined ? contact_info : studentExists.contact_info,
        parent_info: parent_info !== undefined ? parent_info : studentExists.parent_info,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : studentExists.date_of_birth,
      },
    });

    res.json(updatedStudent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
  try {
    const studentExists = await prisma.student.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!studentExists) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await prisma.student.update({
      where: { id: Number(req.params.id) },
      data: { status: 'Disabled' }
    });

    // Also disable all their enrollments
    await prisma.enrollment.updateMany({
      where: { student_id: Number(req.params.id) },
      data: { status: 'Disabled' }
    });

    res.json({ message: 'Student removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Enroll Staff as Student
// @route   POST /api/students/staff-enroll
// @access  Private/Admin
const enrollStaffAsStudent = async (req, res) => {
  try {
    const { user_id, class_id } = req.body;

    const user = await prisma.user.findUnique({ where: { id: Number(user_id) } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Look for an existing student profile that was created for this staff
    // using a specifically formatted contact_info: "STAFF_ID:<id>"
    let student = await prisma.student.findFirst({
      where: { contact_info: `STAFF_ID:${user.id}` }
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          name: `${user.name} (${user.role})`,
          contact_info: `STAFF_ID:${user.id}`
        }
      });
    }

    // Attempt to enroll
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        student_id_class_id: {
          student_id: student.id,
          class_id: Number(class_id)
        }
      }
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'Disabled') {
        await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: 'Active' }
        });
        return res.json({ message: 'Staff re-enrolled successfully' });
      }
      return res.status(400).json({ message: 'Staff is already enrolled in this class' });
    }

    await prisma.enrollment.create({
      data: {
        student_id: student.id,
        class_id: Number(class_id)
      }
    });

    res.status(201).json({ message: 'Staff enrolled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  enrollStaffAsStudent,
};
