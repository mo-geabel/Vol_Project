/*
  Warnings:

  - You are about to drop the column `enrollment_id` on the `theory_progress` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[class_id,date]` on the table `theory_progress` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `class_id` to the `theory_progress` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "theory_progress" DROP CONSTRAINT "theory_progress_enrollment_id_fkey";

-- AlterTable
ALTER TABLE "theory_progress" DROP COLUMN "enrollment_id",
ADD COLUMN     "class_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "teacher_attendance" (
    "id" SERIAL NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "teacher_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_attendance_teacher_id_date_key" ON "teacher_attendance"("teacher_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "theory_progress_class_id_date_key" ON "theory_progress"("class_id", "date");

-- AddForeignKey
ALTER TABLE "teacher_attendance" ADD CONSTRAINT "teacher_attendance_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theory_progress" ADD CONSTRAINT "theory_progress_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
