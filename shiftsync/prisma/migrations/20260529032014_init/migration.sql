-- CreateTable
CREATE TABLE "User" (
    "pin" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "restaurant" TEXT,
    "position" TEXT,
    "username" TEXT,
    "password" TEXT,
    "wage" DOUBLE PRECISION,
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("pin")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" SERIAL NOT NULL,
    "pin" INTEGER NOT NULL,
    "day" TEXT NOT NULL,
    "unavailable" BOOLEAN NOT NULL DEFAULT false,
    "start" INTEGER NOT NULL DEFAULT 9,
    "end" INTEGER NOT NULL DEFAULT 17,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" SERIAL NOT NULL,
    "pin" INTEGER NOT NULL,
    "day" TEXT NOT NULL,
    "start" INTEGER NOT NULL,
    "end" INTEGER NOT NULL,
    "position" TEXT,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftSlot" (
    "id" TEXT NOT NULL,
    "restaurant" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "start" INTEGER NOT NULL,
    "end" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ShiftSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwapRequest" (
    "id" TEXT NOT NULL,
    "fromPin" INTEGER NOT NULL,
    "fromDay" TEXT NOT NULL,
    "toPin" INTEGER NOT NULL,
    "toDay" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwapRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishedAt" (
    "restaurant" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublishedAt_pkey" PRIMARY KEY ("restaurant")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Availability_pin_day_key" ON "Availability"("pin", "day");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_pin_day_key" ON "Shift"("pin", "day");

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_pin_fkey" FOREIGN KEY ("pin") REFERENCES "User"("pin") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_pin_fkey" FOREIGN KEY ("pin") REFERENCES "User"("pin") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapRequest" ADD CONSTRAINT "SwapRequest_fromPin_fkey" FOREIGN KEY ("fromPin") REFERENCES "User"("pin") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapRequest" ADD CONSTRAINT "SwapRequest_toPin_fkey" FOREIGN KEY ("toPin") REFERENCES "User"("pin") ON DELETE RESTRICT ON UPDATE CASCADE;
