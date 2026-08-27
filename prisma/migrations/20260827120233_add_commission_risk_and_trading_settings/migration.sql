-- AlterTable
ALTER TABLE "trade" ADD COLUMN     "commission" DOUBLE PRECISION,
ADD COLUMN     "riskAmount" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "trading_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountBalance" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trading_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trading_settings_userId_key" ON "trading_settings"("userId");

-- AddForeignKey
ALTER TABLE "trading_settings" ADD CONSTRAINT "trading_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
