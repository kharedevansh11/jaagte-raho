-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('GREEN', 'AMBER', 'RED', 'MISSED');

-- CreateEnum
CREATE TYPE "CallKind" AS ENUM ('WELCOME', 'CHECK_IN', 'OWNER_ALERT');

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'hi',
    "ownerName" TEXT,
    "ownerPhone" TEXT,
    "shiftStart" TEXT NOT NULL DEFAULT '22:00',
    "shiftEnd" TEXT NOT NULL DEFAULT '06:00',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "lastLevel" "AlertLevel",
    "lastCallAt" TIMESTAMP(3),
    "nextCallAt" TIMESTAMP(3),
    "lastAlertAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "kind" "CallKind" NOT NULL,
    "executionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "level" "AlertLevel",
    "score" INTEGER,
    "reasons" TEXT,
    "transcript" TEXT,
    "summary" TEXT,
    "location" TEXT,
    "passenger" BOOLEAN,
    "question" TEXT,
    "durationSec" DOUBLE PRECISION,
    "recordingUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Owner_clerkUserId_key" ON "Owner"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_phone_key" ON "Driver"("phone");

-- CreateIndex
CREATE INDEX "Driver_active_nextCallAt_idx" ON "Driver"("active", "nextCallAt");

-- CreateIndex
CREATE INDEX "Driver_ownerId_idx" ON "Driver"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Call_executionId_key" ON "Call"("executionId");

-- CreateIndex
CREATE INDEX "Call_driverId_createdAt_idx" ON "Call"("driverId", "createdAt");

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

