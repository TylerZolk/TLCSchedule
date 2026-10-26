-- "open" is added by the next migration, so it must not be referenced here
UPDATE "Availability" SET unavailable = true WHERE unavailable = false AND start = 9 AND "end" = 17;
