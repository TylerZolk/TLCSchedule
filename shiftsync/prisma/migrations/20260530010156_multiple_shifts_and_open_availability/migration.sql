-- DropIndex
DROP INDEX "Shift_pin_day_key";

-- AlterTable
ALTER TABLE "Availability" ADD COLUMN     "open" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "unavailable" SET DEFAULT true;
