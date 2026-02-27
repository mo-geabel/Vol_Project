/*
  Warnings:

  - Added the required column `book_title` to the `theory_progress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProgressType" ADD VALUE 'NotPreparedHifz';
ALTER TYPE "ProgressType" ADD VALUE 'NotPreparedMuraja';

-- AlterTable
ALTER TABLE "quran_progress" ALTER COLUMN "surah_id" DROP NOT NULL,
ALTER COLUMN "start_verse" DROP NOT NULL,
ALTER COLUMN "end_verse" DROP NOT NULL;

-- AlterTable
ALTER TABLE "theory_progress" ADD COLUMN     "book_title" TEXT NOT NULL,
ADD COLUMN     "pages_read" INTEGER;
