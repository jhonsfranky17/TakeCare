-- Lower the refill-soon threshold from 7 to 3 days. There's no per-medicine
-- UI for this (AddMedicineSheet never lets you edit refill_threshold_days,
-- only set it implicitly at creation), so this is a global change: update
-- the column default for medicines added from here on, and backfill every
-- existing medicine to match -- otherwise "bring the threshold down" would
-- silently do nothing for the family's existing medicines.
alter table medicines alter column refill_threshold_days set default 3;
update medicines set refill_threshold_days = 3;
