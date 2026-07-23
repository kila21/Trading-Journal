-- AlterTable
ALTER TABLE "trade" ADD COLUMN     "checkedConditions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "setup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "conditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stopRule" TEXT,
    "targetRule" TEXT,
    "minR" DOUBLE PRECISION,
    "sessions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "instruments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "setup_userId_idx" ON "setup"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "setup_userId_name_key" ON "setup"("userId", "name");

-- AddForeignKey
ALTER TABLE "setup" ADD CONSTRAINT "setup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
