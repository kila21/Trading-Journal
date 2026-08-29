-- AlterTable
ALTER TABLE "trade" ADD COLUMN     "emotions" TEXT[] DEFAULT ARRAY[]::TEXT[];
