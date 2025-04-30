-- CreateTable
CREATE TABLE "ChurnFeature" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "plan" TEXT NOT NULL,
    "daysSinceActivity" INTEGER NOT NULL,
    "eventsLast30" INTEGER NOT NULL,
    "revenueLast30" DOUBLE PRECISION NOT NULL,
    "churned" BOOLEAN NOT NULL,

    CONSTRAINT "ChurnFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" SERIAL NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "total" INTEGER NOT NULL,
    "churned" INTEGER NOT NULL,
    "churnRate" DOUBLE PRECISION NOT NULL,
    "avgDaysActivity" DOUBLE PRECISION NOT NULL,
    "byPlan" JSONB NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceledAt" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_reportDate_key" ON "DailyReport"("reportDate");
