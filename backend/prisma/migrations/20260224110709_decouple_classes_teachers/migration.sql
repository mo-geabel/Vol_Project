-- DropForeignKey
ALTER TABLE "classes" DROP CONSTRAINT "classes_teacher_id_fkey";

-- AlterTable
ALTER TABLE "classes" ALTER COLUMN "teacher_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
