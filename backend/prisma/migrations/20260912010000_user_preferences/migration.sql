-- AlterTable
ALTER TABLE "users" ADD COLUMN     "break_minutes" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "focus_minutes" INTEGER NOT NULL DEFAULT 25;
