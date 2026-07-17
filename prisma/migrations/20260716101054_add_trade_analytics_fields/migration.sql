-- AlterTable
ALTER TABLE "trade" ADD COLUMN     "exitDate" TIMESTAMP(3),
ADD COLUMN     "followedPlan" BOOLEAN,
ADD COLUMN     "mistakeTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "setup" TEXT;
