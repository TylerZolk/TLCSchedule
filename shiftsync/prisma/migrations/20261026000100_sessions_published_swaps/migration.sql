-- DropForeignKey
ALTER TABLE "SwapRequest" DROP CONSTRAINT "SwapRequest_fromPin_fkey";

-- DropForeignKey
ALTER TABLE "SwapRequest" DROP CONSTRAINT "SwapRequest_toPin_fkey";

-- AlterTable
ALTER TABLE "SwapRequest" ADD COLUMN     "weekStart" TEXT NOT NULL DEFAULT '';

-- DropTable
DROP TABLE "PublishedAt";

-- CreateTable
CREATE TABLE "PublishedSchedule" (
    "restaurant" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "PublishedSchedule_pkey" PRIMARY KEY ("restaurant","weekStart")
);

-- CreateTable
CREATE TABLE "Session" (
    "token" TEXT NOT NULL,
    "pin" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("token")
);

-- AddForeignKey
ALTER TABLE "SwapRequest" ADD CONSTRAINT "SwapRequest_fromPin_fkey" FOREIGN KEY ("fromPin") REFERENCES "User"("pin") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapRequest" ADD CONSTRAINT "SwapRequest_toPin_fkey" FOREIGN KEY ("toPin") REFERENCES "User"("pin") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_pin_fkey" FOREIGN KEY ("pin") REFERENCES "User"("pin") ON DELETE CASCADE ON UPDATE CASCADE;


-- Non-TLC staff were created with "available 9-5 every day" and the app hid
-- those rows on load. Turn the untouched defaults into "unavailable" so the
-- filter can go and real submissions are kept.
UPDATE "Availability" a SET "unavailable" = true
FROM "User" u
WHERE a."pin" = u."pin"
  AND u."restaurant" IS DISTINCT FROM 'tlc'
  AND a."unavailable" = false AND a."open" = false
  AND a."start" = 9 AND a."end" = 17;
