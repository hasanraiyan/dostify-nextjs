-- DropIndex
DROP INDEX IF EXISTS "User_phoneNumber_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "phoneNumber";
