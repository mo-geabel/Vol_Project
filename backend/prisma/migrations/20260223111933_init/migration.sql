-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'teacher');

-- CreateEnum
CREATE TYPE "ClassType" AS ENUM ('Quran', 'Theory');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('Active', 'Disabled');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('Present', 'Absent', 'Excused');

-- CreateEnum
CREATE TYPE "ProgressType" AS ENUM ('Hifz', 'Muraja');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'teacher',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact_info" TEXT,
    "parent_info" TEXT,
    "date_of_birth" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "class_name" TEXT NOT NULL,
    "type" "ClassType" NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "schedule_settings" JSONB,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" SERIAL NOT NULL,
    "month_year" TEXT NOT NULL,
    "weekend_config" INTEGER[],
    "manual_overrides" JSONB,
    "class_id" INTEGER,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "class_id" INTEGER NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'Active',

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" SERIAL NOT NULL,
    "enrollment_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quran_progress" (
    "id" SERIAL NOT NULL,
    "enrollment_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "type" "ProgressType" NOT NULL,
    "surah_id" INTEGER NOT NULL,
    "start_verse" INTEGER NOT NULL,
    "end_verse" INTEGER NOT NULL,
    "rating" INTEGER,

    CONSTRAINT "quran_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theory_progress" (
    "id" SERIAL NOT NULL,
    "enrollment_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "topic_name" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "theory_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quran_metadata" (
    "surah_id" INTEGER NOT NULL,
    "surah_name" TEXT NOT NULL,
    "verse_count" INTEGER NOT NULL,

    CONSTRAINT "quran_metadata_pkey" PRIMARY KEY ("surah_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_student_id_class_id_key" ON "enrollments"("student_id", "class_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_enrollment_id_date_key" ON "attendances"("enrollment_id", "date");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quran_progress" ADD CONSTRAINT "quran_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theory_progress" ADD CONSTRAINT "theory_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
