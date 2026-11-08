-- This is an empty migration.

-- Enforce one open loan per equipment item (SQLite partial unique index)
CREATE UNIQUE INDEX "loans_equipment_id_open_unique" ON "loans"("equipment_id") WHERE "returned_at" IS NULL;
