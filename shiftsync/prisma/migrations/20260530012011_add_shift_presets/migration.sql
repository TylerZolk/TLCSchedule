-- CreateTable
CREATE TABLE "ShiftPreset" (
    "id" SERIAL NOT NULL,
    "restaurant" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start" INTEGER NOT NULL,
    "end" INTEGER NOT NULL,
    "position" TEXT,

    CONSTRAINT "ShiftPreset_pkey" PRIMARY KEY ("id")
);
