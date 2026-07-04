-- CreateTable
CREATE TABLE "trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "entryPrice" REAL NOT NULL,
    "exitPrice" REAL NOT NULL,
    "size" REAL NOT NULL,
    "pnl" REAL NOT NULL,
    "tradeDate" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "trade_userId_tradeDate_idx" ON "trade"("userId", "tradeDate");
