-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('Active', 'Disabled');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "status" "MemberStatus" NOT NULL DEFAULT 'Active';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "MemberStatus" NOT NULL DEFAULT 'Active';
